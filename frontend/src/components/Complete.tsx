import React from 'react';
import { OpenTerminal, OpenURL } from '../../wailsjs/go/main/App';
import { Quit } from '../../wailsjs/runtime/runtime';
import { type Locale, type SystemCheckResult, t } from '../hooks/useInstaller';

const translations = {
  title: {
    ko: '설치가 완료되었습니다!',
    en: 'Installation Complete!',
  },
  subtitle: {
    ko: 'Claude Code를 사용할 준비가 되었습니다',
    en: 'Claude Code is ready to use',
  },
  installedSoftware: {
    ko: '설치된 소프트웨어',
    en: 'Installed Software',
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
  usefulLinks: {
    ko: '유용한 링크',
    en: 'Useful Links',
  },
  documentation: {
    ko: 'Claude Code 문서',
    en: 'Claude Code Documentation',
  },
  github: {
    ko: 'GitHub 저장소',
    en: 'GitHub Repository',
  },
  community: {
    ko: '커뮤니티 (Discord)',
    en: 'Community (Discord)',
  },
  launchTerminal: {
    ko: '터미널에서 Claude 시작하기',
    en: 'Launch Claude in Terminal',
  },
  exit: {
    ko: '프로그램 종료',
    en: 'Exit',
  },
  installed: {
    ko: '설치됨',
    en: 'Installed',
  },
  congratulations: {
    ko: '축하합니다!',
    en: 'Congratulations!',
  },
};

interface CompleteProps {
  locale: Locale;
  systemCheck: SystemCheckResult | null;
}

const links = [
  {
    nameKey: 'documentation',
    url: 'https://docs.anthropic.com/en/docs/claude-code',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 3H11L15 7V15H3V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 3V7H15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    nameKey: 'github',
    url: 'https://github.com/anthropics/claude-code',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 12.31 3.67 15.1 6.71 16.13C7.09 16.2 7.23 15.97 7.23 15.77V14.37C5.03 14.83 4.59 13.37 4.59 13.37C4.24 12.48 3.73 12.25 3.73 12.25C3.03 11.77 3.78 11.78 3.78 11.78C4.55 11.83 4.96 12.57 4.96 12.57C5.64 13.75 6.76 13.42 7.25 13.23C7.32 12.73 7.53 12.39 7.75 12.2C5.97 12 4.1 11.3 4.1 8.43C4.1 7.59 4.41 6.9 4.97 6.36C4.89 6.16 4.63 5.38 5.05 4.33C5.05 4.33 5.69 4.12 7.22 5.1C7.84 4.92 8.5 4.83 9.16 4.83C9.82 4.83 10.48 4.92 11.1 5.1C12.63 4.12 13.27 4.33 13.27 4.33C13.69 5.38 13.43 6.16 13.35 6.36C13.91 6.9 14.22 7.59 14.22 8.43C14.22 11.31 12.34 12 10.55 12.19C10.83 12.43 11.08 12.91 11.08 13.64V15.77C11.08 15.97 11.22 16.21 11.61 16.13C14.64 15.1 16.81 12.31 16.81 9C16.81 4.86 13.45 1.5 9.31 1.5H9Z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    nameKey: 'community',
    url: 'https://discord.gg/anthropic',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M14.5 3.5C13.35 3 12.12 2.63 10.83 2.44C10.67 2.73 10.5 3.11 10.38 3.41C9.01 3.24 7.66 3.24 6.31 3.41C6.19 3.11 6.01 2.73 5.86 2.44C4.56 2.63 3.34 3 2.19 3.51C0.31 6.35 -0.19 9.12 0.06 11.85C1.55 12.97 2.99 13.65 4.41 14.1C4.77 13.61 5.09 13.09 5.37 12.53C4.84 12.34 4.33 12.1 3.85 11.82C3.97 11.73 4.09 11.64 4.2 11.54C6.66 12.69 9.36 12.69 11.79 11.54C11.91 11.64 12.02 11.73 12.14 11.82C11.66 12.1 11.15 12.34 10.62 12.53C10.9 13.09 11.22 13.61 11.58 14.1C13 13.65 14.45 12.97 15.94 11.85C16.23 8.7 15.33 5.95 14.5 3.5Z" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="6" cy="9" r="1" fill="currentColor" />
        <circle cx="12" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

const CheckmarkAnimation: React.FC = () => (
  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 animate-scale-in">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="#10b981"
        strokeWidth="2"
        opacity="0.3"
      />
      <path
        d="M12 20L18 26L28 14"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-checkmark"
      />
    </svg>
  </div>
);

const SoftwareVersionRow: React.FC<{
  name: string;
  version: string;
  installed: boolean;
}> = ({ name, version, installed }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          installed ? 'bg-emerald-400' : 'bg-white/20'
        }`}
      />
      <span className="text-sm text-white/80">{name}</span>
    </div>
    {installed && version && (
      <span className="text-xs font-mono text-white/40">v{version}</span>
    )}
  </div>
);

const Complete: React.FC<CompleteProps> = ({ locale, systemCheck }) => {
  const handleOpenTerminal = async () => {
    try {
      await OpenTerminal();
    } catch (err) {
      console.error('Failed to open terminal:', err);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await OpenURL(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  const handleExit = () => {
    try {
      Quit();
    } catch {
      window.close();
    }
  };

  return (
    <div className="flex flex-col items-center h-full px-8 py-6 overflow-auto scrollbar-dark">
      {/* Celebration */}
      <div className="flex flex-col items-center text-center mb-6 pt-2">
        <CheckmarkAnimation />
        <h2 className="text-2xl font-bold text-white mb-1 animate-fade-in-up">
          {t(translations, 'title', locale)}
        </h2>
        <p className="text-sm text-white/40 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {t(translations, 'subtitle', locale)}
        </p>
      </div>

      {/* Installed Software Card */}
      {systemCheck && (
        <div
          className="card w-full max-w-md p-4 mb-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '150ms' }}
        >
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            {t(translations, 'installedSoftware', locale)}
          </h3>
          <div className="divide-y divide-white/5">
            <SoftwareVersionRow
              name={t(translations, 'nodejs', locale)}
              version={systemCheck.nodejs.version}
              installed={systemCheck.nodejs.installed}
            />
            <SoftwareVersionRow
              name={t(translations, 'git', locale)}
              version={systemCheck.git.version}
              installed={systemCheck.git.installed}
            />
            <SoftwareVersionRow
              name={t(translations, 'claudeCode', locale)}
              version={systemCheck.claudeCode.version}
              installed={systemCheck.claudeCode.installed}
            />
          </div>
        </div>
      )}

      {/* Useful Links */}
      <div
        className="card w-full max-w-md p-4 mb-6 opacity-0 animate-fade-in-up"
        style={{ animationDelay: '250ms' }}
      >
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          {t(translations, 'usefulLinks', locale)}
        </h3>
        <div className="space-y-2">
          {links.map((link) => (
            <button
              key={link.nameKey}
              onClick={() => handleOpenLink(link.url)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                         text-left text-sm text-white/60
                         transition-all duration-200
                         hover:bg-white/5 hover:text-white/90"
            >
              <span className="text-white/40">{link.icon}</span>
              <span>{t(translations, link.nameKey, locale)}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="ml-auto text-white/20"
              >
                <path
                  d="M5 9L9 5M9 5H5.5M9 5V8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="w-full max-w-md flex gap-3 mt-auto opacity-0 animate-fade-in-up"
        style={{ animationDelay: '350ms' }}
      >
        <button onClick={handleOpenTerminal} className="btn-primary flex-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 7L6 9L4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(translations, 'launchTerminal', locale)}
        </button>
        <button onClick={handleExit} className="btn-secondary">
          {t(translations, 'exit', locale)}
        </button>
      </div>
    </div>
  );
};

export default Complete;
