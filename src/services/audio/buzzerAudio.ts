import { SoundType } from '../../types';

class BuzzerAudioService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private currentPatternTimer: number | null = null;
  private activeOscillators: OscillatorNode[] = [];

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Subtle mechanical haptic click sound for scrolling the time picker wheel.
   */
  public playWheelTick(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.015);
    } catch {
      // Audio might be blocked until user interaction
    }
  }

  /**
   * Short confirmation chime for saving alarm or completing mission.
   */
  public playConfirm(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [880, 1174.66, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch {
      // Ignored if audio blocked
    }
  }

  /**
   * Sound preview or single burst of buzzer.
   */
  public playTone(soundId: SoundType, durationMs: number = 800): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Piezo buzzers typically resonate at 2.4kHz - 2.8kHz
      if (soundId === 'buzzer-pulsed') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(2400, now);
      } else if (soundId === 'buzzer-multitone') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.setValueAtTime(2600, now + 0.2);
      } else if (soundId === 'buzzer-fast') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(3000, now);
      } else if (soundId === 'buzzer-gentle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
      } else {
        // standard
        osc.type = 'square';
        osc.frequency.setValueAtTime(2400, now);
      }

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationMs / 1000);
    } catch {
      // Audio blocked
    }
  }

  /**
   * Start continuous alarm sound pattern.
   */
  public startAlarmRinging(soundId: SoundType = 'buzzer-standard'): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    const playBeep = () => {
      if (!this.isAlarmPlaying) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = soundId === 'buzzer-multitone' ? 2200 : soundId === 'buzzer-fast' ? 2800 : 2400;
        osc.type = soundId === 'buzzer-gentle' ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
      } catch {
        // audio context issue
      }
    };

    // Typical dual-beep alarm pattern: beep-beep ... pause ... beep-beep
    let step = 0;
    const interval = soundId === 'buzzer-fast' ? 150 : 250;

    const loop = () => {
      if (!this.isAlarmPlaying) return;
      if (step % 4 === 0 || step % 4 === 1) {
        playBeep();
      }
      step++;
      this.currentPatternTimer = window.setTimeout(loop, interval);
    };

    loop();
  }

  /**
   * Stop alarm ringing.
   */
  public stopAlarmRinging(): void {
    this.isAlarmPlaying = false;
    if (this.currentPatternTimer !== null) {
      clearTimeout(this.currentPatternTimer);
      this.currentPatternTimer = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeOscillators = [];
  }

  public isRinging(): boolean {
    return this.isAlarmPlaying;
  }
}

export const buzzerAudio = new BuzzerAudioService();
