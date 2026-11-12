import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PhoneFrame } from './PhoneFrame';
import { Plus, X, Sun, Moon, Radio, Sparkles, Monitor, Smartphone, Volume2 } from 'lucide-react';

export const EditorialLayout: React.FC = () => {
  const {
    isAlarmCreatorOpen,
    openAlarmCreator,
    closeAlarmCreator,
    theme,
    setTheme,
    operatingMode,
    setOperatingMode,
    desktopViewMode,
    setDesktopViewMode,
    deviceStatus,
    testBuzzer,
    openWakeUpGame,
  } = useAppStore();

  return (
    <div className="min-h-screen w-full bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] flex flex-col justify-between selection:bg-[#E9D82C] selection:text-black transition-colors duration-300">
      {/* Top Global Command Bar */}
      <header className="w-full border-b border-[#C9C8C1]/50 dark:border-[#2F2F2B] px-4 sm:px-8 py-3 flex items-center justify-between text-xs font-mono select-none">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3">
          <span className="font-bold tracking-tight text-sm text-[#171717] dark:text-[#F2F0E9] font-sans">
            DIGITAL CLOCK & SMART ALARM
          </span>
          <span className="hidden sm:inline-block text-[#85847F] dark:text-[#999890]">
            ESP32 + DS3231 + CD4518
          </span>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Buzzer Sound Test */}
          <button
            onClick={() => testBuzzer('buzzer-standard')}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#F2F1EC] dark:bg-[#22221F] hover:bg-[#C9C8C1]/40 border border-[#C9C8C1]/50 dark:border-[#2F2F2B] text-[#171717] dark:text-[#F2F0E9] transition-colors"
            title="Test hardware piezo buzzer"
          >
            <Volume2 size={13} />
            <span className="text-[11px]">Buzzer</span>
          </button>

          {/* Wake-Up Game Launcher */}
          <button
            onClick={openWakeUpGame}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#E9D82C]/20 hover:bg-[#E9D82C]/35 border border-[#E9D82C]/40 text-[#171717] dark:text-[#E9D82C] font-sans font-medium text-[11px] transition-colors"
            title="Launch interactive 'Clean Entire Field' wake-up game"
          >
            <Sparkles size={13} />
            <span>Mission Game</span>
          </button>

          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-[#F2F1EC] dark:bg-[#22221F] border border-[#C9C8C1]/50 dark:border-[#2F2F2B] rounded-lg p-0.5">
            <button
              onClick={() => setOperatingMode('simulation')}
              className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all ${
                operatingMode === 'simulation'
                  ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                  : 'text-[#85847F]'
              }`}
            >
              SIM
            </button>
            <button
              onClick={() => setOperatingMode('hardware')}
              className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all flex items-center space-x-1 ${
                operatingMode === 'hardware'
                  ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                  : 'text-[#85847F]'
              }`}
            >
              <Radio size={10} className={deviceStatus.connected ? 'text-emerald-400' : ''} />
              <span>ESP32</span>
            </button>
          </div>

          {/* View Mode Toggle (Editorial vs Full-width) */}
          <button
            onClick={() =>
              setDesktopViewMode(desktopViewMode === 'editorial-frame' ? 'responsive' : 'editorial-frame')
            }
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors hidden lg:block"
            title="Toggle Editorial Presentation / Full Responsive View"
          >
            {desktopViewMode === 'editorial-frame' ? <Monitor size={15} /> : <Smartphone size={15} />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
            title="Toggle Dark / Light Theme"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* Main Editorial Presentation Canvas (Inspired by image-1.png) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex items-center justify-center">
        {desktopViewMode === 'editorial-frame' ? (
          /* 3-Column Editorial Grid matching video storyboard */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column Typography & Editorial Tagline (Frames 0s to 16s in reference) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col justify-between h-[750px] py-4 select-none">
              <div>
                <div className="flex items-center space-x-3 text-xs font-mono text-[#85847F] dark:text-[#999890] tracking-wider mb-6">
                  <span>Simpl iOS Design</span>
                  <span>•</span>
                  <span>Info</span>
                </div>

                <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-[#171717] dark:text-[#F2F0E9] leading-[1.08] font-sans">
                  Set Multiple Alarms With Ai Asistent
                </h1>

                <p className="text-xs text-[#85847F] dark:text-[#999890] mt-6 leading-relaxed">
                  Precision time-schedules synchronized to an ESP32 microcontroller with a DS3231 I2C real-time clock and CD4518 digital counters.
                </p>
              </div>

              {/* Bottom tag (Frame 0s) */}
              <div className="border-t border-[#C9C8C1]/40 dark:border-[#2F2F2B] pt-4 text-xs font-mono text-[#85847F] dark:text-[#999890]">
                <span>New: Updates</span>
                <p className="text-[11px] text-[#85847F] mt-1 font-sans">
                  Firmware v1.2.0 • 2.4GHz Wi-Fi AP + STA Mode with auto-fallback
                </p>
              </div>
            </div>

            {/* Center Column: The Central Device Mockup */}
            <div className="col-span-1 lg:col-span-6 flex justify-center items-center">
              <PhoneFrame />
            </div>

            {/* Right Column: Giant Floating + / X Action & Editorial Annotations (Frames 0s - 16s) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col justify-between h-[750px] py-4 select-none pl-4">
              {/* Floating Large Action Button: '+' or '✕' */}
              <div className="flex flex-col items-start space-y-4">
                <button
                  onClick={() => {
                    if (isAlarmCreatorOpen) closeAlarmCreator();
                    else openAlarmCreator();
                  }}
                  className="w-16 h-16 rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#171717] dark:text-[#F2F0E9] flex items-center justify-center transition-all group"
                  title={isAlarmCreatorOpen ? 'Close time picker' : 'Open time picker'}
                >
                  {isAlarmCreatorOpen ? (
                    <X size={38} strokeWidth={1.75} className="group-hover:rotate-90 transition-transform duration-200" />
                  ) : (
                    <Plus size={44} strokeWidth={1.75} className="group-hover:rotate-90 transition-transform duration-200" />
                  )}
                </button>

                <div className="space-y-4 text-xs text-[#85847F] dark:text-[#999890]">
                  <div>
                    <strong className="block text-[#171717] dark:text-[#F2F0E9] font-medium text-sm">
                      Backup Alarm
                    </strong>
                    <span className="text-[11px]">Hardware buzzer executes independently of browser tab.</span>
                  </div>

                  <div>
                    <strong className="block text-[#171717] dark:text-[#F2F0E9] font-medium text-sm">
                      User-Friendly Interface
                    </strong>
                    <span className="text-[11px]">
                      Mechanical-style scrolling time picker with haptic clicks and snap-to-center.
                    </span>
                  </div>

                  <div>
                    <strong className="block text-[#171717] dark:text-[#F2F0E9] font-medium text-sm">
                      Wake-Up Mission
                    </strong>
                    <span className="text-[11px]">
                      Option to select a random game each morning to prevent predictability.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Editorial Quote */}
              <div className="border-t border-[#C9C8C1]/40 dark:border-[#2F2F2B] pt-4 text-[11px] text-[#85847F] dark:text-[#999890] leading-relaxed">
                <span>Guidels</span>
                <p className="mt-1">
                  Build beautiful, usable products faster. Minimalist Design uses more grid-based layouts and restrained typography.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Full Responsive View for standard desktop dashboard */
          <div className="w-full max-w-4xl bg-[#F2F1EC] dark:bg-[#1E1E1B] rounded-3xl p-6 sm:p-8 border border-[#C9C8C1]/60 dark:border-[#2F2F2B] shadow-xl">
            <div className="max-w-md mx-auto">
              <PhoneFrame />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#C9C8C1]/40 dark:border-[#2F2F2B] px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#85847F] dark:text-[#999890] font-mono">
        <div>
          <span>ESP32 Smart Alarm Control System</span> • <span>Mode: {operatingMode.toUpperCase()}</span>
        </div>
        <div className="mt-1 sm:mt-0 flex items-center space-x-3">
          <span>DS3231 I2C @ 0x68</span>
          <span>•</span>
          <span>Buzzer GPIO 25</span>
          <span>•</span>
          <span>Timezone: Asia/Kolkata</span>
        </div>
      </footer>
    </div>
  );
};
