import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/hardware_config_constants.dart';
import '../interfaces/hardware_transport_adapter.dart';
import '../protocol/hardware_command.dart';
import '../protocol/hardware_response.dart';
import '../protocol/command_registry.dart';

/// Production Local Wi-Fi (SoftAP & LAN) Transport Adapter.
/// Interfaces with ESP32 WebServer REST API.
class WiFiAdapter implements HardwareTransportAdapter {
  final _connectionStateController = StreamController<HardwareConnectionState>.broadcast();
  final _eventsController = StreamController<Map<String, dynamic>>.broadcast();

  HardwareConnectionState _state = HardwareConnectionState.disconnected;
  String _baseUrl = "http://${HardwareConfigConstants.wifiDefaultApIp}:${HardwareConfigConstants.wifiHttpPort}";
  final http.Client _client = http.Client();

  @override
  TransportType get transportType => TransportType.wifiRest;

  @override
  HardwareConnectionState get connectionState => _state;

  @override
  Stream<HardwareConnectionState> get connectionStateStream => _connectionStateController.stream;

  @override
  Stream<Map<String, dynamic>> get asynchronousEventsStream => _eventsController.stream;

  @override
  Future<void> initialize() async {
    _updateState(HardwareConnectionState.disconnected);
  }

  void _updateState(HardwareConnectionState newState) {
    _state = newState;
    _connectionStateController.add(newState);
  }

  @override
  Future<Stream<DiscoveredDevice>> startScan({Duration? timeout}) async {
    _updateState(HardwareConnectionState.scanning);
    final controller = StreamController<DiscoveredDevice>();

    // Test ping to default SoftAP gateway
    Future.microtask(() async {
      try {
        final uri = Uri.parse("$_baseUrl${HardwareConfigConstants.endpointStatus}");
        final resp = await _client.get(uri).timeout(const Duration(seconds: 3));
        if (resp.statusCode == 200) {
          controller.add(DiscoveredDevice(
            id: HardwareConfigConstants.wifiDefaultApIp,
            name: 'Smart Clock (Wi-Fi AP)',
            rssi: -45,
            transportType: TransportType.wifiRest,
            metadata: {'ip': HardwareConfigConstants.wifiDefaultApIp},
          ));
        }
      } catch (_) {
        // SoftAP not reachable
      }
    });

    return controller.stream;
  }

  @override
  Future<void> stopScan() async {
    if (_state == HardwareConnectionState.scanning) {
      _updateState(HardwareConnectionState.disconnected);
    }
  }

  @override
  Future<bool> connect(String deviceIdentifier, {Map<String, dynamic>? parameters}) async {
    try {
      _updateState(HardwareConnectionState.connecting);
      if (deviceIdentifier.contains('.') || deviceIdentifier.contains('http')) {
        _baseUrl = deviceIdentifier.startsWith('http')
            ? deviceIdentifier
            : "http://$deviceIdentifier:${HardwareConfigConstants.wifiHttpPort}";
      }

      final uri = Uri.parse("$_baseUrl${HardwareConfigConstants.endpointStatus}");
      final res = await _client.get(uri).timeout(HardwareConfigConstants.connectTimeout);

      if (res.statusCode == 200) {
        _updateState(HardwareConnectionState.connected);
        return true;
      }
      _updateState(HardwareConnectionState.connectionFailed);
      return false;
    } catch (e) {
      _updateState(HardwareConnectionState.connectionFailed);
      return false;
    }
  }

  @override
  Future<void> disconnect() async {
    _updateState(HardwareConnectionState.disconnected);
  }

  @override
  Future<HardwareResponse> sendCommand(HardwareCommand command) async {
    if (_state != HardwareConnectionState.connected) {
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_WIFI_NOT_CONNECTED',
        message: 'Wi-Fi transport is disconnected.',
      );
    }

    try {
      String endpoint = HardwareConfigConstants.endpointStatus;
      String method = 'GET';
      Map<String, dynamic>? body = command.payload;

      switch (command.command) {
        case CommandRegistry.getDeviceInfo:
        case CommandRegistry.getDeviceStatus:
          endpoint = HardwareConfigConstants.endpointStatus;
          method = 'GET';
          break;
        case CommandRegistry.getClockTime:
        case CommandRegistry.getRtcStatus:
          endpoint = HardwareConfigConstants.endpointTime;
          method = 'GET';
          break;
        case CommandRegistry.setClockTime:
        case CommandRegistry.syncClock:
          endpoint = HardwareConfigConstants.endpointTime;
          method = 'POST';
          break;
        case CommandRegistry.getAlarms:
          endpoint = HardwareConfigConstants.endpointAlarms;
          method = 'GET';
          break;
        case CommandRegistry.createAlarm:
          endpoint = HardwareConfigConstants.endpointAlarms;
          method = 'POST';
          break;
        case CommandRegistry.updateAlarm:
          final id = command.payload['alarm_id'] ?? command.payload['id'];
          endpoint = "${HardwareConfigConstants.endpointAlarms}/$id";
          method = 'PUT';
          break;
        case CommandRegistry.deleteAlarm:
          final id = command.payload['alarm_id'] ?? command.payload['id'];
          endpoint = "${HardwareConfigConstants.endpointAlarms}/$id";
          method = 'DELETE';
          break;
        case CommandRegistry.stopAlarm:
          endpoint = HardwareConfigConstants.endpointAlarmsDismiss;
          method = 'POST';
          break;
        case CommandRegistry.snoozeAlarm:
          endpoint = HardwareConfigConstants.endpointAlarmsSnooze;
          method = 'POST';
          break;
      }

      final uri = Uri.parse("$_baseUrl$endpoint");
      http.Response response;

      if (method == 'GET') {
        response = await _client.get(uri).timeout(command.timeout);
      } else if (method == 'POST') {
        response = await _client
            .post(uri, headers: {'Content-Type': 'application/json'}, body: jsonEncode(body))
            .timeout(command.timeout);
      } else if (method == 'PUT') {
        response = await _client
            .put(uri, headers: {'Content-Type': 'application/json'}, body: jsonEncode(body))
            .timeout(command.timeout);
      } else if (method == 'DELETE') {
        response = await _client.delete(uri).timeout(command.timeout);
      } else {
        response = await _client.get(uri).timeout(command.timeout);
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: data,
        );
      } else {
        return HardwareResponse.failure(
          requestId: command.requestId,
          code: 'ERR_HTTP_${response.statusCode}',
          message: response.body,
        );
      }
    } catch (e) {
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_WIFI_REQUEST_FAILED',
        message: e.toString(),
      );
    }
  }

  @override
  Future<void> dispose() async {
    _client.close();
    await _connectionStateController.close();
    await _eventsController.close();
  }
}
