import React, { useEffect, useState, useRef, useCallback } from 'react';
import { InstallAll } from '../../wailsjs/go/main/App';
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime';
import { type Locale, type InstallProgress, t } from '../hooks/useInstaller';

const translations = {
  title: {
    ko: '설치 중',
    en: 'Installing',
  },
  subtitle: {
    ko: '필요한 소프트웨어를 설치하고 있습니다. 잠시 기다려 주세요.',
    en: 'Installing required software. Please wait.',
  },
  overallProgress: {
    ko: '전체 진행률',
    en: 'Overall Progress',
  },
  nodejs: {
    ko: 'Node.js',
    en: 'Node.js',
  },
  nodejsDesc: {
    ko: 'JavaScript 런타임 환경',
    en: 'JavaScript runtime environment',
  },
  git: {
    ko: 'Git',
    en: 'Git',
  },
  gitDesc: {
    ko: '버전 관리 시스템',
    en: 'Version control system',
  },
  claudecode: {
    ko: 'Claude Code',
    en: 'Claude Code',
  },
  claudecodeDesc: {
    ko: 'AI 코딩 어시스턴트',
    en: 'AI coding assistant',
  },
  pending: {
    ko: '대기 중',
    en: 'Pending',
  },
  installing: {
    ko: '설치 중...',
    en: 'Installing...',
  },
  completed: {
    ko: '완료',
    en: 'Completed',
  },
  skipped: {
    ko: '건너뜀',
    en: 'Skipped',
  },
  error: {
    ko: '오류',
    en: 'Error',
  },
  showLogs: {
    ko: '로그 보기',
    en: 'Show Logs',
  },
  hideLogs: {
    ko: '로그 숨기기',
    en: 'Hide Logs',
  },
  continue: {
    ko: '계속',
    en: 'Continue',
  },
  retry: {
    ko: '다시 시도',
    en: 'Retry',
  },
  installComplete: {
    ko: '설치가 완료되었습니다!',
    en: 'Installation complete!',
  },
  installError: {
    ko: '설치 중 오류가 발생했습니다',
    en: 'An error occurred during installation',
  },
  autoAdvance: {
    ko: '잠시 후 다음 단계로 이동합니다...',
    en: 'Moving to next step shortly...',
  },
};

const stepInfo: Record<string, { icon: React.ReactNode; nameKey: string; descKey: string }> = {
  nodejs: {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#68a063" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 8V16" stroke="#68a063" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10V14" stroke="#68a063" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    nameKey: 'nodejs',
    descKey: 'nodejsDesc',
  },
  git: {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="7" cy="7" r="2" stroke="#f05032" strokeWidth="1.5" />
        <circle cx="17" cy="7" r="2" stroke="#f05032" strokeWidth="1.5" />
        <circle cx="12" cy="17" r="2" stroke="#f05032" strokeWidth="1.5" />
        <path d="M7 9V12C7 13.1 7.9 14 9 14H12M17 9V12C17 13.1 16.1 14 15 14H12M12 14V15" stroke="#f05032" strokeWidth="1.5" />
      </svg>
    ),
    nameKey: 'git',
    descKey: 'gitDesc',
  },
  claudecode: {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" rx="3" stroke="#da7756" strokeWidth="1.5" />
        <path d="M8 11L11 14L8 17" stroke="#da7756" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="13" y1="16" x2="17" y2="16" stroke="#da7756" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    nameKey: 'claudecode',
    descKey: 'claudecodeDesc',
  },
};

const statusStyles: Record<string, { badge: string; text: string }> = {
  pending: {
    badge: 'bg-white/20',
    text: 'pending',
  },
  installing: {
    badge: 'bg-blue-400',
    text: 'installing',
  },
  completed: {
    badge: 'bg-emerald-400',
    text: 'completed',
  },
  skipped: {
    badge: 'bg-yellow-400',
    text: 'skipped',
  },
  error: {
    badge: 'bg-red-400',
    text: 'error',
  },
};

const StatusIconComponent: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-label="Completed">
          <path d="M4 8L7 11L12 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'installing':
      return (
        <div className="w-4 h-4 rounded-full border border-white/10 border-t-[#4361ee] animate-spin-slow" role="img" aria-label="Installing" />
      );
    case 'error':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-label="Error">
          <path d="M5 5L11 11M11 5L5 11" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'skipped':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-label="Skipped">
          <path d="M5 8H11" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" role="img" aria-label="Pending" />
      );
  }
};

interface InstallingProps {
  locale: Locale;
  onNext: () => void;
  installProgress: Record<string, InstallProgress>;
  onProgressUpdate: (progress: InstallProgress) => void;
  onAddLog: (log: string) => void;
  logs: string[];
}

