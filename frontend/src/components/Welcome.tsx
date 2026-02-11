import React, { useEffect, useState } from 'react';
import { GetAppVersion } from '../wailsjs/go/main/App';
import { type Locale, t } from '../hooks/useInstaller';

const translations = {
  title: {
    ko: 'Claude Code 설치 마법사',
    en: 'Claude Code Setup Wizard',
  },
  description: {
    ko: 'Node.js, Git, Claude Code를 한 번에 설치합니다',
    en: 'Install Node.js, Git, and Claude Code all at once',
  },
  startButton: {
    ko: '설치 시작',
    en: 'Start Installation',
  },
  feature1Title: {
    ko: '원클릭 설치',
    en: 'One-Click Install',
  },
  feature1Desc: {
    ko: '복잡한 설정 없이 버튼 하나로 모든 것을 설치합니다',
    en: 'Install everything with a single click, no complex setup needed',
  },
  feature2Title: {
    ko: '자동 의존성 관리',
    en: 'Auto Dependency Management',
  },
  feature2Desc: {
    ko: '필요한 모든 소프트웨어를 자동으로 감지하고 설치합니다',
    en: 'Automatically detects and installs all required software',
  },
  feature3Title: {
    ko: '스마트 건너뛰기',
    en: 'Smart Skip',
  },
  feature3Desc: {
    ko: '이미 설치된 도구는 자동으로 건너뛰어 시간을 절약합니다',
    en: 'Already installed tools are automatically skipped to save time',
  },
};

interface WelcomeProps {
  locale: Locale;
  onNext: () => void;
}

const TerminalIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect
      x="4"
      y="8"
      width="56"
      height="48"
      rx="8"
      fill="url(#termGrad)"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="1.5"
    />
    <path
      d="M18 24L28 32L18 40"
      stroke="#da7756"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="32"
      y1="40"
      x2="46"
      y2="40"
      stroke="#4361ee"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="termGrad" x1="4" y1="8" x2="60" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1a1a2e" />
        <stop offset="1" stopColor="#16213e" />
      </linearGradient>
    </defs>
  </svg>
);

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => (
  <div
    className="card-hover p-4 flex items-start gap-4 opacity-0 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#da7756]/20 to-[#4361ee]/20 flex items-center justify-center text-[#da7756]">
      {icon}
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-white/50 leading-relaxed">{description}</p>
    </div>
  </div>
);

const Welcome: React.FC<WelcomeProps> = ({ locale, onNext }) => {
  const [version, setVersion] = useState('');

  useEffect(() => {
    GetAppVersion()
      .then(setVersion)
      .catch(() => setVersion('1.0.0'));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-6">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-6 opacity-0 animate-fade-in-up">
        <TerminalIcon />
        <h1 className="text-2xl font-bold text-white mt-4 mb-2">
          {t(translations, 'title', locale)}
        </h1>
        <p className="text-sm text-white/50 text-center max-w-md">
          {t(translations, 'description', locale)}
        </p>
      </div>

      {/* Feature Cards */}
      <div className="w-full max-w-md space-y-3 mb-8">
        <FeatureCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 3L17 7L13 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 17L3 13L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title={t(translations, 'feature1Title', locale)}
          description={t(translations, 'feature1Desc', locale)}
          delay={100}
        />
        <FeatureCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2V18M10 2L6 6M10 2L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          title={t(translations, 'feature2Title', locale)}
          description={t(translations, 'feature2Desc', locale)}
          delay={200}
        />
        <FeatureCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title={t(translations, 'feature3Title', locale)}
          description={t(translations, 'feature3Desc', locale)}
          delay={300}
        />
      </div>

      {/* Start Button */}
      <button
        onClick={onNext}
        className="btn-primary text-base px-10 py-3.5 opacity-0 animate-fade-in-up"
        style={{ animationDelay: '400ms' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t(translations, 'startButton', locale)}
      </button>

      {/* Version */}
      {version && (
        <p className="text-[10px] text-white/20 mt-4 opacity-0 animate-fade-in" style={{ animationDelay: '600ms' }}>
          v{version}
        </p>
      )}
    </div>
  );
};

export default Welcome;
