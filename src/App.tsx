import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, JourneyRecord } from './types';
import { profileStorage } from './services/profileStorage';
import { indexedDbService } from './services/indexedDbService';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Onboarding } from './views/Onboarding';
import { TodayView } from './views/TodayView';
import { AskView } from './views/AskView';
import { JourneyView } from './views/JourneyView';
import { CareView } from './views/CareView';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<JourneyRecord[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Carrega preferências demonstrativas do onboarding (localStorage)
    const saved = profileStorage.getProfile();
    if (saved) {
      setProfile(saved);
    }

    // 2. Carrega registros de saúde e memórias estruturados do IndexedDB nativo
    const initDbAndLoad = async () => {
      try {
        const loaded = await indexedDbService.getRecords();
        setRecords(loaded);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'IndexedDB indisponível neste navegador';
        console.error('Erro ao acessar IndexedDB:', err);
        setStorageError(message);
      } finally {
        setLoading(false);
      }
    };

    initDbAndLoad();
  }, []);

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    profileStorage.saveProfile(newProfile);
    setProfile(newProfile);
    setActiveTab('today');
  };

  const handleResetProfile = () => {
    if (window.confirm('Deseja alterar a fase ou reiniciar a introdução rápida?')) {
      profileStorage.clearProfile();
      setProfile(null);
    }
  };

  const handleAddRecord = async (newRecord: JourneyRecord) => {
    try {
      const updated = await indexedDbService.saveRecord(newRecord);
      setRecords(updated);
    } catch (err) {
      console.error('Falha ao salvar registro no IndexedDB:', err);
      alert('Não foi possível gravar no armazenamento do aparelho.');
    }
  };

  const handleClearRecords = async () => {
    try {
      await indexedDbService.clearAllRecords();
      setRecords([]);
    } catch (err) {
      console.error('Erro ao limpar IndexedDB:', err);
      alert('Erro ao apagar registros locais.');
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregando dados locais...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header profile={profile} onResetProfile={handleResetProfile} />

      {!profile ? (
        <Onboarding onComplete={handleCompleteOnboarding} />
      ) : (
        <>
          {activeTab === 'today' && (
            <TodayView
              profile={profile}
              records={records}
              onNavigate={setActiveTab}
              onAddRecord={handleAddRecord}
            />
          )}
          {activeTab === 'ask' && <AskView profile={profile} />}
          {activeTab === 'journey' && (
            <JourneyView
              profile={profile}
              records={records}
              onAddRecord={handleAddRecord}
              onClearRecords={handleClearRecords}
              storageError={storageError}
            />
          )}
          {activeTab === 'care' && (
            <CareView
              profile={profile}
              onAddRecord={handleAddRecord}
              onNavigate={setActiveTab}
            />
          )}

          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
};

export default App;
