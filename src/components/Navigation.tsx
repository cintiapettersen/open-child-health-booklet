import React from 'react';
import { ActiveTab } from '../types';
import { Sun, MessageCircleQuestion, Compass, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'today' as ActiveTab, label: t.nav.today, icon: Sun },
    { id: 'ask' as ActiveTab, label: t.nav.ask, icon: MessageCircleQuestion },
    { id: 'journey' as ActiveTab, label: t.nav.journey, icon: Compass },
    { id: 'care' as ActiveTab, label: t.nav.care, icon: HeartHandshake }
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegação principal / Main navigation">
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
