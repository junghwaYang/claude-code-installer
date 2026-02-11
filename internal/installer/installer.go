// Package installer provides functionality to install Node.js, Git, and Claude Code
// on Windows systems. It supports both winget-based and direct download installation
// strategies with progress reporting.
package installer

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

// InstallProgress represents the current progress of an installation step.
type InstallProgress struct {
	Step       string  `json:"step"`
	Status     string  `json:"status"` // "pending", "installing", "completed", "error"
	Message    string  `json:"message"`
	Percentage float64 `json:"percentage"`
}

// Installer manages the installation of software components.
type Installer struct {
	ctx        context.Context
	onProgress func(InstallProgress)
}

// NewInstaller creates a new Installer instance with the given context and progress callback.
func NewInstaller(ctx context.Context, onProgress func(InstallProgress)) *Installer {
	return &Installer{
		ctx:        ctx,
		onProgress: onProgress,
	}
}

// emitProgress sends a progress update via the callback.
func (i *Installer) emitProgress(step, status, message string, percentage float64) {
	if i.onProgress != nil {
		i.onProgress(InstallProgress{
			Step:       step,
			Status:     status,
			Message:    message,
			Percentage: percentage,
		})
	}
}

// runCommand executes a command and returns its output.
func (i *Installer) runCommand(name string, args ...string) (string, error) {
	cmd := exec.CommandContext(i.ctx, name, args...)
	hideConsoleWindow(cmd)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return string(output), fmt.Errorf("command '%s %s' failed: %w\nOutput: %s",
			name, strings.Join(args, " "), err, string(output))
	}

	return strings.TrimSpace(string(output)), nil
}

// runCommandSilent executes a command without capturing output.
func (i *Installer) runCommandSilent(name string, args ...string) error {
	cmd := exec.CommandContext(i.ctx, name, args...)
	hideConsoleWindow(cmd)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("command '%s %s' failed: %w\nOutput: %s",
			name, strings.Join(args, " "), err, string(output))
	}
	return nil
}

// downloadFileWithRetry wraps downloadFile with exponential backoff retry logic.
func (i *Installer) downloadFileWithRetry(url, destPath, stepName string) error {
	maxRetries := 3
	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		lastErr = i.downloadFile(url, destPath, stepName)
		if lastErr == nil {
			return nil
		}
		if attempt < maxRetries-1 {
			backoff := time.Duration(1<<uint(attempt)) * time.Second
			i.emitProgress(stepName, "installing",
				fmt.Sprintf("Download failed, retrying in %v... (attempt %d/%d)", backoff, attempt+2, maxRetries), 0)
			time.Sleep(backoff)
		}
	}
	return fmt.Errorf("download failed after %d attempts: %w", maxRetries, lastErr)
}

// downloadFile downloads a file from the given URL to a local path with progress tracking.
func (i *Installer) downloadFile(url, destPath, stepName string) error {
	i.emitProgress(stepName, "installing", fmt.Sprintf("Downloading from %s...", url), 0)

	req, err := http.NewRequestWithContext(i.ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create download request: %w", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Minute,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download returned status %d", resp.StatusCode)
	}

	// Create destination file with restricted permissions (owner read/write only)
	out, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return fmt.Errorf("failed to create file %s: %w", destPath, err)
	}

	// Track download progress
	totalSize := resp.ContentLength
	if totalSize > 0 {
		reader := &progressReader{
			reader:    resp.Body,
			totalSize: totalSize,
			onProgress: func(bytesRead int64) {
				pct := float64(bytesRead) / float64(totalSize) * 100
				i.emitProgress(stepName, "installing",
					fmt.Sprintf("Downloading... %.1f%%", pct), pct)
			},
		}
		_, err = io.Copy(out, reader)
	} else {
		_, err = io.Copy(out, resp.Body)
	}

	// Check close error to catch write failures (e.g., disk full)
	if closeErr := out.Close(); closeErr != nil {
		return fmt.Errorf("failed to finalize downloaded file: %w", closeErr)
	}

	if err != nil {
		return fmt.Errorf("failed to write downloaded file: %w", err)
	}

	return nil
}

// getTempDir returns a unique temporary directory for downloads with restricted permissions.
// Callers are responsible for cleaning up the returned directory with os.RemoveAll.
func getTempDir() (string, error) {
	tempDir, err := os.MkdirTemp("", "claude-code-installer-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}
	return tempDir, nil
}

// progressReader wraps an io.Reader to track read progress.
type progressReader struct {
	reader     io.Reader
	totalSize  int64
	bytesRead  int64
	onProgress func(bytesRead int64)
}

func (pr *progressReader) Read(p []byte) (int, error) {
	n, err := pr.reader.Read(p)
	pr.bytesRead += int64(n)
	if pr.onProgress != nil {
		pr.onProgress(pr.bytesRead)
	}
	return n, err
}

// isWingetAvailable checks if winget is available on the system.
func isWingetAvailable() bool {
	_, err := exec.LookPath("winget")
	return err == nil
}
