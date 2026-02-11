import React from 'react';
import { type Locale, t } from '../hooks/useInstaller';

const translations = {
  langToggle: { ko: 'EN', en: '한국어' },
};

interface LanguageToggleProps {
  locale: Locale;
  onToggle: () => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ locale, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
               text-xs font-medium text-white/40
               border border-white/10 bg-white/5
               transition-all duration-200
               hover:text-white/70 hover:border-white/20 hover:bg-white/[0.07]
               active:scale-95"
    title={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
    aria-label={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
    {t(translations, 'langToggle', locale)}
  </button>
);

export default LanguageToggle;
