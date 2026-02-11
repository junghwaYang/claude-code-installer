package main

import (
	"context"
	"fmt"
	neturl "net/url"
	"os/exec"
	goruntime "runtime"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"claude-code-installer/internal/detector"
	"claude-code-installer/internal/installer"
)

const (
	// AppVersion is the current version of the application.
	AppVersion = "1.0.0"
)

// SoftwareStatus represents the installation status of a software component.
type SoftwareStatus struct {
	Name      string `json:"name"`
	Installed bool   `json:"installed"`
	Version   string `json:"version"`
	Required  bool   `json:"required"`
}

// SystemCheckResult contains the status of all required software components.
type SystemCheckResult struct {
	NodeJS          SoftwareStatus `json:"nodejs"`
	Git             SoftwareStatus `json:"git"`
	ClaudeCode      SoftwareStatus `json:"claudeCode"`
	WingetAvailable bool           `json:"wingetAvailable"`
}

// InstallProgress represents the current progress of an installation step.
type InstallProgress struct {
	Step       string  `json:"step"`
	Status     string  `json:"status"` // "pending", "installing", "completed", "error"
	Message    string  `json:"message"`
	Percentage float64 `json:"percentage"`
}

// UpdateInfo contains information about available updates.
type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
}

// App struct holds the application state and is bound to the frontend.
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the Wails runtime methods.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// CheckSystem performs a comprehensive check of all required software.
func (a *App) CheckSystem() (*SystemCheckResult, error) {
	detectorResult := detector.CheckAll()

	result := &SystemCheckResult{
		NodeJS: SoftwareStatus{
			Name:      detectorResult.NodeJS.Name,
			Installed: detectorResult.NodeJS.Installed,
			Version:   detectorResult.NodeJS.Version,
			Required:  detectorResult.NodeJS.Required,
		},
		Git: SoftwareStatus{
			Name:      detectorResult.Git.Name,
			Installed: detectorResult.Git.Installed,
			Version:   detectorResult.Git.Version,
			Required:  detectorResult.Git.Required,
		},
		ClaudeCode: SoftwareStatus{
			Name:      detectorResult.ClaudeCode.Name,
			Installed: detectorResult.ClaudeCode.Installed,
			Version:   detectorResult.ClaudeCode.Version,
			Required:  detectorResult.ClaudeCode.Required,
		},
		WingetAvailable: detectorResult.WingetAvailable,
	}

	return result, nil
}

// InstallAll installs all missing software components in sequence.
// It emits "install:progress" events to the frontend for real-time updates.
func (a *App) InstallAll() error {
	inst := installer.NewInstaller(a.ctx, func(progress installer.InstallProgress) {
		a.emitInstallProgress(progress.Step, progress.Status, progress.Message, progress.Percentage)
	})

	// Step 1: Install Node.js (required for npm)
	a.emitInstallProgress("nodejs", "installing", "Starting Node.js installation...", 0)
	if err := inst.InstallNodeJS(); err != nil {
		a.emitInstallProgress("nodejs", "error", err.Error(), 0)
		return fmt.Errorf("Node.js installation failed: %w", err)
	}

	// Step 2: Install Git
	a.emitInstallProgress("git", "installing", "Starting Git installation...", 0)
	if err := inst.InstallGit(); err != nil {
		a.emitInstallProgress("git", "error", err.Error(), 0)
		return fmt.Errorf("Git installation failed: %w", err)
	}

	// Step 3: Install Claude Code (requires npm from Node.js)
	a.emitInstallProgress("claudecode", "installing", "Starting Claude Code installation...", 0)
	if err := inst.InstallClaudeCode(); err != nil {
		a.emitInstallProgress("claudecode", "error", err.Error(), 0)
		return fmt.Errorf("Claude Code installation failed: %w", err)
	}

	a.emitInstallProgress("complete", "completed", "All installations completed successfully!", 100)
	return nil
}

// InstallNodeJS installs Node.js.
func (a *App) InstallNodeJS() error {
	inst := installer.NewInstaller(a.ctx, func(progress installer.InstallProgress) {
		a.emitInstallProgress(progress.Step, progress.Status, progress.Message, progress.Percentage)
	})

	return inst.InstallNodeJS()
}

