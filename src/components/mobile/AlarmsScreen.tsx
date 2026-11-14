import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Trash2, X, Check, Clock, AlertTriangle } from 'lucide-react';
import { DrumTimePicker } from './DrumTimePicker';
import { Alarm } from '../../types';

export const AlarmsScreen: React.FC = () => {
  const { alarms, toggleAlarm, saveAlarm, deleteAlarm, timeFormat } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  // Form states
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('Morning Wakeup');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const openCreateModal = () => {
    setEditingAlarm(null);
    setHour(7);
    setMinute(0);
    setLabel('Morning Wakeup');
    setRepeatDays([1, 2, 3, 4, 5]);
    setSnoozeEnabled(true);
    setSnoozeDuration(5);
    setIsModalOpen(true);
  };

  const openEditModal = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setHour(alarm.hour);
    setMinute(alarm.minute);
    setLabel(alarm.title);
    setRepeatDays(alarm.repeatDays || []);
    setSnoozeEnabled(alarm.snoozeDuration > 0);
    setSnoozeDuration(alarm.snoozeDuration || 5);
    setIsModalOpen(true);
  };

  const toggleDay = (dayIdx: number) => {
    if (repeatDays.includes(dayIdx)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayIdx));
    } else {
      setRepeatDays([...repeatDays, dayIdx].sort());
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveAlarm({
      title: label.trim() || 'Alarm',
      hour,
      minute,
      enabled: true,
      repeatType: repeatDays.length === 7 ? 'daily' : repeatDays.length === 0 ? 'once' : 'custom',
      repeatDays,
      date: null,
      soundId: 'buzzer-standard',
      snoozeDuration: snoozeEnabled ? snoozeDuration : 0,
      wakeUpMission: false,
      lastTriggeredAt: null,
      syncStatus: 'synced',
    });
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const activeAlarms = alarms.filter((a) => a.enabled);
  const inactiveAlarms = alarms.filter((a) => !a.enabled);

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top App Bar */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Alarms</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="w-10 h-10 rounded-full bg-[#E84B2F] flex items-center justify-center text-white hover:bg-[#d03d22] transition shadow-md"
        >
          <Plus size={22} />
        </button>
      </div>

      {alarms.length === 0 ? (
        <div className="bg-[#1E1E1E] rounded-[24px] p-8 text-center my-8">
          <Clock size={48} className="mx-auto text-neutral-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Alarms Set</h3>
          <p className="text-sm text-neutral-400 mb-5">
            Configure alarms that execute autonomously on your ESP32 clock.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-6 py-3 bg-[#E84B2F] text-white font-bold rounded-xl text-sm"
          >
            Create First Alarm
          </button>
        </div>
      ) : (
        <>
          {/* Active Alarms */}
          {activeAlarms.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2.5">
                ACTIVE ALARMS
              </p>
              <div className="space-y-3">
                {activeAlarms.map((alarm) => (
                  <AlarmCardItem
                    key={alarm.id}
                    alarm={alarm}
                    onToggle={() => toggleAlarm(alarm.id)}
                    onClick={() => openEditModal(alarm)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Alarms */}
          {inactiveAlarms.length > 0 && (
            <div className="pt-2">
              <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2.5">
                INACTIVE ALARMS
              </p>
              <div className="space-y-3">
                {inactiveAlarms.map((alarm) => (
                  <AlarmCardItem
                    key={alarm.id}
                    alarm={alarm}
                    onToggle={() => toggleAlarm(alarm.id)}
                    onClick={() => openEditModal(alarm)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Alarm Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-[#171717] rounded-t-[28px] max-h-[90vh] overflow-y-auto p-5 space-y-5 animate-slide-up border-t border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-1 border-b border-[#2A2A2A]">
              <h2 className="text-xl font-bold text-white">
                {editingAlarm ? 'Edit Alarm' : 'New Alarm'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Custom Drum Time Picker */}
            <DrumTimePicker
              hour={hour}
              minute={minute}
              is24Hour={timeFormat === '24h'}
              onChange={(h, m) => {
                setHour(h);
                setMinute(m);
              }}
            />

            {/* Label Input */}
            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1.5">
                Alarm Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Morning Wakeup, Study, Exercise..."
                className="w-full bg-[#1E1E1E] border border-transparent focus:border-[#E84B2F] rounded-xl px-4 py-3 text-white text-[15px] outline-none"
              />
            </div>

            {/* Repeat Days Chips */}
            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-2">
                Repeat Days
              </label>
              <div className="flex justify-between">
                {dayNames.map((name, idx) => {
                  const isSelected = repeatDays.includes(idx);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full font-bold text-[13px] transition ${
                        isSelected
                          ? 'bg-[#E84B2F] text-white shadow-md'
                          : 'bg-[#2A2A2A] text-neutral-400'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Snooze Settings */}
            <div className="bg-[#1E1E1E] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-white">Allow Snooze</span>
                <input
                  type="checkbox"
                  checked={snoozeEnabled}
                  onChange={(e) => setSnoozeEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#E84B2F] cursor-pointer"
                />
              </div>

              {snoozeEnabled && (
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                  <span className="text-sm text-neutral-400">Duration</span>
                  <div className="flex gap-2">
                    {[5, 10, 15].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSnoozeDuration(d)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          snoozeDuration === d
                            ? 'bg-[#E84B2F] text-white'
                            : 'bg-[#2A2A2A] text-neutral-400'
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hardware Sync Info Note */}
            <div className="bg-[#1E1E1E] border-l-4 border-[#3B5BDB] rounded-xl p-3 text-xs text-neutral-300">
              This alarm will sync to your physical ESP32 clock. It functions autonomously even when
              your phone is disconnected.
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#E84B2F] text-white font-bold py-3.5 rounded-xl text-base shadow-md hover:bg-[#d03d22] transition active:scale-[0.99]"
            >
              {isSaving ? 'Syncing to ESP32...' : 'Save & Synchronize Alarm'}
            </button>

            {editingAlarm && (
              <button
                type="button"
                onClick={async () => {
                  await deleteAlarm(editingAlarm.id);
                  setIsModalOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-semibold text-[#E84B2F] hover:bg-[#E84B2F]/10 rounded-xl transition"
              >
                Delete Alarm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AlarmCardItem: React.FC<{
  alarm: Alarm;
  onToggle: () => void;
  onClick: () => void;
}> = ({ alarm, onToggle, onClick }) => {
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-[#1E1E1E] rounded-[24px] p-5 transition active:scale-[0.99] ${
        !alarm.enabled ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[34px] font-bold text-white tracking-tight leading-none">
            {String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}
          </div>
          <p className="text-[14px] text-neutral-400 mt-1 font-medium">{alarm.title}</p>
        </div>

        {/* Custom Styled Switch */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-13 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
            alarm.enabled ? 'bg-[#E84B2F]' : 'bg-[#2A2A2A]'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
              alarm.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-[#2A2A2A]">
        {/* Repeat Days Chips */}
        <div className="flex gap-1.5">
          {dayNames.map((name, idx) => {
            const isDayActive = (alarm.repeatDays || []).includes(idx);
            return (
              <span
                key={name}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  isDayActive
                    ? 'bg-[#E84B2F] text-white'
                    : 'bg-[#2A2A2A] text-neutral-500'
                }`}
              >
                {name}
              </span>
            );
          })}
        </div>

        {/* Sync Status Badge */}
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#2ECC71]/20 text-[#2ECC71]">
          <Check size={12} />
          Synced
        </span>
      </div>
    </div>
  );
};
