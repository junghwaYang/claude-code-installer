import React, { useEffect, useState } from 'react';
import { CheckSystem } from '../../wailsjs/go/main/App';
import {
  type Locale,
  type SystemCheckResult,
  t,
} from '../hooks/useInstaller';

const translations = {
  title: {
    ko: '시스템 점검',
    en: 'System Check',
  },
  subtitle: {
    ko: '설치에 필요한 소프트웨어를 확인하고 있습니다',
    en: 'Checking required software for installation',
  },
  checking: {
    ko: '시스템을 확인하는 중...',
    en: 'Checking system...',
  },
  installed: {
    ko: '설치됨',
    en: 'Installed',
  },
  notInstalled: {
    ko: '미설치',
    en: 'Not Installed',
  },
  wingetAvailable: {
    ko: 'winget 사용 가능',
    en: 'winget available',
  },
  wingetUnavailable: {
    ko: 'winget 사용 불가',
    en: 'winget unavailable',
  },
  skipMessage: {
    ko: '이미 설치된 항목은 건너뜁니다',
    en: 'Already installed items will be skipped',
  },
  allInstalled: {
    ko: '모든 구성 요소가 이미 설치되어 있습니다!',
    en: 'All components are already installed!',
  },
  proceed: {
    ko: '설치 진행',
    en: 'Proceed with Installation',
  },
  skip: {
    ko: '완료로 건너뛰기',
    en: 'Skip to Complete',
  },
  back: {
    ko: '뒤로',
    en: 'Back',
  },
  retry: {
    ko: '다시 확인',
    en: 'Retry Check',
  },
  errorChecking: {
    ko: '시스템 확인 중 오류가 발생했습니다',
    en: 'Error occurred while checking system',
  },
  nodejs: {
    ko: 'Node.js',
    en: 'Node.js',
  },
  git: {
    ko: 'Git',
    en: 'Git',
  },
  claudeCode: {
    ko: 'Claude Code',
    en: 'Claude Code',
  },
};

interface SystemCheckProps {
  locale: Locale;
  onNext: () => void;
  onBack: () => void;
  onSkipToComplete: () => void;
  onSystemCheckComplete: (result: SystemCheckResult) => void;
}

const StatusIcon: React.FC<{ installed: boolean }> = ({ installed }) =>
  installed ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path
        d="M4 8L7 11L12 5"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path
        d="M5 5L11 11M11 5L5 11"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

const SoftwareRow: React.FC<{
  name: string;
  installed: boolean;
  version: string;
  locale: Locale;
  delay: number;
}> = ({ name, installed, version, locale, delay }) => (
  <div
    className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/[0.02] border border-white/5 opacity-0 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-3">
      <StatusIcon installed={installed} />
      <span className="text-sm font-medium text-white">{name}</span>
    </div>
    <div className="flex items-center gap-2.5">
      {installed && version && (
        <span className="text-xs text-white/40 font-mono">v{version}</span>
      )}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            installed ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        <span className="text-xs text-white/40">
          {installed
            ? t(translations, 'installed', locale)
            : t(translations, 'notInstalled', locale)}
        </span>
      </div>
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-8 h-8 rounded-full border border-white/10 border-t-[#da7756] animate-spin-slow mb-4" />
    <p className="text-sm text-white/40 animate-pulse-soft">
      Checking system...
    </p>
  </div>
);

const SystemCheck: React.FC<SystemCheckProps> = ({
  locale,
  onNext,
  onBack,
  onSkipToComplete,
  onSystemCheckComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SystemCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const checkResult = await CheckSystem();
      setResult(checkResult);
      onSystemCheckComplete(checkResult);
    } catch (err: any) {
      setError(err?.message || t(translations, 'errorChecking', locale));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">
          {t(translations, 'title', locale)}
        </h2>
        <p className="text-sm text-white/40">
          {t(translations, 'subtitle', locale)}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-dark">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
            <button onClick={runCheck} className="btn-secondary">
              {t(translations, 'retry', locale)}
            </button>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <SoftwareRow
              name={t(translations, 'nodejs', locale)}
              installed={result.nodejs.installed}
              version={result.nodejs.version}
              locale={locale}
              delay={50}
            />
            <SoftwareRow
              name={t(translations, 'git', locale)}
              installed={result.git.installed}
              version={result.git.version}
              locale={locale}
              delay={100}
            />
            <SoftwareRow
              name={t(translations, 'claudeCode', locale)}
              installed={result.claudeCode.installed}
              version={result.claudeCode.version}
              locale={locale}
              delay={150}
            />

            {/* Winget Status */}
            <div
              className="flex items-center gap-2 px-4 py-2 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  result.wingetAvailable ? 'bg-emerald-400' : 'bg-yellow-400'
                }`}
              />
              <span className="text-xs text-white/40">
                {result.wingetAvailable
                  ? t(translations, 'wingetAvailable', locale)
                  : t(translations, 'wingetUnavailable', locale)}
              </span>
            </div>

            {/* Skip / Info Message */}
            <div
              className="mt-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '250ms' }}
            >
              {result.nodejs.installed && result.git.installed && result.claudeCode.installed ? (
                <div className="p-4 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] text-center">
                  <div className="flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 8L7 11L12 5"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm font-medium text-emerald-400">
                      {t(translations, 'allInstalled', locale)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/30 text-center">
                  {t(translations, 'skipMessage', locale)}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer Buttons */}
      {!loading && (
        <div className="flex items-center justify-between pt-4 mt-auto">
          <button onClick={onBack} className="btn-ghost">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 4L6 8L10 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t(translations, 'back', locale)}
          </button>

          <div className="flex gap-3">
            {result?.nodejs.installed && result?.git.installed && result?.claudeCode.installed && (
              <button onClick={onSkipToComplete} className="btn-secondary">
                {t(translations, 'skip', locale)}
              </button>
            )}
            <button
              onClick={onNext}
              className="btn-primary"
              disabled={loading || !!error}
            >
              {t(translations, 'proceed', locale)}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemCheck;