// InstallGit installs Git.
func (a *App) InstallGit() error {
	inst := installer.NewInstaller(a.ctx, func(progress installer.InstallProgress) {
		a.emitInstallProgress(progress.Step, progress.Status, progress.Message, progress.Percentage)
	})

	return inst.InstallGit()
}

// InstallClaudeCode installs the Claude Code CLI.
func (a *App) InstallClaudeCode() error {
	inst := installer.NewInstaller(a.ctx, func(progress installer.InstallProgress) {
		a.emitInstallProgress(progress.Step, progress.Status, progress.Message, progress.Percentage)
	})

	return inst.InstallClaudeCode()
}

// CheckClaudeCodeUpdate checks if a newer version of Claude Code is available.
func (a *App) CheckClaudeCodeUpdate() (*UpdateInfo, error) {
	inst := installer.NewInstaller(a.ctx, nil)

	updateInfo, err := inst.CheckUpdate()
	if err != nil {
		return nil, err
	}

	return &UpdateInfo{
		Available:      updateInfo.Available,
		CurrentVersion: updateInfo.CurrentVersion,
		LatestVersion:  updateInfo.LatestVersion,
	}, nil
}

// UpdateClaudeCode updates Claude Code to the latest version.
func (a *App) UpdateClaudeCode() error {
	inst := installer.NewInstaller(a.ctx, func(progress installer.InstallProgress) {
		a.emitInstallProgress(progress.Step, progress.Status, progress.Message, progress.Percentage)
	})

	return inst.UpdateClaudeCode()
}

// OpenTerminal opens a new PowerShell window (or platform-appropriate terminal).
func (a *App) OpenTerminal() error {
	var cmd *exec.Cmd

	switch goruntime.GOOS {
	case "windows":
		// Try Windows Terminal first, fall back to PowerShell
		wtPath, err := exec.LookPath("wt")
		if err == nil {
			cmd = exec.Command(wtPath)
		} else {
			cmd = exec.Command("powershell", "-NoExit", "-Command",
				"Write-Host 'Claude Code is ready! Type: claude' -ForegroundColor Cyan")
		}
	case "darwin":
		cmd = exec.Command("open", "-a", "Terminal")
	default:
		// Linux: try common terminal emulators
		terminals := []string{"gnome-terminal", "konsole", "xterm", "x-terminal-emulator"}
		for _, term := range terminals {
			if _, err := exec.LookPath(term); err == nil {
				cmd = exec.Command(term)
				break
			}
		}
		if cmd == nil {
			return fmt.Errorf("no terminal emulator found")
		}
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to open terminal: %w", err)
	}

	// Reap the child process in a background goroutine to prevent resource leaks
	go cmd.Wait()

	return nil
}

// OpenURL opens the specified URL in the default web browser.
// Only HTTPS URLs to allowlisted domains are permitted.
func (a *App) OpenURL(urlStr string) error {
	parsedURL, err := neturl.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}

	if parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTPS URLs are allowed")
	}

	allowedDomains := []string{
		"docs.anthropic.com",
		"console.anthropic.com",
		"github.com",
		"anthropic.com",
		"www.anthropic.com",
	}

	host := parsedURL.Hostname()
	allowed := false
	for _, domain := range allowedDomains {
		if host == domain || strings.HasSuffix(host, "."+domain) {
			allowed = true
			break
		}
	}

	if !allowed {
		return fmt.Errorf("URL domain %q is not in the allowlist", host)
	}

	wailsRuntime.BrowserOpenURL(a.ctx, urlStr)
	return nil
}

// GetAppVersion returns the current application version.
func (a *App) GetAppVersion() string {
	return AppVersion
}

// emitInstallProgress sends an installation progress event to the frontend.
func (a *App) emitInstallProgress(step, status, message string, percentage float64) {
	wailsRuntime.EventsEmit(a.ctx, "install:progress", InstallProgress{
		Step:       step,
		Status:     status,
		Message:    message,
		Percentage: percentage,
	})
}
