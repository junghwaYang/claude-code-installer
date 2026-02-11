package installer

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	// claudeCodePackage is the npm package name for Claude Code.
	claudeCodePackage = "@anthropic-ai/claude-code"
)

// ClaudeCodeUpdateInfo contains information about available Claude Code updates.
type ClaudeCodeUpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
}

// InstallClaudeCode installs the Claude Code CLI via npm.
func (i *Installer) InstallClaudeCode() error {
	stepName := "claudecode"

	i.emitProgress(stepName, "installing", "Checking for existing Claude Code installation...", 0)

	// Check if already installed
	if _, err := exec.LookPath("claude"); err == nil {
		i.emitProgress(stepName, "completed", "Claude Code is already installed", 100)
		return nil
	}

	// Verify npm is available (required for installation)
	npmPath, err := i.findNpm()
	if err != nil {
		i.emitProgress(stepName, "error", "npm is not available. Please install Node.js first.", 0)
		return fmt.Errorf("npm is required to install Claude Code: %w", err)
	}

	i.emitProgress(stepName, "installing", "Installing Claude Code via npm...", 20)

	// Run npm install -g @anthropic-ai/claude-code
	_, err = i.runCommand(npmPath, "install", "-g", claudeCodePackage)
	if err != nil {
		i.emitProgress(stepName, "error", fmt.Sprintf("Failed to install Claude Code: %v", err), 0)
		return fmt.Errorf("failed to install Claude Code: %w", err)
	}

	// Poll for claude to become available (up to 20 seconds)
	for attempt := 0; attempt < 20; attempt++ {
		if _, lookErr := exec.LookPath("claude"); lookErr == nil {
			break
		}
		time.Sleep(1 * time.Second)
	}

	i.emitProgress(stepName, "installing", "Verifying Claude Code installation...", 80)

	// Verify installation
	if err := i.verifyClaudeCode(); err != nil {
		i.emitProgress(stepName, "error",
			"Claude Code was installed but verification failed. Try restarting your terminal.", 0)
		return fmt.Errorf("Claude Code installed but verification failed: %w", err)
	}

	i.emitProgress(stepName, "completed", "Claude Code installed successfully", 100)
	return nil
}

// CheckUpdate checks if a newer version of Claude Code is available.
func (i *Installer) CheckUpdate() (*ClaudeCodeUpdateInfo, error) {
	info := &ClaudeCodeUpdateInfo{}

	// Get currently installed version
	currentVersion, err := i.getInstalledClaudeVersion()
	if err != nil {
		return nil, fmt.Errorf("Claude Code is not installed: %w", err)
	}
	info.CurrentVersion = currentVersion

	// Get latest available version from npm
	npmPath, err := i.findNpm()
	if err != nil {
		return nil, fmt.Errorf("npm is not available: %w", err)
	}

	latestVersion, err := i.runCommand(npmPath, "view", claudeCodePackage, "version")
	if err != nil {
		return nil, fmt.Errorf("failed to check latest version: %w", err)
	}

	info.LatestVersion = strings.TrimSpace(latestVersion)
	info.Available = info.CurrentVersion != info.LatestVersion

	return info, nil
}

// UpdateClaudeCode updates Claude Code to the latest version via npm.
func (i *Installer) UpdateClaudeCode() error {
	stepName := "claudeCodeUpdate"

	i.emitProgress(stepName, "installing", "Updating Claude Code...", 10)

	npmPath, err := i.findNpm()
	if err != nil {
		i.emitProgress(stepName, "error", "npm is not available", 0)
		return fmt.Errorf("npm is required to update Claude Code: %w", err)
	}

	// Use npm install -g to update to latest
	_, err = i.runCommand(npmPath, "install", "-g", claudeCodePackage+"@latest")
	if err != nil {
		i.emitProgress(stepName, "error", fmt.Sprintf("Failed to update Claude Code: %v", err), 0)
		return fmt.Errorf("failed to update Claude Code: %w", err)
	}

	i.emitProgress(stepName, "installing", "Verifying update...", 80)

	// Verify the update
	if err := i.verifyClaudeCode(); err != nil {
		i.emitProgress(stepName, "error", "Update completed but verification failed", 0)
		return fmt.Errorf("update verification failed: %w", err)
	}

	i.emitProgress(stepName, "completed", "Claude Code updated successfully", 100)
	return nil
}

// getInstalledClaudeVersion returns the currently installed Claude Code version.
func (i *Installer) getInstalledClaudeVersion() (string, error) {
	claudePath, err := i.findClaude()
	if err != nil {
		return "", err
	}

	version, err := i.runCommand(claudePath, "--version")
	if err != nil {
		return "", fmt.Errorf("failed to get Claude Code version: %w", err)
	}

	return strings.TrimSpace(version), nil
}

// verifyClaudeCode checks that the claude CLI is accessible after installation.
func (i *Installer) verifyClaudeCode() error {
	claudePath, err := i.findClaude()
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(i.ctx, claudePath, "--version")
	hideConsoleWindow(cmd)
	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("claude command failed: %w", err)
	}

	version := strings.TrimSpace(string(output))
	i.emitProgress("claudecode", "installing",
		fmt.Sprintf("Verified Claude Code %s", version), 95)

	return nil
}

// findNpm locates the npm executable.
func (i *Installer) findNpm() (string, error) {
	npmPath, err := exec.LookPath("npm")
	if err == nil {
		return npmPath, nil
	}

	if runtime.GOOS == "windows" {
		// Check common Node.js installation directories
		commonPaths := []string{
			`C:\Program Files\nodejs\npm.cmd`,
			`C:\Program Files (x86)\nodejs\npm.cmd`,
		}
		for _, p := range commonPaths {
			if _, statErr := exec.LookPath(p); statErr == nil {
				return p, nil
			}
		}
	}

	return "", fmt.Errorf("npm not found in PATH")
}

// findClaude locates the claude executable.
func (i *Installer) findClaude() (string, error) {
	claudePath, err := exec.LookPath("claude")
	if err == nil {
		return claudePath, nil
	}

	if runtime.GOOS == "windows" {
		// Check npm global bin directories
		commonPaths := []string{
			`claude.cmd`,
			`claude.ps1`,
		}

		// Try with APPDATA npm prefix
		for _, p := range commonPaths {
			fullPath := fmt.Sprintf(`%s\npm\%s`, getAppDataPath(), p)
			if _, statErr := exec.LookPath(fullPath); statErr == nil {
				return fullPath, nil
			}
		}
	}

	return "", fmt.Errorf("claude not found in PATH")
}

// getAppDataPath returns the APPDATA directory path.
func getAppDataPath() string {
	appdata := os.Getenv("APPDATA")
	if appdata != "" {
		return appdata
	}

	// Fallback: derive from user home directory
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join("C:\\Users\\Default", "AppData", "Roaming")
	}
	return filepath.Join(home, "AppData", "Roaming")
}
