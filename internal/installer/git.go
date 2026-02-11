package installer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"claude-code-installer/internal/pathutil"
)

const (
	// wingetGitPackage is the winget package ID for Git.
	wingetGitPackage = "Git.Git"
	// gitReleasesAPIURL is the GitHub API URL for Git for Windows releases.
	gitReleasesAPIURL = "https://api.github.com/repos/git-for-windows/git/releases/latest"
)

// gitReleaseAsset represents a GitHub release asset.
type gitReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}

// gitRelease represents a GitHub release.
type gitRelease struct {
	TagName string            `json:"tag_name"`
	Assets  []gitReleaseAsset `json:"assets"`
}

// InstallGit installs Git using winget (preferred) or direct download (fallback).
func (i *Installer) InstallGit() error {
	stepName := "git"

	i.emitProgress(stepName, "installing", "Checking for existing Git installation...", 0)

	// Check if already installed
	if _, err := exec.LookPath("git"); err == nil {
		i.emitProgress(stepName, "completed", "Git is already installed", 100)
		return nil
	}

	// Strategy 1: Try winget
	if isWingetAvailable() {
		i.emitProgress(stepName, "installing", "Installing Git via winget...", 10)

		err := i.installGitViaWinget()
		if err == nil {
			// Refresh PATH and verify
			_ = pathutil.RefreshPath()

			if verifyErr := i.verifyGit(); verifyErr == nil {
				i.emitProgress(stepName, "completed", "Git installed successfully via winget", 100)
				return nil
			}
		}

		i.emitProgress(stepName, "installing", "Winget installation failed, trying direct download...", 20)
	}

	// Strategy 2: Direct download from GitHub
	i.emitProgress(stepName, "installing", "Downloading Git installer...", 25)

	err := i.installGitViaDownload()
	if err != nil {
		i.emitProgress(stepName, "error", fmt.Sprintf("Failed to install Git: %v", err), 0)
		return fmt.Errorf("failed to install Git: %w", err)
	}

	// Refresh PATH after installation
	_ = pathutil.RefreshPath()

	// Add Git to PATH if not already present
	gitPath := `C:\Program Files\Git\cmd`
	if err := pathutil.AddToPath(gitPath); err != nil {
		i.emitProgress(stepName, "installing", "Warning: could not add Git to PATH automatically", 90)
	}

	// Verify installation
	if err := i.verifyGit(); err != nil {
		i.emitProgress(stepName, "error", "Git was installed but verification failed. Please restart the application.", 0)
		return fmt.Errorf("Git installed but verification failed: %w", err)
	}

	i.emitProgress(stepName, "completed", "Git installed successfully", 100)
	return nil
}

// installGitViaWinget installs Git using the Windows Package Manager.
func (i *Installer) installGitViaWinget() error {
	_, err := i.runCommand("winget", "install",
		wingetGitPackage,
		"--silent",
		"--accept-package-agreements",
		"--accept-source-agreements",
	)
	return err
}

// installGitViaDownload downloads and installs Git from GitHub releases.
func (i *Installer) installGitViaDownload() error {
	// Fetch latest release info from GitHub
	downloadURL, err := i.getGitDownloadURL()
	if err != nil {
		return fmt.Errorf("failed to get Git download URL: %w", err)
	}

	// Create temp directory for download
	tempDir, err := getTempDir()
	if err != nil {
		return err
	}

	installerPath := filepath.Join(tempDir, "Git-installer.exe")
	defer os.Remove(installerPath)

	// Download the installer
	if err := i.downloadFile(downloadURL, installerPath, "git"); err != nil {
		return fmt.Errorf("failed to download Git installer: %w", err)
	}

	i.emitProgress("git", "installing", "Running Git installer...", 70)

	// Run the installer with silent options
	// /VERYSILENT - no UI at all
	// /NORESTART - don't restart the system
	// /SP- - suppress "This will install..." prompt
	// /CLOSEAPPLICATIONS - close running applications if needed
	// /NOCANCEL - remove cancel button
	_, err = i.runCommand(installerPath,
		"/VERYSILENT",
		"/NORESTART",
		"/SP-",
		"/CLOSEAPPLICATIONS",
		"/NOCANCEL",
	)
	if err != nil {
		return fmt.Errorf("Git installer failed: %w", err)
	}

	// Wait for installation to complete
	time.Sleep(3 * time.Second)

	return nil
}

// getGitDownloadURL fetches the latest Git for Windows download URL from GitHub.
func (i *Installer) getGitDownloadURL() (string, error) {
	req, err := http.NewRequestWithContext(i.ctx, "GET", gitReleasesAPIURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "claude-code-installer")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch Git releases: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release gitRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", fmt.Errorf("failed to parse release info: %w", err)
	}

	// Find the appropriate installer asset
	arch := "64-bit"
	if runtime.GOARCH == "386" {
		arch = "32-bit"
	}

	for _, asset := range release.Assets {
		name := strings.ToLower(asset.Name)
		// Look for the standalone installer (not portable, not mingit)
		if strings.Contains(name, arch) &&
			strings.HasSuffix(name, ".exe") &&
			!strings.Contains(name, "portable") &&
			!strings.Contains(name, "mingit") {
			return asset.BrowserDownloadURL, nil
		}
	}

	// Fallback: any exe installer
	for _, asset := range release.Assets {
		name := strings.ToLower(asset.Name)
		if strings.HasSuffix(name, ".exe") &&
			!strings.Contains(name, "portable") &&
			!strings.Contains(name, "mingit") {
			return asset.BrowserDownloadURL, nil
		}
	}

	return "", fmt.Errorf("could not find Git installer in latest release")
}

// verifyGit checks that git is accessible after installation.
func (i *Installer) verifyGit() error {
	paths := []string{"git"}
	if runtime.GOOS == "windows" {
		paths = append(paths,
			`C:\Program Files\Git\cmd\git.exe`,
			`C:\Program Files (x86)\Git\cmd\git.exe`,
			`C:\Program Files\Git\bin\git.exe`,
		)
	}

	for _, gitPath := range paths {
		cmd := exec.CommandContext(i.ctx, gitPath, "--version")
		hideConsoleWindow(cmd)
		if output, err := cmd.Output(); err == nil {
			version := string(output)
			i.emitProgress("git", "installing",
				fmt.Sprintf("Verified %s", strings.TrimSpace(version)), 95)
			return nil
		}
	}

	return fmt.Errorf("git command not found after installation")
}
