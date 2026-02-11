import { useState, useCallback, useRef } from 'react';

export type Locale = 'ko' | 'en';

export interface SoftwareStatus {
  name: string;
  installed: boolean;
  version: string;
  required: boolean;
}

export interface SystemCheckResult {
  nodejs: SoftwareStatus;
  git: SoftwareStatus;
  claudeCode: SoftwareStatus;
  wingetAvailable: boolean;
}

export interface InstallProgress {
  step: string;
  status: 'pending' | 'installing' | 'completed' | 'error' | 'skipped';
  message: string;
  percentage: number;
}

export interface InstallerState {
  currentStep: number;
  locale: Locale;
  systemCheck: SystemCheckResult | null;
  installProgress: Record<string, InstallProgress>;
  isInstalling: boolean;
  error: string | null;
  logs: string[];
  appVersion: string;
}

const TOTAL_STEPS = 5;

const initialInstallProgress: Record<string, InstallProgress> = {
  nodejs: {
    step: 'nodejs',
    status: 'pending',
    message: '',
    percentage: 0,
  },
  git: {
    step: 'git',
    status: 'pending',
    message: '',
    percentage: 0,
  },
  claudecode: {
    step: 'claudecode',
    status: 'pending',
    message: '',
    percentage: 0,
  },
};

export function useInstaller() {
  const [state, setState] = useState<InstallerState>({
    currentStep: 1,
    locale: 'ko',
    systemCheck: null,
    installProgress: { ...initialInstallProgress },
    isInstalling: false,
    error: null,
    logs: [],
    appVersion: '',
  });

  const logsRef = useRef<string[]>([]);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setState((prev) => ({
      ...prev,
      locale: prev.locale === 'ko' ? 'en' : 'ko',
    }));
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    setState((prev) => ({ ...prev, locale }));
  }, []);

  const setSystemCheck = useCallback((result: SystemCheckResult) => {
    setState((prev) => ({ ...prev, systemCheck: result }));
  }, []);

  const updateInstallProgress = useCallback((progress: InstallProgress) => {
    setState((prev) => ({
      ...prev,
      installProgress: {
        ...prev.installProgress,
        [progress.step]: progress,
      },
    }));
  }, []);

  const setIsInstalling = useCallback((isInstalling: boolean) => {
    setState((prev) => ({ ...prev, isInstalling }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const addLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${log}`;
    logsRef.current = [...logsRef.current, entry];
    setState((prev) => ({
      ...prev,
      logs: logsRef.current,
    }));
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  const resetInstallProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      installProgress: { ...initialInstallProgress },
      isInstalling: false,
      error: null,
    }));
  }, []);

  const setAppVersion = useCallback((version: string) => {
    setState((prev) => ({ ...prev, appVersion: version }));
  }, []);

  const getOverallProgress = useCallback((): number => {
    const progresses = Object.values(state.installProgress);
    if (progresses.length === 0) return 0;
    const total = progresses.reduce((sum, p) => sum + p.percentage, 0);
    return Math.round(total / progresses.length);
  }, [state.installProgress]);

  const isAllCompleted = useCallback((): boolean => {
    return Object.values(state.installProgress).every(
      (p) => p.status === 'completed' || p.status === 'skipped'
    );
  }, [state.installProgress]);

  const hasError = useCallback((): boolean => {
    return Object.values(state.installProgress).some(
      (p) => p.status === 'error'
    );
  }, [state.installProgress]);

  return {
    state,
    nextStep,
    prevStep,
    goToStep,
    toggleLocale,
    setLocale,
    setSystemCheck,
    updateInstallProgress,
    setIsInstalling,
    setError,
    addLog,
    clearLogs,
    resetInstallProgress,
    setAppVersion,
    getOverallProgress,
    isAllCompleted,
    hasError,
  };
}

// i18n helper types and data
export type TranslationKey = string;

export interface Translations {
  [key: string]: {
    ko: string;
    en: string;
  };
}

export function t(
  translations: Translations,
  key: string,
  locale: Locale
): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] || entry['en'] || key;
}
