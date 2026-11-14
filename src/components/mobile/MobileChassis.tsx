import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Smartphone,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Download,
  ArrowDownToLine,
  QrCode,
} from 'lucide-react';
import { BottomNavigation, TabType } from './BottomNavigation';
import { HomeScreen } from './HomeScreen';
import { AlarmsScreen } from './AlarmsScreen';
import { CalendarScreen } from './CalendarScreen';
import { DeviceScreen } from './DeviceScreen';
import { SettingsScreen } from './SettingsScreen';
import { DownloadModal } from './DownloadModal';
import { useAppStore } from '../../store/useAppStore';

export const MobileChassis: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const { operatingMode, setOperatingMode, currentTime } = useAppStore();

  const isMock = operatingMode === 'simulation';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('download') === '1' ||
        params.get('download') === 'true' ||
        window.location.pathname === '/download'
      ) {
        setIsDownloadModalOpen(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-0 md:p-6 select-none font-sans">
      {/* Top Simulator Control Bar (Desktop Only) */}
      <header className="hidden md:flex items-center justify-between w-full max-w-[440px] mb-3 px-2 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-[#E84B2F]" />
          <span className="font-bold text-white tracking-wide">Smart Clock Mobile</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download / Install on Phone Button */}
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#E84B2F] hover:bg-[#d03d22] text-white rounded-full font-bold shadow-sm transition active:scale-95"
          >
            <Download size={13} />
            <span>Install on Phone</span>
          </button>

          <button
            type="button"
            onClick={() => setOperatingMode(isMock ? 'hardware' : 'simulation')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold transition ${
              isMock
                ? 'bg-[#F39C12]/20 text-[#F39C12] border border-[#F39C12]/40'
                : 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {isMock ? 'Mock' : 'Hardware'}
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1 hover:text-white transition"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Mobile Device Frame Chassis */}
      <div
        className={`relative flex flex-col bg-[#111111] overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullScreen
            ? 'w-full h-screen rounded-none'
            : 'w-full md:w-[390px] h-screen md:h-[844px] md:rounded-[48px] md:border-[10px] md:border-[#222222] md:ring-1 md:ring-white/10'
        }`}
      >
        {/* Dynamic Island & Status Bar */}
        <div className="relative pt-2.5 px-7 flex items-center justify-between text-white text-[13px] font-bold z-40 shrink-0">
          <span>9:41</span>

          {/* Dynamic Island Pill */}
          <div
            className="w-24 h-5 bg-black rounded-full mx-auto cursor-pointer hover:opacity-80 transition flex items-center justify-center text-[10px] text-neutral-400 gap-1"
            onClick={() => setIsDownloadModalOpen(true)}
            title="Download App"
          >
            <Download size={10} className="text-[#E84B2F]" />
            <span className="text-[9px] font-bold text-neutral-300">Install</span>
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-1.5 text-white">
            <Signal size={13} strokeWidth={2.5} />
            <Wifi size={13} strokeWidth={2.5} />
            <Battery size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* Persistent MOCK MODE Indicator Banner */}
        {isMock && (
          <div className="bg-[#F39C12] text-black text-[11px] font-extrabold py-1 px-4 flex items-center justify-between shrink-0 shadow-sm tracking-wide z-30">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="shrink-0" />
              <span>MOCK MODE — Simulated hardware data</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="underline text-[10px] hover:text-white transition font-bold"
            >
              Get APK
            </button>
          </div>
        )}

        {/* Mobile View Download & Install Floating Bar (Mobile Viewport Only) */}
        <div className="md:hidden bg-[#1A1A1A] border-b border-[#2A2A2A] px-3.5 py-2 flex items-center justify-between text-xs shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#E84B2F]/20 text-[#E84B2F] flex items-center justify-center font-bold">
              <Smartphone size={13} />
            </div>
            <div>
              <span className="font-bold text-white block text-[12px] leading-tight">Smart Clock App</span>
              <span className="text-[10px] text-neutral-400">Install standalone on phone</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href="/downloads/smart-clock-release.apk"
              download="smart-clock-release.apk"
              className="px-2.5 py-1 bg-[#E84B2F] hover:bg-[#d03d22] text-white rounded-lg font-bold flex items-center gap-1 text-[11px] shadow-sm active:scale-95 transition"
            >
              <Download size={11} />
              <span>APK</span>
            </a>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="px-2.5 py-1 bg-[#2A2A2A] hover:bg-neutral-700 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] active:scale-95 transition"
            >
              <span>Install</span>
            </button>
          </div>
        </div>

        {/* Main Screen Views */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTab === 'home' && (
            <HomeScreen
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenCreateAlarm={() => setCurrentTab('alarms')}
              onOpenCreateEvent={() => setCurrentTab('calendar')}
              onOpenDownload={() => setIsDownloadModalOpen(true)}
            />
          )}

          {currentTab === 'calendar' && <CalendarScreen />}

          {currentTab === 'alarms' && <AlarmsScreen />}

          {currentTab === 'device' && <DeviceScreen />}

          {currentTab === 'settings' && (
            <SettingsScreen onOpenDownload={() => setIsDownloadModalOpen(true)} />
          )}
        </main>

        {/* C11: Dedicated Bottom Navigation Bar */}
        <BottomNavigation
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
        />

        {/* iOS Home Indicator Bar */}
        <div className="w-full flex justify-center pb-2 bg-[#1A1A1A] shrink-0">
          <div className="w-32 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      {/* Download / Install on Phone Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
