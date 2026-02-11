// Package installer provides functionality to install Node.js, Git, and Claude Code
// on Windows systems. It supports both winget-based and direct download installation
// strategies with progress reporting.
package installer

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"
)

const (
	maxDownloadSize     = 500 * 1024 * 1024 // 500 MB
	maxTextResponseSize = 1 * 1024 * 1024   // 1 MB
	defaultMaxRetries   = 3
	maxRedirects        = 10
	downloadTimeout     = 10 * time.Minute
	apiRequestTimeout   = 30 * time.Second

	// Default installation paths for Windows
	defaultNodeJSPath = `C:\Program Files\nodejs`
	defaultGitPath    = `C:\Program Files\Git\cmd`
)

var (
	gitHubTrustedHosts = []string{
		"github.com",
		"api.github.com",
		"objects.githubusercontent.com",
	}
	allTrustedHosts = []string{
		"github.com",
		"api.github.com",
		"objects.githubusercontent.com",
		"nodejs.org",
		"cdn.nodejs.org",
	}
)

// newTrustedCheckRedirect creates a CheckRedirect function that only allows HTTPS redirects to trusted hosts.
func newTrustedCheckRedirect(trustedHosts []string) func(*http.Request, []*http.Request) error {
	return func(req *http.Request, via []*http.Request) error {
		if len(via) >= maxRedirects {
			return fmt.Errorf("too many redirects")
		}
		if req.URL.Scheme != "https" {
			return fmt.Errorf("redirect to non-HTTPS scheme: %s", req.URL.Scheme)
		}
		host := req.URL.Hostname()
		for _, trusted := range trustedHosts {
			if host == trusted {
				return nil
			}
		}
		return fmt.Errorf("redirect to untrusted host: %s", host)
	}
}

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
	mu         sync.Mutex
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
	i.mu.Lock()
	defer i.mu.Unlock()
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

// pollForCommand polls for a command to become available in PATH.
func (i *Installer) pollForCommand(cmdName string, maxAttempts int) error {
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if _, err := exec.LookPath(cmdName); err == nil {
			return nil
		}
		select {
		case <-i.ctx.Done():
			return fmt.Errorf("installation cancelled: %w", i.ctx.Err())
		case <-time.After(1 * time.Second):
		}
	}
	return nil
}

// verifyExecutable checks that an executable is accessible after installation.
func (i *Installer) verifyExecutable(name, stepName, versionFlag string, extraPaths []string) error {
	paths := []string{name}
	if runtime.GOOS == "windows" {
		paths = append(paths, extraPaths...)
	}

	for _, execPath := range paths {
		cmd := exec.CommandContext(i.ctx, execPath, versionFlag)
		hideConsoleWindow(cmd)
		if output, err := cmd.Output(); err == nil {
			version := strings.TrimSpace(string(output))
			if version == "" {
				continue // skip if version output is empty
			}
			i.emitProgress(stepName, "installing",
				fmt.Sprintf("Verified %s", version), 95)
			return nil
		}
	}

	return fmt.Errorf("%s command not found after installation (tried: %v)", name, paths)
}

// downloadFileWithRetry wraps downloadFile with exponential backoff retry logic.
func (i *Installer) downloadFileWithRetry(url, destPath, stepName string) error {
	maxRetries := defaultMaxRetries
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
			select {
			case <-time.After(backoff):
				// continue retry
			case <-i.ctx.Done():
				return fmt.Errorf("download cancelled: %w", i.ctx.Err())
			}
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
		Timeout:       downloadTimeout,
		CheckRedirect: newTrustedCheckRedirect(allTrustedHosts),
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
		if totalSize > maxDownloadSize {
			return fmt.Errorf("file too large: %d bytes exceeds limit of %d", totalSize, maxDownloadSize)
		}
		reader := &progressReader{
			reader:    resp.Body,
			totalSize: totalSize,
			onProgress: func(bytesRead int64) {
				pct := float64(bytesRead) / float64(totalSize) * 100
				i.emitProgress(stepName, "installing",
					fmt.Sprintf("Downloading... %.1f%%", pct), pct)
			},
		}
		_, err = io.Copy(out, io.LimitReader(reader, maxDownloadSize))
	} else {
		_, err = io.Copy(out, io.LimitReader(resp.Body, maxDownloadSize))
	}

	// Check copy error BEFORE close error to avoid treating a corrupted file as success
	copyErr := err
	closeErr := out.Close()
	if copyErr != nil {
		os.Remove(destPath) // clean up partial file
		return fmt.Errorf("failed to write downloaded file: %w", copyErr)
	}
	if closeErr != nil {
		os.Remove(destPath)
		return fmt.Errorf("failed to finalize downloaded file: %w", closeErr)
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

// verifyFileChecksum computes the SHA-256 hash of a file and compares it against an expected hash.
func verifyFileChecksum(filePath, expectedHash string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file for checksum verification: %w", err)
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return fmt.Errorf("failed to compute checksum: %w", err)
	}

	actualHash := hex.EncodeToString(h.Sum(nil))
	if !strings.EqualFold(actualHash, expectedHash) {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedHash, actualHash)
	}

	return nil
}

// findChecksumInSHASUMS searches a SHASUMS256.txt formatted string for a specific filename
// and returns its SHA-256 hash.
func findChecksumInSHASUMS(shasumsContent, filename string) (string, error) {
	for _, line := range strings.Split(shasumsContent, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			hash := parts[0]
			// Validate SHA-256 hash format (64 hex characters)
			if len(hash) != 64 {
				continue
			}
			validHex := true
			for _, ch := range hash {
				if !((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
					validHex = false
					break
				}
			}
			if !validHex {
				continue
			}
			name := strings.TrimPrefix(parts[1], "*")
			if name == filename {
				return hash, nil
			}
		}
	}
	return "", fmt.Errorf("checksum not found for %s", filename)
}

// fetchTextContent fetches text content from a URL with context support.
func (i *Installer) fetchTextContent(url string) (string, error) {
	req, err := http.NewRequestWithContext(i.ctx, "GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	client := &http.Client{
		Timeout:       apiRequestTimeout,
		CheckRedirect: newTrustedCheckRedirect(allTrustedHosts),
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d fetching %s", resp.StatusCode, url)
	}

	// Limit response size to 1MB to prevent abuse
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxTextResponseSize))
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	return string(body), nil
}

// isWingetAvailable checks if winget is available on the system.
func isWingetAvailable() bool {
	_, err := exec.LookPath("winget")
	return err == nil
}
