import 'dart:async';
import 'dart:convert';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import '../../core/constants/hardware_config_constants.dart';
import '../interfaces/hardware_transport_adapter.dart';
import '../protocol/hardware_command.dart';
import '../protocol/hardware_response.dart';

/// Production Bluetooth Low Energy GATT Transport Adapter.
/// Interfaces with ESP32 NimBLE / Bluedroid GATT Server.
class BluetoothLeAdapter implements HardwareTransportAdapter {
  final _connectionStateController = StreamController<HardwareConnectionState>.broadcast();
  final _eventsController = StreamController<Map<String, dynamic>>.broadcast();

  HardwareConnectionState _state = HardwareConnectionState.disconnected;
  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _commandChar;
  BluetoothCharacteristic? _responseChar;
  BluetoothCharacteristic? _statusChar;
  StreamSubscription? _scanSub;
  StreamSubscription? _deviceStateSub;

  final Map<String, Completer<HardwareResponse>> _pendingRequests = {};

  @override
  TransportType get transportType => TransportType.bluetoothLe;

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

    await FlutterBluePlus.startScan(
      withServices: [Guid(HardwareConfigConstants.bleServiceUuid)],
      timeout: timeout ?? HardwareConfigConstants.bleScanTimeout,
    );

    _scanSub = FlutterBluePlus.scanResults.listen((results) {
      for (final r in results) {
        final name = r.device.platformName.isNotEmpty ? r.device.platformName : r.advertisementData.advName;
        if (name.startsWith(HardwareConfigConstants.bleDeviceNamePrefix) ||
            name.startsWith(HardwareConfigConstants.bleAltDeviceNamePrefix) ||
            r.advertisementData.serviceUuids.contains(Guid(HardwareConfigConstants.bleServiceUuid))) {
          controller.add(DiscoveredDevice(
            id: r.device.remoteId.str,
            name: name.isNotEmpty ? name : 'Smart Clock BLE',
            rssi: r.rssi,
            transportType: TransportType.bluetoothLe,
            metadata: {'rawDevice': r.device},
          ));
        }
      }
    });

    return controller.stream;
  }

  @override
  Future<void> stopScan() async {
    await FlutterBluePlus.stopScan();
    await _scanSub?.cancel();
    if (_state == HardwareConnectionState.scanning) {
      _updateState(HardwareConnectionState.disconnected);
    }
  }

  @override
  Future<bool> connect(String deviceIdentifier, {Map<String, dynamic>? parameters}) async {
    try {
      _updateState(HardwareConnectionState.connecting);
      final device = BluetoothDevice.fromId(deviceIdentifier);
      _connectedDevice = device;

      await device.connect(timeout: HardwareConfigConstants.connectTimeout);
      _updateState(HardwareConnectionState.synchronizing);

      // Request MTU of 512 bytes
      try {
        await device.requestMtu(HardwareConfigConstants.bleMtuNegotiatedSize);
      } catch (_) {
        // MTU exchange optional on iOS
      }

      // Discover GATT Services
      final services = await device.discoverServices();
      for (final svc in services) {
        if (svc.uuid == Guid(HardwareConfigConstants.bleServiceUuid)) {
          for (final char in svc.characteristics) {
            if (char.uuid == Guid(HardwareConfigConstants.bleCommandCharUuid)) {
              _commandChar = char;
            } else if (char.uuid == Guid(HardwareConfigConstants.bleResponseCharUuid)) {
              _responseChar = char;
              await char.setNotifyValue(true);
              char.lastValueStream.listen(_handleIncomingResponse);
            } else if (char.uuid == Guid(HardwareConfigConstants.bleStatusCharUuid)) {
              _statusChar = char;
            }
          }
        }
      }

      if (_commandChar == null) {
        throw Exception('Required GATT Command characteristic not found on device.');
      }

      _deviceStateSub = device.connectionState.listen((s) {
        if (s == BluetoothConnectionState.disconnected) {
          _updateState(HardwareConnectionState.disconnected);
        }
      });

      _updateState(HardwareConnectionState.connected);
      return true;
    } catch (e) {
      _updateState(HardwareConnectionState.connectionFailed);
      return false;
    }
  }

  void _handleIncomingResponse(List<int> rawBytes) {
    if (rawBytes.isEmpty) return;
    try {
      final jsonStr = utf8.decode(rawBytes);
      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      final resp = HardwareResponse.fromJson(map);

      final completer = _pendingRequests.remove(resp.requestId);
      completer?.complete(resp);
    } catch (e) {
      // Malformed frame or packet fragment
    }
  }

  @override
  Future<void> disconnect() async {
    await _deviceStateSub?.cancel();
    await _connectedDevice?.disconnect();
    _connectedDevice = null;
    _commandChar = null;
    _responseChar = null;
    _updateState(HardwareConnectionState.disconnected);
  }

  @override
  Future<HardwareResponse> sendCommand(HardwareCommand command) async {
    if (_state != HardwareConnectionState.connected || _commandChar == null) {
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_BLE_NOT_CONNECTED',
        message: 'BLE device is not connected.',
      );
    }

    final completer = Completer<HardwareResponse>();
    _pendingRequests[command.requestId] = completer;

    try {
      final payloadBytes = utf8.encode(command.serialize());
      await _commandChar!.write(payloadBytes, withoutResponse: false);

      return await completer.future.timeout(
        command.timeout,
        onTimeout: () {
          _pendingRequests.remove(command.requestId);
          return HardwareResponse.failure(
            requestId: command.requestId,
            code: 'ERR_BLE_TIMEOUT',
            message: 'Command timed out waiting for BLE response.',
          );
        },
      );
    } catch (e) {
      _pendingRequests.remove(command.requestId);
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_BLE_WRITE_FAILED',
        message: e.toString(),
      );
    }
  }

  @override
  Future<void> dispose() async {
    await disconnect();
    await _connectionStateController.close();
    await _eventsController.close();
  }
}
