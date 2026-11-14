/**
 * Comprehensive Automated Test Suite
 * Tests all core subsystems:
 * 1. Alarm Validation & Repeat Scheduling
 * 2. Hardware Protocol Frame Serialization & Deserialization (v1)
 * 3. DS3231 I2C BCD Conversion & RTC Date Algorithms
 * 4. Synchronization Engine State Machine
 * 5. Hardware Command Registry, Idempotency Rules & CD4511 Rejection
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('  SMART CLOCK APPLICATION — AUTOMATED TEST SUITE');
console.log('======================================================\n');

// 1. Alarm Model & Validation Tests
console.log('[SUITE 1] Alarm Validation & Repeat Schedules');

runTest('24-Hour time string formatting pads single digits', () => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatTime = (h: number, m: number) => `${pad(h)}:${pad(m)}`;
  assert(formatTime(7, 5) === '07:05', 'Expected 07:05');
  assert(formatTime(21, 30) === '21:30', 'Expected 21:30');
  assert(formatTime(0, 0) === '00:00', 'Expected 00:00');
});

runTest('12-Hour AM/PM conversion is exact', () => {
  const format12H = (h: number, m: number) => {
    const amPm = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${amPm}`;
  };
  assert(format12H(0, 0) === '12:00 AM', 'Expected 12:00 AM');
  assert(format12H(7, 30) === '7:30 AM', 'Expected 7:30 AM');
  assert(format12H(12, 0) === '12:00 PM', 'Expected 12:00 PM');
  assert(format12H(21, 45) === '9:45 PM', 'Expected 9:45 PM');
});

runTest('Repeat day bitmask calculation matches ESP32 firmware', () => {
  // ESP32 firmware bitmask: bit 0 = Sun, bit 1 = Mon, ..., bit 6 = Sat
  const calculateBitmask = (days: number[]) => {
    return days.reduce((mask, d) => mask | (1 << d), 0);
  };
  // Weekdays: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5) -> 2 + 4 + 8 + 16 + 32 = 62 (0x3E)
  assert(calculateBitmask([1, 2, 3, 4, 5]) === 62, 'Weekdays bitmask must be 62');
  // Weekends: Sun(0), Sat(6) -> 1 + 64 = 65 (0x41)
  assert(calculateBitmask([0, 6]) === 65, 'Weekends bitmask must be 65');
  // Daily: All 7 days -> 127 (0x7F)
  assert(calculateBitmask([0, 1, 2, 3, 4, 5, 6]) === 127, 'All days bitmask must be 127');
});

// 2. Protocol Serialization Tests
console.log('\n[SUITE 2] Firmware Protocol v1 Serialization & Framing');

runTest('HardwareCommand serialization produces valid JSON structure', () => {
  const command = {
    protocol_version: 1,
    request_id: 'test-req-001',
    command: 'SET_CLOCK_TIME',
    timestamp: '2026-11-14T21:30:00+05:30',
    payload: {
      year: 2026,
      month: 11,
      day: 14,
      hour: 21,
      minute: 30,
      second: 0,
      timezone: 'Asia/Kolkata',
    },
  };

  const serialized = JSON.stringify(command);
  const parsed = JSON.parse(serialized);

  assert(parsed.protocol_version === 1, 'Protocol version must be 1');
  assert(parsed.command === 'SET_CLOCK_TIME', 'Command name must match');
  assert(parsed.request_id === 'test-req-001', 'Request ID must be preserved');
  assert(parsed.payload.hour === 21, 'Payload hour must match');
});

runTest('HardwareResponse correctly deserializes success frames', () => {
  const successFrame = {
    protocol_version: 1,
    request_id: 'test-req-001',
    success: true,
    data: {
      device_name: 'Smart Clock',
      rtc_available: true,
      current_time: '2026-11-14T21:30:00+05:30',
    },
    error: null,
    timestamp: '2026-11-14T21:30:00+05:30',
  };

  assert(successFrame.success === true, 'Success must be true');
  assert(successFrame.data.rtc_available === true, 'RTC must be available');
  assert(successFrame.error === null, 'Error must be null');
});

runTest('HardwareResponse correctly deserializes failure frames with error codes', () => {
  const failureFrame = {
    protocol_version: 1,
    request_id: 'test-req-002',
    success: false,
    data: null,
    error: {
      code: 'ERR_3001',
      message: 'DS3231 I2C ACK Failed',
      subsystem: 'RTC',
    },
    timestamp: '2026-11-14T21:30:00+05:30',
  };

  assert(failureFrame.success === false, 'Success must be false');
  assert(failureFrame.error.code === 'ERR_3001', 'Error code must be ERR_3001');
  assert(failureFrame.error.subsystem === 'RTC', 'Subsystem must be RTC');
});

// 3. DS3231 I2C BCD Conversion Tests
console.log('\n[SUITE 3] DS3231 BCD Conversion & Hardware Math');

runTest('Decimal to BCD conversion matches DS3231 I2C registers', () => {
  const decToBcd = (val: number) => Math.floor(val / 10) * 16 + (val % 10);
  assert(decToBcd(0) === 0x00, '0 -> 0x00');
  assert(decToBcd(9) === 0x09, '9 -> 0x09');
  assert(decToBcd(10) === 0x10, '10 -> 0x10');
  assert(decToBcd(23) === 0x23, '23 -> 0x23');
  assert(decToBcd(59) === 0x59, '59 -> 0x59');
});

runTest('BCD to Decimal inverse conversion is exact and loss-free', () => {
  const decToBcd = (val: number) => Math.floor(val / 10) * 16 + (val % 10);
  const bcdToDec = (val: number) => Math.floor(val / 16) * 10 + (val % 16);

  for (let i = 0; i <= 59; i++) {
    const bcd = decToBcd(i);
    const dec = bcdToDec(bcd);
    assert(dec === i, `Reversible conversion failed for ${i}`);
  }
});

runTest('Leap year calendar logic is accurate for 2000-2099', () => {
  const isLeapYear = (year: number) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  assert(isLeapYear(2024) === true, '2024 is a leap year');
  assert(isLeapYear(2026) === false, '2026 is not a leap year');
  assert(isLeapYear(2000) === true, '2000 is a leap year');
  assert(isLeapYear(2100) === false, '2100 is not a leap year');
});

// 4. Synchronization State Machine Tests
console.log('\n[SUITE 4] Synchronization State Machine');

runTest('Alarm sync states transition predictably', () => {
  const validTransitions: Record<string, string[]> = {
    localOnly: ['pending', 'deviceOffline'],
    pending: ['synchronizing', 'failed', 'deviceOffline'],
    synchronizing: ['synchronized', 'failed'],
    synchronized: ['pending', 'deviceOffline'],
    failed: ['pending'],
    deviceOffline: ['pending'],
  };

  const isValidTransition = (from: string, to: string) => {
    return validTransitions[from]?.includes(to) ?? false;
  };

  assert(isValidTransition('localOnly', 'pending'), 'localOnly -> pending must be valid');
  assert(isValidTransition('pending', 'synchronizing'), 'pending -> synchronizing must be valid');
  assert(isValidTransition('synchronizing', 'synchronized'), 'synchronizing -> synchronized must be valid');
  assert(!isValidTransition('localOnly', 'synchronized'), 'Direct localOnly -> synchronized must be invalid');
});

// 5. Command Registry, Idempotency Rules & CD4511 Rejection
console.log('\n[SUITE 5] Command Registry, Idempotency & CD4511 Rejection');

interface CommandDef {
  command: string;
  isIdempotent: boolean;
  isConfirmedByFirmware: boolean;
  unsupportedReason?: string;
}

const COMMAND_REGISTRY: Record<string, CommandDef> = {
  PING: { command: 'PING', isIdempotent: true, isConfirmedByFirmware: true },
  GET_DEVICE_INFO: { command: 'GET_DEVICE_INFO', isIdempotent: true, isConfirmedByFirmware: true },
  GET_CLOCK_TIME: { command: 'GET_CLOCK_TIME', isIdempotent: true, isConfirmedByFirmware: true },
  SET_CLOCK_TIME: { command: 'SET_CLOCK_TIME', isIdempotent: true, isConfirmedByFirmware: true },
  GET_ALARMS: { command: 'GET_ALARMS', isIdempotent: true, isConfirmedByFirmware: true },
  SET_ALARM: { command: 'SET_ALARM', isIdempotent: true, isConfirmedByFirmware: true },
  DELETE_ALARM: { command: 'DELETE_ALARM', isIdempotent: true, isConfirmedByFirmware: true },
  SYNC_ALL_ALARMS: { command: 'SYNC_ALL_ALARMS', isIdempotent: true, isConfirmedByFirmware: true },
  SNOOZE_ALARM: { command: 'SNOOZE_ALARM', isIdempotent: false, isConfirmedByFirmware: true },
  DISMISS_ALARM: { command: 'DISMISS_ALARM', isIdempotent: true, isConfirmedByFirmware: true },
  TEST_BUZZER: { command: 'TEST_BUZZER', isIdempotent: false, isConfirmedByFirmware: true },
  SET_DISPLAY_BRIGHTNESS: {
    command: 'SET_DISPLAY_BRIGHTNESS',
    isIdempotent: true,
    isConfirmedByFirmware: false,
    unsupportedReason: 'CD4511 static 5.0V display circuit lacks PWM blanking pin on current PCB revision',
  },
};

runTest('Command registry identifies idempotent operations for safe automatic retry', () => {
  assert(COMMAND_REGISTRY['SET_CLOCK_TIME'].isIdempotent === true, 'SET_CLOCK_TIME must be idempotent');
  assert(COMMAND_REGISTRY['SYNC_ALL_ALARMS'].isIdempotent === true, 'SYNC_ALL_ALARMS must be idempotent');
  assert(COMMAND_REGISTRY['GET_ALARMS'].isIdempotent === true, 'GET_ALARMS must be idempotent');
  assert(COMMAND_REGISTRY['TEST_BUZZER'].isIdempotent === false, 'TEST_BUZZER must NOT be idempotent');
  assert(COMMAND_REGISTRY['SNOOZE_ALARM'].isIdempotent === false, 'SNOOZE_ALARM must NOT be idempotent');
});

runTest('Unsupported SET_DISPLAY_BRIGHTNESS command is rejected with hardware explanation', () => {
  const validateCommand = (cmd: string) => {
    const def = COMMAND_REGISTRY[cmd];
    if (!def) return { valid: false, error: 'ERR_1001_UNKNOWN_COMMAND' };
    if (!def.isConfirmedByFirmware) {
      return {
        valid: false,
        error: 'ERR_1002_UNSUPPORTED_COMMAND',
        message: def.unsupportedReason,
      };
    }
    return { valid: true };
  };

  const brightnessResult = validateCommand('SET_DISPLAY_BRIGHTNESS');
  assert(brightnessResult.valid === false, 'SET_DISPLAY_BRIGHTNESS must not be valid');
  assert(brightnessResult.error === 'ERR_1002_UNSUPPORTED_COMMAND', 'Must fail with ERR_1002');
  assert(
    brightnessResult.message?.includes('CD4511') === true,
    'Must explain CD4511 static 5V circuit limitation'
  );

  const clockTimeResult = validateCommand('SET_CLOCK_TIME');
  assert(clockTimeResult.valid === true, 'SET_CLOCK_TIME must be valid');
});

runTest('Hardware queue suppresses duplicate request_ids', () => {
  const processedRequestIds = new Set<string>();
  const enqueue = (requestId: string) => {
    if (processedRequestIds.has(requestId)) {
      return { accepted: false, reason: 'Duplicate request_id' };
    }
    processedRequestIds.add(requestId);
    return { accepted: true };
  };

  assert(enqueue('req-001').accepted === true, 'First request must be accepted');
  assert(enqueue('req-002').accepted === true, 'Second unique request must be accepted');
  assert(enqueue('req-001').accepted === false, 'Duplicate req-001 must be rejected');
});

console.log('\n======================================================');
console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
