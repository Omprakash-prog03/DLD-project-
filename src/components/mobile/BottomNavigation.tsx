import React from 'react';
import { Clock, Calendar, Bell, Cpu, Settings } from 'lucide-react';

export type TabType = 'home' | 'calendar' | 'alarms' | 'device' | 'settings';

interface BottomNavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Clock },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'alarms' as TabType, label: 'Alarms', icon: Bell },
    { id: 'device' as TabType, label: 'Device', icon: Cpu },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="h-[72px] bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-around px-2 z-30 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        const color = isActive ? '#E84B2F' : '#666666';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-150"
          >
            <Icon size={22} color={color} strokeWidth={isActive ? 2.5 : 2} />
            <span
              className="text-[11px] mt-1 font-semibold tracking-tight"
              style={{ color }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