const Installing: React.FC<InstallingProps> = ({
  locale,
  onNext,
  installProgress,
  onProgressUpdate,
  onAddLog,
  logs,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [installStarted, setInstallStarted] = useState(false);
  const [installDone, setInstallDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const scrollLogsToBottom = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollLogsToBottom();
  }, [logs, scrollLogsToBottom]);

  // Check if all steps completed or errored
  useEffect(() => {
    // Clear any existing timer to prevent race conditions on rapid re-renders
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const steps = Object.values(installProgress);
    const allDone = steps.every(
      (s) => s.status === 'completed' || s.status === 'skipped'
    );
    const anyError = steps.some((s) => s.status === 'error');

    if (allDone && steps.length > 0 && installStarted) {
      setInstallDone(true);
      // Auto-advance after 2 seconds
      autoAdvanceTimerRef.current = setTimeout(() => {
        onNextRef.current();
      }, 2000);
    }

    if (anyError) {
      setHasError(true);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [installProgress, installStarted]);

  // Listen for install progress events and start installation
  useEffect(() => {
    const unsubscribe = EventsOn('install:progress', (data: InstallProgress) => {
      onProgressUpdate(data);
      onAddLog(`[${data.step}] ${data.status}: ${data.message}`);
    });

    // Start installation
    if (!installStarted) {
      setInstallStarted(true);
      onAddLog('Starting installation...');
      InstallAll().catch((err: any) => {
        onAddLog(`Installation error: ${err?.message || 'Unknown error'}`);
        setHasError(true);
      });
    }

    return () => {
      unsubscribe();
      EventsOff('install:progress');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallProgress = (() => {
    const steps = Object.values(installProgress);
    if (steps.length === 0) return 0;
    const total = steps.reduce((sum, s) => sum + s.percentage, 0);
    return Math.round(total / steps.length);
  })();

  const handleRetry = () => {
    setHasError(false);
    setInstallDone(false);
    setInstallStarted(false);
    // Reset progress will trigger re-install via useEffect
    setTimeout(() => {
      setInstallStarted(true);
      onAddLog('Retrying installation...');
      InstallAll().catch((err: any) => {
        onAddLog(`Installation error: ${err?.message || 'Unknown error'}`);
        setHasError(true);
      });
    }, 100);
  };

  return (
    <div className="flex flex-col h-full px-8 py-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">
          {t(translations, 'title', locale)}
        </h2>
        <p className="text-sm text-white/40">
          {t(translations, 'subtitle', locale)}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">
            {t(translations, 'overallProgress', locale)}
          </span>
          <span className="text-xs font-mono text-white/60">{overallProgress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Install Steps */}
      <div className="flex-1 space-y-2 overflow-auto scrollbar-dark">
        {['nodejs', 'git', 'claudecode'].map((stepKey) => {
          const info = stepInfo[stepKey];
          const progress = installProgress[stepKey];
          const style = statusStyles[progress?.status || 'pending'];

          return (
            <div
              key={stepKey}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                progress?.status === 'installing'
                  ? 'border-[#4361ee]/20 bg-[#4361ee]/[0.03]'
                  : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 text-white/50">
                  {info.icon}
                </div>

                {/* Name and Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">
                      {t(translations, info.nameKey, locale)}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.badge}`} />
                    <span className="text-[10px] text-white/40">
                      {t(translations, style.text, locale)}
                    </span>
                  </div>
                  <p className="text-xs text-white/30">
                    {progress?.message || t(translations, info.descKey, locale)}
                  </p>
                </div>

                {/* Status Icon */}
                <StatusIconComponent status={progress?.status || 'pending'} />
              </div>

              {/* Individual Progress */}
              {progress?.status === 'installing' && (
                <div className="mt-3 progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Completion / Error Message */}
        {installDone && !hasError && (
          <div className="p-4 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] text-center animate-scale-in">
            <div className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8L7 11L12 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-emerald-400">
                {t(translations, 'installComplete', locale)}
              </span>
            </div>
            <p className="text-xs text-white/30 mt-1">
              {t(translations, 'autoAdvance', locale)}
            </p>
          </div>
        )}

        {hasError && (
          <div className="p-4 rounded-lg border border-red-500/10 bg-red-500/[0.03] text-center animate-scale-in">
            <p className="text-sm text-red-400 mb-3">
              {t(translations, 'installError', locale)}
            </p>
            <button onClick={handleRetry} className="btn-secondary text-xs">
              {t(translations, 'retry', locale)}
            </button>
          </div>
        )}
      </div>

      {/* Log Panel */}
      <div className="mt-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="btn-ghost text-xs w-full justify-center"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`transition-transform duration-200 ${showLogs ? 'rotate-180' : ''}`}
          >
            <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showLogs
            ? t(translations, 'hideLogs', locale)
            : t(translations, 'showLogs', locale)}
        </button>

        {showLogs && (
          <div className="mt-2 rounded-lg border border-white/5 bg-[#0a0a14] max-h-32 overflow-auto scrollbar-dark animate-scale-in">
            <div className="p-3 font-mono text-[10px] text-white/40 space-y-0.5">
              {logs.length === 0 ? (
                <p className="text-white/20">No logs yet...</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className="leading-relaxed">
                    {log}
                  </p>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {(installDone || hasError) && (
        <div className="flex justify-end pt-3">
          <button onClick={onNext} className="btn-primary" disabled={hasError}>
            {t(translations, 'continue', locale)}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Installing;
