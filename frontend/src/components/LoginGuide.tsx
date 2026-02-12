import React, { useState } from 'react';
import { OpenTerminal, OpenURL } from '../../wailsjs/go/main/App';
import { type Locale, t } from '../hooks/useInstaller';

const translations = {
  title: {
    ko: 'Claude Code 인증하기',
    en: 'Authenticate Claude Code',
  },
  subtitle: {
    ko: '아래 단계를 따라 Claude Code를 인증하세요',
    en: 'Follow the steps below to authenticate Claude Code',
  },
  step1Title: {
    ko: '터미널 열기',
    en: 'Open Terminal',
  },
  step1Desc: {
    ko: 'PowerShell 또는 명령 프롬프트(CMD)를 엽니다',
    en: 'Open PowerShell or Command Prompt (CMD)',
  },
  step2Title: {
    ko: 'claude 명령어 입력',
    en: 'Type claude command',
  },
  step2Desc: {
    ko: '터미널에 claude 를 입력하고 Enter를 누릅니다',
    en: 'Type claude in the terminal and press Enter',
  },
  step3Title: {
    ko: '브라우저 인증',
    en: 'Browser Authentication',
  },
  step3Desc: {
    ko: '자동으로 브라우저가 열리며 인증 페이지가 표시됩니다',
    en: 'A browser window will open automatically with the auth page',
  },
  step4Title: {
    ko: 'Anthropic 계정으로 로그인',
    en: 'Log in with Anthropic Account',
  },
  step4Desc: {
    ko: 'Anthropic 계정으로 로그인합니다. 계정이 없다면 새로 만드세요.',
    en: 'Sign in with your Anthropic account. Create one if you don\'t have it.',
  },
  step5Title: {
    ko: '터미널로 돌아가기',
    en: 'Return to Terminal',
  },
  step5Desc: {
    ko: '인증이 완료되면 터미널로 돌아갑니다. 이제 사용할 준비가 되었습니다!',
    en: 'After authentication, return to the terminal. You\'re ready to go!',
  },
  openTerminal: {
    ko: '터미널 열기',
    en: 'Open Terminal',
  },
  createAccount: {
    ko: 'Anthropic 계정 만들기',
    en: 'Create Anthropic Account',
  },
  next: {
    ko: '다음',
    en: 'Next',
  },
  back: {
    ko: '뒤로',
    en: 'Back',
  },
  errorOpenTerminal: {
    ko: '터미널을 여는데 실패했습니다',
    en: 'Failed to open terminal',
  },
  errorOpenUrl: {
    ko: 'URL을 여는데 실패했습니다',
    en: 'Failed to open URL',
  },
};

interface LoginGuideProps {
  locale: Locale;
  onNext: () => void;
  onBack: () => void;
}

const guideSteps = [
  {
    titleKey: 'step1Title',
    descKey: 'step1Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 9L8 12L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titleKey: 'step2Title',
    descKey: 'step2Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 16H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 4L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 4V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    hasCodeBlock: true,
  },
  {
    titleKey: 'step3Title',
    descKey: 'step3Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 3C6.13 3 3 6.13 3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 7L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titleKey: 'step4Title',
    descKey: 'step4Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 17C4 14.2386 6.23858 12 9 12H11C13.7614 12 16 14.2386 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titleKey: 'step5Title',
    descKey: 'step5Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const LoginGuide: React.FC<LoginGuideProps> = ({ locale, onNext, onBack }) => {
  const [terminalError, setTerminalError] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');

  const handleOpenTerminal = async () => {
    try {
      setTerminalError('');
      await OpenTerminal();
    } catch (err) {
      console.error('Failed to open terminal:', err);
      setTerminalError(t(translations, 'errorOpenTerminal', locale));
      setTimeout(() => setTerminalError(''), 5000);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setUrlError('');
      await OpenURL('https://console.anthropic.com/');
    } catch (err) {
      console.error('Failed to open URL:', err);
      setUrlError(t(translations, 'errorOpenUrl', locale));
      setTimeout(() => setUrlError(''), 5000);
    }
  };

  return (
    <div className="flex flex-col h-full px-8 py-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white mb-1">
          {t(translations, 'title', locale)}
        </h2>
        <p className="text-sm text-white/40">
          {t(translations, 'subtitle', locale)}
        </p>
      </div>

      {/* Guide Steps */}
      <div className="flex-1 overflow-auto scrollbar-dark">
        <div className="space-y-4 stagger-children">
          {guideSteps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 opacity-0 animate-fade-in-up relative"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Step Number */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center">
                <span className="text-xs font-medium text-[#da7756]">
                  {index + 1}
                </span>
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/40">{step.icon}</span>
                  <h3 className="text-sm font-medium text-white">
                    {t(translations, step.titleKey, locale)}
                  </h3>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  {t(translations, step.descKey, locale)}
                </p>

                {/* Code Block for step 2 */}
                {step.hasCodeBlock && (
                  <div className="mt-2">
                    <div className="code-block flex items-center justify-between">
                      <span>claude</span>
                      <span className="text-[10px] text-white/20 select-none">
                        {locale === 'ko' ? '클릭하여 선택' : 'click to select'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connector Line (except last) */}
              {index < guideSteps.length - 1 && (
                <div className="absolute left-3 top-8 w-px h-[calc(100%-1rem)] bg-white/5" />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <div className="flex gap-3">
            <button onClick={handleOpenTerminal} className="btn-primary flex-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7L6 9L4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t(translations, 'openTerminal', locale)}
            </button>
            <button onClick={handleCreateAccount} className="btn-secondary flex-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 14C3 11.2386 5.23858 9 8 9C10.7614 9 13 11.2386 13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {t(translations, 'createAccount', locale)}
            </button>
          </div>
          {(terminalError || urlError) && (
            <p className="text-xs text-red-400 mt-2 ml-1">
              {terminalError || urlError}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-auto">
        <button onClick={onBack} className="btn-ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(translations, 'back', locale)}
        </button>
        <button onClick={onNext} className="btn-primary">
          {t(translations, 'next', locale)}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LoginGuide;
