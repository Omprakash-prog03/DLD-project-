import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { StatusBar } from './StatusBar';
import { NavigationBar } from './NavigationBar';
import { DashboardView } from '../../pages/Dashboard/DashboardView';
import { AlarmList } from '../alarms/AlarmList';
import { ClockSettingsView } from '../settings/ClockSettingsView';
import { DeviceConnectionView } from '../settings/DeviceConnectionView';
import { DiagnosticsView } from '../settings/DiagnosticsView';
import { AppSettingsView } from '../settings/AppSettingsView';
import { MechanicalTimePicker } from '../timePicker/MechanicalTimePicker';
import { AlarmRingingModal } from '../alarms/AlarmRingingModal';

export const PhoneFrame: React.FC = () => {
  const {
    activeTab,
    isAlarmCreatorOpen,
    editingAlarm,
    closeAlarmCreator,
    saveAlarm,
  } = useAppStore();

  return (
    <div className="relative w-full max-w-[390px] h-[812px] bg-[#E8E7E1] dark:bg-[#171715] rounded-[48px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-[8px] border-[#1C1C1E] dark:border-[#2C2C2E] flex flex-col justify-between overflow-hidden">
      {/* Dynamic island & Status bar */}
      <StatusBar />

      {/* Main Screen Content Area */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar px-3 pt-1">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'alarms' && <AlarmList />}
        {activeTab === 'clock-settings' && <ClockSettingsView />}
        {activeTab === 'device' && <DeviceConnectionView />}
        {activeTab === 'diagnostics' && <DiagnosticsView />}
        {activeTab === 'game' && <AppSettingsView />}
      </div>

      {/* Signature Time Picker Modal Overlay (Frames 2-5 in reference) */}
      {isAlarmCreatorOpen && (
        <div className="absolute inset-0 bg-[#E8E7E1] dark:bg-[#171715] z-40 rounded-[38px] pt-8 flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-250">
          <MechanicalTimePicker
            initialHour={editingAlarm ? editingAlarm.hour : 9}
            initialMinute={editingAlarm ? editingAlarm.minute : 50}
            initialRepeatType={editingAlarm ? editingAlarm.repeatType : 'weekdays'}
            initialRepeatDays={editingAlarm ? editingAlarm.repeatDays : [1, 2, 3, 4, 5]}
            initialSoundId={editingAlarm ? editingAlarm.soundId : 'buzzer-standard'}
            initialSnooze={editingAlarm ? editingAlarm.snoozeDuration : 10}
            initialMission={editingAlarm ? editingAlarm.wakeUpMission : true}
            initialTitle={editingAlarm ? editingAlarm.title : 'Morning Alarm'}
            onSave={(data) => {
              saveAlarm({
                ...data,
                date: null,
                enabled: true,
                lastTriggeredAt: null,
              });
            }}
            onCancel={() => closeAlarmCreator()}
          />
        </div>
      )}

      {/* Hardware Alarm Ringing Modal */}
      <AlarmRingingModal />

      {/* Bottom iOS Navigation Bar */}
      <NavigationBar />

      {/* iOS Home Indicator Bar */}
      <div className="w-full flex justify-center pb-1 pt-1 bg-[#E8E7E1] dark:bg-[#171715]">
        <div className="w-32 h-1 bg-[#171717]/30 dark:bg-white/30 rounded-full" />
      </div>
    </div>
  );
};
