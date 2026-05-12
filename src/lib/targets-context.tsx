'use client';

import { createContext, useContext, useState } from 'react';
import { DEFAULT_TARGETS, type DailyTargets } from './targets';

interface TargetsContextValue {
  targets: DailyTargets;
  setTargets: (t: DailyTargets) => void;
  vaultName: string;
  setVaultName: (name: string) => void;
}

const TargetsContext = createContext<TargetsContextValue>({
  targets: DEFAULT_TARGETS,
  setTargets: () => undefined,
  vaultName: '',
  setVaultName: () => undefined,
});

export function TargetsProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [vaultName, setVaultName] = useState('');
  return (
    <TargetsContext.Provider value={{ targets, setTargets, vaultName, setVaultName }}>
      {children}
    </TargetsContext.Provider>
  );
}

export function useTargets(): TargetsContextValue {
  return useContext(TargetsContext);
}
