import React from 'react';
import { type Locale, t } from '../hooks/useInstaller';

const stepTranslations = {
  step1: { ko: '환영', en: 'Welcome' },
  step2: { ko: '시스템 점검', en: 'System Check' },
  step3: { ko: '설치 중', en: 'Installing' },
  step4: { ko: '로그인 안내', en: 'Login Guide' },
  step5: { ko: '완료', en: 'Complete' },
};

const stepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

interface StepIndicatorProps {
  currentStep: number;
  locale: Locale;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, locale }) => (
  <div className="flex items-center gap-1 px-6 py-3">
    {stepKeys.map((key, index) => {
      const stepNum = index + 1;
      const isActive = stepNum === currentStep;
      const isCompleted = stepNum < currentStep;

      return (
        <React.Fragment key={key}>
          <div className="flex items-center gap-2">
            {/* Badge */}
            <div
              className={
                isCompleted
                  ? 'step-badge-completed'
                  : isActive
                  ? 'step-badge-active'
                  : 'step-badge-pending'
              }
            >
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7L6 10L11 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                stepNum
              )}
            </div>

            {/* Label (visible on active step or wider screens) */}
            <span
              className={`text-xs font-medium transition-all duration-300 hidden sm:inline ${
                isActive
                  ? 'text-white'
                  : isCompleted
                  ? 'text-white/50'
                  : 'text-white/25'
              }`}
            >
              {t(stepTranslations, key, locale)}
            </span>
          </div>

          {/* Connector */}
          {index < stepKeys.length - 1 && (
            <div
              className={`flex-1 h-px min-w-[16px] max-w-[40px] transition-colors duration-300 ${
                stepNum < currentStep ? 'bg-[#4361ee]' : 'bg-white/10'
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepIndicator;
