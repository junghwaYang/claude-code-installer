package installer

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"claude-code-installer/internal/pathutil"
)

const (
	// nodeLTSVersion is the current Node.js LTS version to install.
	nodeLTSVersion = "22.13.1"
	// nodeDownloadBaseURL is the base URL for Node.js downloads.
	nodeDownloadBaseURL = "https://nodejs.org/dist"
	// wingetNodePackage is the winget package ID for Node.js LTS.
	wingetNodePackage = "OpenJS.NodeJS.LTS"
)

// InstallNodeJS installs Node.js using winget (preferred) or direct MSI download (fallback).
func (i *Installer) InstallNodeJS() error {
	stepName := "nodejs"

	i.emitProgress(stepName, "installing", "Checking for existing Node.js installation...", 0)

	// Check if already installed
	if _, err := exec.LookPath("node"); err == nil {
		i.emitProgress(stepName, "completed", "Node.js is already installed", 100)
		return nil
	}

	// Strategy 1: Try winget
	if isWingetAvailable() {
		i.emitProgress(stepName, "installing", "Installing Node.js via winget...", 10)

		err := i.installNodeViaWinget()
		if err == nil {
			// Refresh PATH and verify
			_ = pathutil.RefreshPath()

			if verifyErr := i.verifyNode(); verifyErr == nil {
				i.emitProgress(stepName, "completed", "Node.js installed successfully via winget", 100)
				return nil
			}
		}

		i.emitProgress(stepName, "installing", "Winget installation failed, trying direct download...", 20)
	}

	// Strategy 2: Direct MSI download
	i.emitProgress(stepName, "installing", "Downloading Node.js installer...", 25)

	err := i.installNodeViaMSI()
	if err != nil {
		i.emitProgress(stepName, "error", fmt.Sprintf("Failed to install Node.js: %v", err), 0)
		return fmt.Errorf("failed to install Node.js: %w", err)
	}

	// Refresh PATH after installation
	_ = pathutil.RefreshPath()

	// Add Node.js to PATH if not already present
	if err := pathutil.AddToPath(defaultNodeJSPath); err != nil {
		// Non-fatal: log but continue
		i.emitProgress(stepName, "installing", "Warning: could not add Node.js to PATH automatically", 90)
	}

	// Verify installation
	if err := i.verifyNode(); err != nil {
		i.emitProgress(stepName, "error", "Node.js was installed but verification failed. Please restart the application.", 0)
		return fmt.Errorf("Node.js installed but verification failed: %w", err)
	}

	i.emitProgress(stepName, "completed", "Node.js installed successfully", 100)
	return nil
}

// installNodeViaWinget installs Node.js using the Windows Package Manager.
func (i *Installer) installNodeViaWinget() error {
	_, err := i.runCommand("winget", "install",
		wingetNodePackage,
		"--silent",
		"--accept-package-agreements",
		"--accept-source-agreements",
	)
	return err
}

// installNodeViaMSI downloads and installs Node.js via MSI installer.
func (i *Installer) installNodeViaMSI() error {
	// Determine architecture
	arch := "x64"
	if runtime.GOARCH == "386" {
		arch = "x86"
	} else if runtime.GOARCH == "arm64" {
		arch = "arm64"
	}

	// Build download URL
	msiFilename := fmt.Sprintf("node-v%s-%s.msi", nodeLTSVersion, arch)
	downloadURL := fmt.Sprintf("%s/v%s/%s", nodeDownloadBaseURL, nodeLTSVersion, msiFilename)

	// Create temp directory for download (unique per call, caller must clean up)
	tempDir, err := getTempDir()
	if err != nil {
		return err
	}
	defer os.RemoveAll(tempDir)

	msiPath := filepath.Join(tempDir, msiFilename)

	// Download the MSI with retry logic
	if err := i.downloadFileWithRetry(downloadURL, msiPath, "nodejs"); err != nil {
		return fmt.Errorf("failed to download Node.js installer: %w", err)
	}

	// Verify download integrity via SHA-256 checksum (mandatory)
	i.emitProgress("nodejs", "installing", "Verifying download integrity...", 55)
	shasumsURL := fmt.Sprintf("%s/v%s/SHASUMS256.txt", nodeDownloadBaseURL, nodeLTSVersion)
	shasumsContent, err := i.fetchTextContent(shasumsURL)
	if err != nil {
		return fmt.Errorf("failed to verify Node.js download integrity (could not fetch checksums): %w", err)
	}
	expectedHash, err := findChecksumInSHASUMS(shasumsContent, msiFilename)
	if err != nil {
		return fmt.Errorf("failed to verify Node.js download integrity (checksum not found for %s): %w", msiFilename, err)
	}
	if err := verifyFileChecksum(msiPath, expectedHash); err != nil {
		return fmt.Errorf("Node.js installer integrity check failed: %w", err)
	}
	i.emitProgress("nodejs", "installing", "Download integrity verified", 65)

	i.emitProgress("nodejs", "installing", "Running Node.js installer...", 70)

	// Run msiexec with quiet install
	_, err = i.runCommand("msiexec", "/qn", "/i", msiPath,
		"ADDLOCAL=ALL",
	)
	if err != nil {
		return fmt.Errorf("msiexec failed: %w", err)
	}

	// Poll for node to become available (up to 30 seconds)
	return i.pollForCommand("node", 30)
}

// verifyNode checks that node is accessible after installation.
func (i *Installer) verifyNode() error {
	return i.verifyExecutable("node", "nodejs", "--version", []string{
		`C:\Program Files\nodejs\node.exe`,
		`C:\Program Files (x86)\nodejs\node.exe`,
	})
}
