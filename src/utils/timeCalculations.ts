import { Alarm, ClockTime, RepeatType, TimeFormat } from '../types';

export const DAYS_OF_WEEK = [
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' },
  { id: 0, short: 'Sun', full: 'Sunday' },
];

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Returns date and time broken down in the configured timezone (defaults to Asia/Kolkata UTC+5:30)
 */
export function getZonedDate(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = parseInt(p.value, 10);
      }
    }

    const dStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(date);
    const dayIndexMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };

    return {
      year: map.year || date.getFullYear(),
      month: map.month || (date.getMonth() + 1),
      day: map.day || date.getDate(),
      hour: (map.hour === 24 ? 0 : map.hour) ?? date.getHours(),
      minute: map.minute ?? date.getMinutes(),
      second: map.second ?? date.getSeconds(),
      dayOfWeek: dayIndexMap[dStr] ?? date.getDay(),
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dayOfWeek: date.getDay(),
    };
  }
}

export function formatTimeDisplay(
  hour: number,
  minute: number,
  second?: number,
  format: TimeFormat = '24h'
): { timeStr: string; period?: string } {
  if (format === '12h') {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const base = `${padZero(displayHour)}:${padZero(minute)}`;
    return {
      timeStr: second !== undefined ? `${base}:${padZero(second)}` : base,
      period,
    };
  }
  const base = `${padZero(hour)}:${padZero(minute)}`;
  return {
    timeStr: second !== undefined ? `${base}:${padZero(second)}` : base,
  };
}

export function getRepeatLabel(repeatType: RepeatType, repeatDays: number[]): string {
  switch (repeatType) {
    case 'once':
      return 'Once';
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Mon – Fri';
    case 'weekends':
      return 'Weekends';
    case 'custom': {
      if (repeatDays.length === 7) return 'Every day';
      if (repeatDays.length === 0) return 'Never';
      const isWeekdays =
        repeatDays.length === 5 && [1, 2, 3, 4, 5].every((d) => repeatDays.includes(d));
      if (isWeekdays) return 'Mon – Fri';
      const isWeekends =
        repeatDays.length === 2 && [6, 0].every((d) => repeatDays.includes(d));
      if (isWeekends) return 'Weekends';

      return DAYS_OF_WEEK.filter((d) => repeatDays.includes(d.id))
        .map((d) => d.short)
        .join(', ');
    }
    default:
      return 'Custom';
  }
}

/**
 * Calculates the next occurrence of an alarm relative to the device's configured timezone.
 */
export function getNextAlarmOccurrence(
  alarm: Alarm,
  currentTime: ClockTime
): Date | null {
  if (!alarm.enabled) return null;

  const currentDayOfWeek = new Date(
    currentTime.year,
    currentTime.month - 1,
    currentTime.day
  ).getDay();

  // If one-time alarm with specific date
  if (alarm.repeatType === 'once') {
    if (alarm.date) {
      const [year, month, day] = alarm.date.split('-').map(Number);
      const target = new Date(year, month - 1, day, alarm.hour, alarm.minute, alarm.second || 0);
      const current = new Date(
        currentTime.year,
        currentTime.month - 1,
        currentTime.day,
        currentTime.hour,
        currentTime.minute,
        currentTime.second
      );
      if (target.getTime() > current.getTime()) {
        return target;
      }
      return null;
    } else {
      const todayTarget = new Date(
        currentTime.year,
        currentTime.month - 1,
        currentTime.day,
        alarm.hour,
        alarm.minute,
        alarm.second || 0
      );
      const current = new Date(
        currentTime.year,
        currentTime.month - 1,
        currentTime.day,
        currentTime.hour,
        currentTime.minute,
        currentTime.second
      );
      if (todayTarget.getTime() > current.getTime()) {
        return todayTarget;
      }
      const tomorrow = new Date(todayTarget);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  }

  // Repeating alarm: check today and next 7 days
  const activeDays = new Set<number>();
  if (alarm.repeatType === 'daily') {
    [0, 1, 2, 3, 4, 5, 6].forEach((d) => activeDays.add(d));
  } else if (alarm.repeatType === 'weekdays') {
    [1, 2, 3, 4, 5].forEach((d) => activeDays.add(d));
  } else if (alarm.repeatType === 'weekends') {
    [0, 6].forEach((d) => activeDays.add(d));
  } else if (alarm.repeatType === 'custom') {
    alarm.repeatDays.forEach((d) => activeDays.add(d));
  }

  if (activeDays.size === 0) return null;

  const currentTotalSeconds =
    currentTime.hour * 3600 + currentTime.minute * 60 + currentTime.second;
  const alarmTotalSeconds =
    alarm.hour * 3600 + alarm.minute * 60 + (alarm.second || 0);

  if (activeDays.has(currentDayOfWeek) && alarmTotalSeconds > currentTotalSeconds) {
    return new Date(
      currentTime.year,
      currentTime.month - 1,
      currentTime.day,
      alarm.hour,
      alarm.minute,
      alarm.second || 0
    );
  }

  for (let offset = 1; offset <= 7; offset++) {
    const candidateDayOfWeek = (currentDayOfWeek + offset) % 7;
    if (activeDays.has(candidateDayOfWeek)) {
      const target = new Date(
        currentTime.year,
        currentTime.month - 1,
        currentTime.day + offset,
        alarm.hour,
        alarm.minute,
        alarm.second || 0
      );
      return target;
    }
  }

  return null;
}

/**
 * Finds the earliest upcoming alarm from a list of alarms.
 */
export function findNextUpcomingAlarm(
  alarms: Alarm[],
  currentTime: ClockTime
): { alarm: Alarm; nextDate: Date; relativeStr: string } | null {
  const enabledAlarms = alarms.filter((a) => a.enabled);
  if (enabledAlarms.length === 0) return null;

  const currentDate = new Date(
    currentTime.year,
    currentTime.month - 1,
    currentTime.day,
    currentTime.hour,
    currentTime.minute,
    currentTime.second
  );

  let earliestAlarm: Alarm | null = null;
  let earliestDate: Date | null = null;

  for (const alarm of enabledAlarms) {
    const occurrence = getNextAlarmOccurrence(alarm, currentTime);
    if (!occurrence) continue;

    if (!earliestDate || occurrence.getTime() < earliestDate.getTime()) {
      earliestDate = occurrence;
      earliestAlarm = alarm;
    }
  }

  if (!earliestAlarm || !earliestDate) return null;

  const diffMs = earliestDate.getTime() - currentDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relativeStr = '';
  if (diffSec < 60) {
    relativeStr = 'in less than a minute';
  } else if (diffMin < 60) {
    relativeStr = `in ${diffMin} min`;
  } else if (diffHours < 24) {
    const remMin = diffMin % 60;
    relativeStr = remMin > 0 ? `in ${diffHours}h ${remMin}m` : `in ${diffHours} hours`;
  } else if (diffDays === 1) {
    relativeStr = 'tomorrow';
  } else {
    relativeStr = `in ${diffDays} days`;
  }

  return {
    alarm: earliestAlarm,
    nextDate: earliestDate,
    relativeStr,
  };
}
