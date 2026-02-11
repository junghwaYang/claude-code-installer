package detector

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
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

// commonNodePaths lists common Node.js installation directories on Windows.
var commonNodePaths = []string{
	`C:\Program Files\nodejs`,
	`C:\Program Files (x86)\nodejs`,
}

// commonGitPaths lists common Git installation directories on Windows.
var commonGitPaths = []string{
	`C:\Program Files\Git\cmd`,
	`C:\Program Files (x86)\Git\cmd`,
	`C:\Program Files\Git\bin`,
}

// commonNpmPaths lists common npm global installation directories on Windows.
var commonNpmPaths = []string{
	filepath.Join(os.Getenv("APPDATA"), "npm"),
}

// CheckNodeJS detects whether Node.js is installed and returns its status.
func CheckNodeJS() SoftwareStatus {
	status := SoftwareStatus{
		Name:     "Node.js",
		Required: true,
	}

	// Try exec.LookPath first (searches system PATH)
	nodePath, err := exec.LookPath("node")
	if err != nil && runtime.GOOS == "windows" {
		// Fallback: check common installation directories
		nodePath = findExecutableInPaths("node.exe", commonNodePaths)
	}

	if nodePath == "" && err != nil {
		return status
	}

	cmdPath := "node"
	if nodePath != "" {
		cmdPath = nodePath
	}

	version, err := runCommand(cmdPath, "--version")
	if err != nil {
		return status
	}

	status.Installed = true
	status.Version = sanitizeVersion(version)
	return status
}

// CheckGit detects whether Git is installed and returns its status.
func CheckGit() SoftwareStatus {
	status := SoftwareStatus{
		Name:     "Git",
		Required: true,
	}

	// Try exec.LookPath first
	gitPath, err := exec.LookPath("git")
	if err != nil && runtime.GOOS == "windows" {
		// Fallback: check common installation directories
		gitPath = findExecutableInPaths("git.exe", commonGitPaths)
	}

	if gitPath == "" && err != nil {
		return status
	}

	cmdPath := "git"
	if gitPath != "" {
		cmdPath = gitPath
	}

	version, err := runCommand(cmdPath, "--version")
	if err != nil {
		return status
	}

	status.Installed = true
	// git --version outputs "git version X.Y.Z.windows.N" or "git version X.Y.Z"
	version = strings.TrimPrefix(version, "git version ")
	// Remove ".windows.N" suffix if present
	if idx := strings.Index(version, ".windows"); idx != -1 {
		version = version[:idx]
	}
	status.Version = sanitizeVersion(version)
	return status
}

// CheckClaudeCode detects whether Claude Code CLI is installed and returns its status.
func CheckClaudeCode() SoftwareStatus {
	status := SoftwareStatus{
		Name:     "Claude Code",
		Required: true,
	}

	// Try exec.LookPath first
	claudePath, err := exec.LookPath("claude")
	if err != nil && runtime.GOOS == "windows" {
		// Fallback: check npm global bin directories
		claudePath = findExecutableInPaths("claude.cmd", commonNpmPaths)
		if claudePath == "" {
			claudePath = findExecutableInPaths("claude.ps1", commonNpmPaths)
		}
	}

	if claudePath == "" && err != nil {
		return status
	}

	cmdPath := "claude"
	if claudePath != "" {
		cmdPath = claudePath
	}

	version, err := runCommand(cmdPath, "--version")
	if err != nil {
		return status
	}

	status.Installed = true
	status.Version = sanitizeVersion(version)
	return status
}

// CheckWinget checks whether the Windows Package Manager (winget) is available.
func CheckWinget() bool {
	_, err := exec.LookPath("winget")
	if err != nil {
		return false
	}

	// Verify winget actually works by running it
	_, err = runCommand("winget", "--version")
	return err == nil
}

// CheckAll performs a comprehensive check of all required software components.
func CheckAll() SystemCheckResult {
	return SystemCheckResult{
		NodeJS:          CheckNodeJS(),
		Git:             CheckGit(),
		ClaudeCode:      CheckClaudeCode(),
		WingetAvailable: CheckWinget(),
	}
}

// runCommand executes a command and returns its trimmed stdout output.
func runCommand(name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)

	// On Windows, hide the console window for background commands
	hideConsoleWindow(cmd)

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to run %s: %w", name, err)
	}

	return strings.TrimSpace(string(output)), nil
}

// findExecutableInPaths searches for an executable in a list of directories.
func findExecutableInPaths(executable string, paths []string) string {
	for _, dir := range paths {
		fullPath := filepath.Join(dir, executable)
		if _, err := os.Stat(fullPath); err == nil {
			return fullPath
		}
	}
	return ""
}

// sanitizeVersion cleans up version strings by removing common prefixes and whitespace.
func sanitizeVersion(version string) string {
	version = strings.TrimSpace(version)
	version = strings.TrimPrefix(version, "v")
	version = strings.TrimPrefix(version, "V")
	// Remove any trailing newlines or carriage returns
	version = strings.ReplaceAll(version, "\r", "")
	version = strings.ReplaceAll(version, "\n", "")
	return version
}
