import React from 'react';
import { useAppStore, NavigationTab } from '../../store/useAppStore';
import { Clock, Bell, Radio, Activity, Settings2, Sliders } from 'lucide-react';

export const NavigationBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Clock', icon: <Clock size={18} /> },
    { id: 'alarms', label: 'Alarms', icon: <Bell size={18} /> },
    { id: 'clock-settings', label: 'Sync', icon: <Sliders size={18} /> },
    { id: 'device', label: 'ESP32', icon: <Radio size={18} /> },
    { id: 'diagnostics', label: 'Diag', icon: <Activity size={18} /> },
    { id: 'game', label: 'Config', icon: <Settings2 size={18} /> },
  ];

  return (
    <nav className="w-full bg-[#E8E7E1]/80 dark:bg-[#171715]/80 backdrop-blur-md border-t border-[#C9C8C1]/40 dark:border-[#2F2F2B] px-3 py-2 flex items-center justify-around z-20">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-[#171717] dark:text-[#E9D82C]'
                : 'text-[#85847F] dark:text-[#999890] hover:text-[#171717] dark:hover:text-[#F2F0E9]'
            }`}
          >
            <div className="relative">
              {item.icon}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#E9D82C]" />
              )}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
