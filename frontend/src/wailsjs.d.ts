// Wails v2 Runtime API type declarations
declare module '../../wailsjs/runtime/runtime' {
  /**
   * Subscribe to a Wails event. Returns an unsubscribe function.
   */
  export function EventsOn(
    eventName: string,
    callback: (...data: any[]) => void
  ): () => void;

  /**
   * Unsubscribe from a Wails event by name.
   */
  export function EventsOff(eventName: string): void;

  /**
   * Emit a Wails event with optional data.
   */
  export function EventsEmit(eventName: string, ...data: any[]): void;

  /**
   * Subscribe to a Wails event only once.
   */
  export function EventsOnce(
    eventName: string,
    callback: (...data: any[]) => void
  ): () => void;

  /**
   * Subscribe to a Wails event for a maximum number of times.
   */
  export function EventsOnMultiple(
    eventName: string,
    callback: (...data: any[]) => void,
    maxCallbacks: number
  ): () => void;

  /**
   * Quit the application.
   */
  export function Quit(): void;

  /**
   * Hide the application window.
   */
  export function Hide(): void;

  /**
   * Show the application window.
   */
  export function Show(): void;

  /**
   * Get the current environment info.
   */
  export function Environment(): Promise<{
    buildType: string;
    platform: string;
    arch: string;
  }>;

  /**
   * Open a URL in the default browser.
   */
  export function BrowserOpenURL(url: string): void;

  /**
   * Log a message to the Wails logger.
   */
  export function LogDebug(message: string): void;
  export function LogInfo(message: string): void;
  export function LogWarning(message: string): void;
  export function LogError(message: string): void;
}

// Wails Go Backend Bindings
declare module '../../wailsjs/go/main/App' {
  /**
   * Checks the system for required software (Node.js, Git, Claude Code).
   * Returns a SystemCheckResult object.
   */
  export function CheckSystem(): Promise<SystemCheckResult>;

  /**
   * Installs all missing components. Emits 'install:progress' events.
   */
  export function InstallAll(): Promise<void>;

  /**
   * Install Node.js only.
   */
  export function InstallNodeJS(): Promise<void>;

  /**
   * Install Git only.
   */
  export function InstallGit(): Promise<void>;

  /**
   * Install Claude Code only.
   */
  export function InstallClaudeCode(): Promise<void>;

  /**
   * Check if a Claude Code update is available.
   */
  export function CheckClaudeCodeUpdate(): Promise<UpdateCheckResult>;

  /**
   * Update Claude Code to the latest version.
   */
  export function UpdateClaudeCode(): Promise<void>;

  /**
   * Open a terminal window (PowerShell or CMD).
   */
  export function OpenTerminal(): Promise<void>;

  /**
   * Open a URL in the default browser.
   */
  export function OpenURL(url: string): Promise<void>;

  /**
   * Get the application version string.
   */
  export function GetAppVersion(): Promise<string>;
}

// Shared type definitions for the installer
interface SoftwareStatus {
  name: string;
  installed: boolean;
  version: string;
  required: boolean;
}

interface SystemCheckResult {
  nodejs: SoftwareStatus;
  git: SoftwareStatus;
  claudeCode: SoftwareStatus;
  wingetAvailable: boolean;
}

interface InstallProgress {
  step: string;
  status: 'pending' | 'installing' | 'completed' | 'error' | 'skipped';
  message: string;
  percentage: number;
}

interface UpdateCheckResult {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
}
