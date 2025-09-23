import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


type ListMode = 'infinite' | 'pagination';

interface SettingsContextType {
  listMode: ListMode;
  setListMode: (mode: ListMode) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

type SettingsProviderProps = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [listMode, setListModeState] = useState<ListMode>('infinite'); // Padrão
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('list_mode');
        if (savedMode === 'infinite' || savedMode === 'pagination') {
          setListModeState(savedMode);
        }
      } catch (e) {
        console.error("Falha ao carregar configurações", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const setListMode = async (mode: ListMode) => {
    try {
      await AsyncStorage.setItem('list_mode', mode);
      setListModeState(mode);
    } catch (e) {
      console.error("Falha ao salvar configuração", e);
    }
  };

  return (
    <SettingsContext.Provider value={{ listMode, setListMode, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};