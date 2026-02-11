import React, { useCallback, useMemo } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Welcome from './components/Welcome';
import SystemCheck from './components/SystemCheck';
import Installing from './components/Installing';
import LoginGuide from './components/LoginGuide';
import Complete from './components/Complete';
import StepIndicator from './components/StepIndicator';
import LanguageToggle from './components/LanguageToggle';
import { useInstaller } from './hooks/useInstaller';

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
