import 'dart:async';
import '../protocol/hardware_command.dart';
import '../protocol/hardware_response.dart';

enum TransportType {
  mock,
  bluetoothLe,
  wifiRest,
  wifiWebSocket,
}

enum HardwareConnectionState {
  disconnected,
  scanning,
  connecting,
  connected,
  synchronizing,
  connectionFailed,
}

class DiscoveredDevice {
  final String id;
  final String name;
  final int rssi;
  final TransportType transportType;
  final Map<String, dynamic> metadata;

  const DiscoveredDevice({
    required this.id,
    required this.name,
    required this.rssi,
    required this.transportType,
    this.metadata = const {},
  });
}

/// Abstract contract for any physical or simulated hardware transport layer.
/// The UI and business logic interact exclusively through this interface.
abstract class HardwareTransportAdapter {
  TransportType get transportType;
  HardwareConnectionState get connectionState;
  Stream<HardwareConnectionState> get connectionStateStream;
  Stream<Map<String, dynamic>> get asynchronousEventsStream;

  Future<void> initialize();
  Future<Stream<DiscoveredDevice>> startScan({Duration? timeout});
  Future<void> stopScan();
  Future<bool> connect(String deviceIdentifier, {Map<String, dynamic>? parameters});
  Future<void> disconnect();
  Future<HardwareResponse> sendCommand(HardwareCommand command);
  Future<void> dispose();
}
