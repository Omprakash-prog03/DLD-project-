import { Alarm, ClockTime, DeviceStatus, DiagnosticsData, IDeviceService, SoundType } from '../../types';
import { DEFAULT_NETWORK_CONFIG } from '../../config/deviceConfig';

export class HardwareDevice implements IDeviceService {
  private ipAddress: string;
  private port: number;
  private timeoutMs: number;
  private lastKnownStatus: DeviceStatus | null = null;
  private isCurrentlyConnected: boolean = false;

  constructor(ipAddress: string = DEFAULT_NETWORK_CONFIG.defaultApIp, port: number = DEFAULT_NETWORK_CONFIG.defaultPort) {
    this.ipAddress = ipAddress.trim();
    this.port = port;
    this.timeoutMs = DEFAULT_NETWORK_CONFIG.timeoutMs;
  }

  public setConnection(ip: string, port: number = DEFAULT_NETWORK_CONFIG.defaultPort): void {
    this.ipAddress = ip.trim();
    this.port = port;
  }

  public getIp(): string {
    return this.ipAddress;
  }

  public getLastKnownStatus(): DeviceStatus | null {
    return this.lastKnownStatus;
  }

  public isConnected(): boolean {
    return this.isCurrentlyConnected;
  }

  private getBaseUrl(): string {
    let clean = this.ipAddress.replace(/^https?:\/\//, '').replace(/\/$/, '');
    // Validate IP format
    const ipRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    const isHostname = clean.includes('.local') || clean === 'localhost';

    if (!ipRegex.test(clean) && !isHostname) {
      throw new Error(`Invalid IP address format: "${this.ipAddress}". Expected e.g. 192.168.4.1`);
    }

    return `http://${clean}${this.port !== 80 ? `:${this.port}` : ''}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorMsg = `ESP32 returned HTTP ${response.status}: ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.message) errorMsg = errBody.message;
        } catch {
          // non-JSON error
        }
        throw new Error(errorMsg);
      }

      const json = await response.json();
      this.isCurrentlyConnected = true;
      return json;
    } catch (err: unknown) {
      clearTimeout(timer);
      this.isCurrentlyConnected = false;

      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error(`Device communication timeout: ESP32 at ${this.ipAddress} did not respond within ${this.timeoutMs}ms.`);
        }
        if (isHttps && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
          throw new Error(
            `Browser Mixed-Content Block: Deployed HTTPS site cannot issue direct HTTP calls to local IP ${this.ipAddress}. Connect via local HTTP or run standalone simulation mode.`
          );
        }
        throw err;
      }
      throw new Error('Unknown hardware communication failure with ESP32');
    }
  }

  /**
   * Safe request with retry for idempotent GET requests only.
   */
  private async requestWithRetry<T>(endpoint: string, retries: number = 2): Promise<T> {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request<T>(endpoint, { method: 'GET' });
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastErr;
  }

  public async getStatus(): Promise<DeviceStatus> {
    try {
      const data = await this.requestWithRetry<{
        connected: boolean;
        device: string;
        clockSource: string;
        rtcStatus: string;
        alarmCount: number;
        buzzerStatus: boolean;
        firmwareVersion: string;
        wifiMode?: 'AP' | 'STA';
        wifiSSID?: string;
        rssi?: number;
        uptime?: number;
        freeHeap?: number;
      }>('/api/status', 1);

      const status: DeviceStatus = {
        connected: true,
        deviceName: data.device || 'ESP32-WROOM-32',
        ipAddress: this.ipAddress,
        clockSource: (data.clockSource as any) || 'DS3231',
        rtcAvailable: data.rtcStatus === 'available' || data.rtcStatus === 'OK',
        firmwareVersion: data.firmwareVersion || '1.2.0',
        lastSeen: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        buzzerActive: Boolean(data.buzzerStatus),
        operatingMode: 'hardware',
        connectionState: 'connected',
        wifiMode: data.wifiMode || 'AP',
        wifiSSID: data.wifiSSID || DEFAULT_NETWORK_CONFIG.defaultApSsid,
        rssi: data.rssi,
        uptimeSeconds: data.uptime,
        freeHeap: data.freeHeap,
      };

      this.lastKnownStatus = status;
      return status;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Report last known status separately from current disconnected state
      return {
        connected: false,
        deviceName: this.lastKnownStatus?.deviceName || 'ESP32-WROOM-32',
        ipAddress: this.ipAddress,
        clockSource: this.lastKnownStatus?.clockSource || 'DS3231',
        rtcAvailable: false, // Never falsely report hardware as detected when disconnected!
        firmwareVersion: this.lastKnownStatus?.firmwareVersion || 'Unknown',
        lastSeen: this.lastKnownStatus?.lastSeen || null,
        lastSync: this.lastKnownStatus?.lastSync || null,
        buzzerActive: false,
        operatingMode: 'hardware',
        connectionState: 'disconnected',
        errorMessage: msg,
      };
    }
  }

  public async getTime(): Promise<ClockTime> {
    const data = await this.requestWithRetry<{
      hour: number;
      minute: number;
      second: number;
      day: number;
      month: number;
      year: number;
      source: string;
      timezone?: string;
    }>('/api/time', 1);

    return {
      hour: Number(data.hour),
      minute: Number(data.minute),
      second: Number(data.second),
      day: Number(data.day),
      month: Number(data.month),
      year: Number(data.year),
      source: (data.source as any) || 'DS3231',
      timezone: data.timezone || DEFAULT_NETWORK_CONFIG.timezone,
    };
  }

  public async setTime(time: Partial<ClockTime>): Promise<{ success: boolean; message: string }> {
    // Frontend validation before issuing hardware command
    if (time.hour !== undefined && (time.hour < 0 || time.hour > 23)) {
      throw new Error(`Invalid hour value: ${time.hour}. Must be 0-23.`);
    }
    if (time.minute !== undefined && (time.minute < 0 || time.minute > 59)) {
      throw new Error(`Invalid minute value: ${time.minute}. Must be 0-59.`);
    }
    if (time.second !== undefined && (time.second < 0 || time.second > 59)) {
      throw new Error(`Invalid second value: ${time.second}. Must be 0-59.`);
    }
    if (time.month !== undefined && (time.month < 1 || time.month > 12)) {
      throw new Error(`Invalid month: ${time.month}. Must be 1-12.`);
    }

    const payload = {
      hour: time.hour ?? 0,
      minute: time.minute ?? 0,
      second: time.second ?? 0,
      day: time.day ?? 1,
      month: time.month ?? 1,
      year: time.year ?? 2026,
    };

    const res = await this.request<{ success: boolean; message: string }>('/api/time', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      success: res.success !== false,
      message: res.message || 'Time updated on ESP32 & DS3231 RTC',
    };
  }

  public async getAlarms(): Promise<Alarm[]> {
    const alarms = await this.requestWithRetry<any[]>('/api/alarms', 1);

    return alarms.map((a) => ({
      id: String(a.id),
      title: a.title || 'Alarm',
      description: a.description || '',
      hour: Number(a.hour),
      minute: Number(a.minute),
      second: Number(a.second || 0),
      enabled: Boolean(a.enabled),
      repeatType: a.repeat?.type || a.repeatType || 'once',
      repeatDays: a.repeat?.days || a.repeatDays || [],
      date: a.date || null,
      soundId: a.soundId || 'buzzer-standard',
      snoozeDuration: Number(a.snoozeDuration ?? 10),
      wakeUpMission: Boolean(a.wakeUpMission),
      createdAt: a.createdAt || new Date().toISOString(),
      updatedAt: a.updatedAt || new Date().toISOString(),
      lastTriggeredAt: a.lastTriggeredAt || null,
      syncStatus: 'synced',
    }));
  }

  public async createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    // Validate repeat schedule
    if (alarm.repeatType === 'custom' && (!alarm.repeatDays || alarm.repeatDays.length === 0)) {
      throw new Error('Custom repeat schedule requires at least one selected day of the week');
    }

    const payload = {
      title: alarm.title.trim() || 'Alarm',
      description: alarm.description || '',
      hour: alarm.hour,
      minute: alarm.minute,
      second: alarm.second ?? 0,
      enabled: alarm.enabled,
      repeat: {
        type: alarm.repeatType,
        days: alarm.repeatDays,
      },
      soundId: alarm.soundId,
      snoozeDuration: alarm.snoozeDuration,
      wakeUpMission: alarm.wakeUpMission,
      date: alarm.date,
    };

    try {
      const res = await this.request<any>('/api/alarms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        id: String(res.id || res.data?.id || `alm-${Date.now()}`),
        title: alarm.title,
        description: alarm.description,
        hour: alarm.hour,
        minute: alarm.minute,
        second: alarm.second ?? 0,
        enabled: alarm.enabled,
        repeatType: alarm.repeatType,
        repeatDays: alarm.repeatDays,
        date: alarm.date,
        soundId: alarm.soundId,
        snoozeDuration: alarm.snoozeDuration,
        wakeUpMission: alarm.wakeUpMission,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastTriggeredAt: null,
        syncStatus: 'synced',
      };
    } catch (err) {
      // On timeout: Check device state BEFORE retrying to prevent duplicate alarm creation!
      try {
        const existingAlarms = await this.getAlarms();
        const matched = existingAlarms.find(
          (a) => a.hour === alarm.hour && a.minute === alarm.minute && a.title === alarm.title
        );
        if (matched) {
          // Device already received and saved the alarm!
          return matched;
        }
      } catch {
        // Device check failed as well
      }
      throw err;
    }
  }

  public async updateAlarm(id: string, alarm: Partial<Alarm>): Promise<Alarm> {
    const payload: any = {};
    if (alarm.title !== undefined) payload.title = alarm.title;
    if (alarm.description !== undefined) payload.description = alarm.description;
    if (alarm.hour !== undefined) payload.hour = alarm.hour;
    if (alarm.minute !== undefined) payload.minute = alarm.minute;
    if (alarm.second !== undefined) payload.second = alarm.second;
    if (alarm.enabled !== undefined) payload.enabled = alarm.enabled;
    if (alarm.repeatType !== undefined || alarm.repeatDays !== undefined) {
      payload.repeat = {
        type: alarm.repeatType,
        days: alarm.repeatDays,
      };
    }
    if (alarm.soundId !== undefined) payload.soundId = alarm.soundId;
    if (alarm.snoozeDuration !== undefined) payload.snoozeDuration = alarm.snoozeDuration;
    if (alarm.wakeUpMission !== undefined) payload.wakeUpMission = alarm.wakeUpMission;
    if (alarm.date !== undefined) payload.date = alarm.date;

    await this.request<any>(`/api/alarms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return {
      id,
      title: alarm.title || 'Alarm',
      hour: alarm.hour ?? 0,
      minute: alarm.minute ?? 0,
      enabled: alarm.enabled ?? true,
      repeatType: alarm.repeatType ?? 'once',
      repeatDays: alarm.repeatDays ?? [],
      date: alarm.date ?? null,
      soundId: alarm.soundId ?? 'buzzer-standard',
      snoozeDuration: alarm.snoozeDuration ?? 10,
      wakeUpMission: alarm.wakeUpMission ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: null,
      syncStatus: 'synced',
    };
  }

  public async deleteAlarm(id: string): Promise<boolean> {
    await this.request<any>(`/api/alarms/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  public async toggleAlarm(id: string, enabled?: boolean): Promise<Alarm> {
    await this.request<any>(`/api/alarms/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });

    // Fetch refreshed list to return updated record
    const all = await this.getAlarms();
    const updated = all.find((a) => a.id === id);
    if (!updated) {
      throw new Error(`Alarm ${id} not found on ESP32`);
    }
    return updated;
  }

  public async dismissAlarm(id: string): Promise<boolean> {
    await this.request<any>(`/api/alarms/${id}/dismiss`, {
      method: 'POST',
    });
    return true;
  }

  public async snoozeAlarm(id: string, minutes: number): Promise<boolean> {
    await this.request<any>(`/api/alarms/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
    return true;
  }

  public async getDiagnostics(): Promise<DiagnosticsData> {
    const health = await this.requestWithRetry<any>('/api/device/health', 1);
    const status = await this.getStatus();

    return {
      deviceStatus: status,
      i2cAddressesFound: health.i2cScan || ['0x68 (DS3231 RTC)'],
      ds3231TempCelsius: health.temperatureCelsius,
      ne555FrequencyHz: health.ne555Freq || 1.0,
      cd4518CounterSync: health.cd4518CounterSync !== false,
      logicGatesStatus: health.logicGatesStatus || '3.3V to 5.0V 74HCT245 Bus Buffer Active',
      gpioConfig: health.gpioConfig || {
        buzzerPin: 25,
        i2cSdaPin: 21,
        i2cSclPin: 22,
        counterResetPin: 26,
        ppsInterruptPin: 34,
      },
      recentLogs: health.logs || [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'ESP32 health telemetry report retrieved successfully',
        },
      ],
    };
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    await this.request<any>('/api/status');
    const latency = Math.round(performance.now() - start);

    return {
      success: true,
      latencyMs: latency,
      message: `ESP32 responsive at ${this.ipAddress} (${latency}ms round-trip)`,
    };
  }

  public async triggerBuzzerTest(soundId: SoundType, durationMs: number): Promise<boolean> {
    await this.request<any>('/api/device/buzzer-test', {
      method: 'POST',
      body: JSON.stringify({ soundId, durationMs }),
    });
    return true;
  }
}
