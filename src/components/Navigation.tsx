import React from 'react';
import { ActiveTab } from '../types';
import { Sun, MessageCircleQuestion, Compass, HeartHandshake } from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'today' as ActiveTab, label: 'Hoje', icon: Sun },
    { id: 'ask' as ActiveTab, label: 'Pergunte', icon: MessageCircleQuestion },
    { id: 'journey' as ActiveTab, label: 'Jornada', icon: Compass },
    { id: 'care' as ActiveTab, label: 'Cuidados', icon: HeartHandshake }
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            aria-selected={isActive}
            role="tab"
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
