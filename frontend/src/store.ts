import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  mode: 'beginner' | 'expert';
  accentColor: string;
  defaultModel: string;
  defaultFormWindow: number;
  defaultSeasonRange: [string, string];
  showSection: Record<string, boolean>;
  savedPredictions: any[];

  setMode:              (m: 'beginner' | 'expert') => void;
  setAccentColor:       (c: string) => void;
  setDefaultModel:      (m: string) => void;
  setDefaultFormWindow: (n: number) => void;
  setSectionVisible:    (key: string, visible: boolean) => void;
  addSavedPrediction:   (p: any) => void;
  clearSavedPredictions:() => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      mode:               'beginner',
      accentColor:        '#3b82f6',
      defaultModel:       'xgboost',
      defaultFormWindow:  5,
      defaultSeasonRange: ['2015-16', '2024-25'],
      showSection: {
        home: true, methodology: true, eda: true, predictor: true,
        simulator: true, models: true, features: true, findings: true, about: true,
      },
      savedPredictions: [],

      setMode:              (mode)    => set({ mode }),
      setAccentColor:       (accentColor) => set({ accentColor }),
      setDefaultModel:      (defaultModel) => set({ defaultModel }),
      setDefaultFormWindow: (defaultFormWindow) => set({ defaultFormWindow }),
      setSectionVisible:    (key, visible) =>
        set(s => ({ showSection: { ...s.showSection, [key]: visible } })),
      addSavedPrediction:   (p) =>
        set(s => ({ savedPredictions: [...s.savedPredictions.slice(-2), p] })),
      clearSavedPredictions:() => set({ savedPredictions: [] }),
    }),
    { name: 'ucl-predictor-settings' }
  )
);
