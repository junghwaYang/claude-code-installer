import React, { useCallback, useMemo } from 'react';
import Welcome from './components/Welcome';
import SystemCheck from './components/SystemCheck';
import Installing from './components/Installing';
import LoginGuide from './components/LoginGuide';
import Complete from './components/Complete';
import { useInstaller, type Locale, t } from './hooks/useInstaller';

const stepTranslations = {
  step1: { ko: '환영', en: 'Welcome' },
  step2: { ko: '시스템 점검', en: 'System Check' },
  step3: { ko: '설치 중', en: 'Installing' },
  step4: { ko: '로그인 안내', en: 'Login Guide' },
  step5: { ko: '완료', en: 'Complete' },
  langToggle: { ko: 'EN', en: '한국어' },
};

const stepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

const StepIndicator: React.FC<{
  currentStep: number;
  locale: Locale;
}> = ({ currentStep, locale }) => (
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

const LanguageToggle: React.FC<{
  locale: Locale;
  onToggle: () => void;
}> = ({ locale, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
               text-xs font-medium text-white/40
               border border-white/10 bg-white/5
               transition-all duration-200
               hover:text-white/70 hover:border-white/20 hover:bg-white/[0.07]
               active:scale-95"
    title={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
    {t(stepTranslations, 'langToggle', locale)}
  </button>
);

const App: React.FC = () => {
  const {
    state,
    nextStep,
    prevStep,
    goToStep,
    toggleLocale,
    setSystemCheck,
    updateInstallProgress,
    addLog,
  } = useInstaller();

  const { currentStep, locale, systemCheck, installProgress, logs } = state;

  const handleSkipToComplete = useCallback(() => {
    goToStep(5);
  }, [goToStep]);

  const handleSystemCheckComplete = useCallback(
    (result: any) => {
      setSystemCheck(result);
    },
    [setSystemCheck]
  );

  const currentStepContent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <Welcome locale={locale} onNext={nextStep} />;
      case 2:
        return (
          <SystemCheck
            locale={locale}
            onNext={nextStep}
            onBack={prevStep}
            onSkipToComplete={handleSkipToComplete}
            onSystemCheckComplete={handleSystemCheckComplete}
          />
        );
      case 3:
        return (
          <Installing
            locale={locale}
            onNext={nextStep}
            installProgress={installProgress}
            onProgressUpdate={updateInstallProgress}
            onAddLog={addLog}
            logs={logs}
          />
        );
      case 4:
        return (
          <LoginGuide locale={locale} onNext={nextStep} onBack={prevStep} />
        );
      case 5:
        return <Complete locale={locale} systemCheck={systemCheck} />;
      default:
        return <Welcome locale={locale} onNext={nextStep} />;
    }
  }, [
    currentStep,
    locale,
    systemCheck,
    installProgress,
    logs,
    nextStep,
    prevStep,
    handleSkipToComplete,
    handleSystemCheckComplete,
    updateInstallProgress,
    addLog,
  ]);

  return (
    <div className="h-screen w-screen bg-app flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} locale={locale} />

        {/* Language Toggle */}
        <div className="pr-4">
          <LanguageToggle locale={locale} onToggle={toggleLocale} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          key={currentStep}
          className="absolute inset-0 step-transition-enter"
          ref={(el) => {
            if (el) {
              // Trigger transition on next frame
              requestAnimationFrame(() => {
                el.classList.remove('step-transition-enter');
                el.classList.add('step-transition-active');
              });
            }
          }}
        >
          {currentStepContent}
        </div>
      </div>

      {/* Window drag region (Wails) */}
      <div
        className="fixed top-0 left-0 right-0 h-8 pointer-events-none"
        style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
      />
    </div>
  );
};

export default App;
