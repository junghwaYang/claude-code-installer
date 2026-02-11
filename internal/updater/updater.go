package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	// githubRepoOwner is the GitHub repository owner for the installer.
	githubRepoOwner = "anthropics"
	// githubRepoName is the GitHub repository name for the installer.
	githubRepoName = "claude-code-installer"
	// githubAPIBaseURL is the base URL for GitHub API requests.
	githubAPIBaseURL = "https://api.github.com"
	// updateCheckTimeout is the timeout for update check HTTP requests.
	updateCheckTimeout = 15 * time.Second
	// maxRedirects is the maximum number of HTTP redirects allowed.
	maxRedirects = 10
)

// UpdateInfo contains information about available updates.
type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	DownloadURL    string `json:"downloadURL,omitempty"`
}

// GitHubRelease represents a GitHub release response.
type GitHubRelease struct {
	TagName    string         `json:"tag_name"`
	Name       string         `json:"name"`
	Draft      bool           `json:"draft"`
	Prerelease bool           `json:"prerelease"`
	Assets     []GitHubAsset  `json:"assets"`
	HTMLURL    string         `json:"html_url"`
}

// GitHubAsset represents an asset attached to a GitHub release.
type GitHubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	ContentType        string `json:"content_type"`
	Size               int64  `json:"size"`
}

// UpdateChecker handles checking for application updates.
type UpdateChecker struct {
	ctx        context.Context
	httpClient *http.Client
}

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

// NewUpdateChecker creates a new UpdateChecker instance with context support.
func NewUpdateChecker(ctx context.Context) *UpdateChecker {
	return &UpdateChecker{
		ctx: ctx,
		httpClient: &http.Client{
			Timeout: updateCheckTimeout,
			CheckRedirect: newTrustedCheckRedirect([]string{
				"github.com",
				"api.github.com",
				"objects.githubusercontent.com",
			}),
		},
	}
}

// CheckForUpdate checks if a newer version of the application is available.
func (uc *UpdateChecker) CheckForUpdate(currentVersion string) (*UpdateInfo, error) {
	latestVersion, downloadURL, err := uc.GetLatestRelease()
	if err != nil {
		return nil, fmt.Errorf("failed to check for updates: %w", err)
	}

	currentClean := cleanVersion(currentVersion)
	latestClean := cleanVersion(latestVersion)

	info := &UpdateInfo{
		CurrentVersion: currentClean,
		LatestVersion:  latestClean,
		Available:      compareVersions(currentClean, latestClean) < 0,
		DownloadURL:    downloadURL,
	}

	return info, nil
}

// GetLatestRelease fetches the latest release information from GitHub.
// Returns the version string and download URL for the Windows installer asset.
func (uc *UpdateChecker) GetLatestRelease() (string, string, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/releases/latest",
		githubAPIBaseURL, githubRepoOwner, githubRepoName)

	req, err := http.NewRequestWithContext(uc.ctx, "GET", url, nil)
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "claude-code-installer")

	resp, err := uc.httpClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to fetch latest release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", "", fmt.Errorf("failed to parse release response: %w", err)
	}

	version := cleanVersion(release.TagName)

	// Find Windows installer asset
	downloadURL := release.HTMLURL
	for _, asset := range release.Assets {
		name := strings.ToLower(asset.Name)
		if strings.Contains(name, "windows") || strings.HasSuffix(name, ".exe") || strings.HasSuffix(name, ".msi") {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}

	return version, downloadURL, nil
}

// cleanVersion removes common prefixes from version strings.
func cleanVersion(version string) string {
	version = strings.TrimSpace(version)
	version = strings.TrimPrefix(version, "v")
	version = strings.TrimPrefix(version, "V")
	return version
}

// compareVersions compares two semantic version strings.
// Returns -1 if a < b, 0 if a == b, 1 if a > b.
func compareVersions(a, b string) int {
	aParts := parseVersionParts(a)
	bParts := parseVersionParts(b)

	// Compare up to the length of the longer version
	maxLen := len(aParts)
	if len(bParts) > maxLen {
		maxLen = len(bParts)
	}

	for i := 0; i < maxLen; i++ {
		aVal := 0
		bVal := 0
		if i < len(aParts) {
			aVal = aParts[i]
		}
		if i < len(bParts) {
			bVal = bParts[i]
		}

		if aVal < bVal {
			return -1
		}
		if aVal > bVal {
			return 1
		}
	}

	return 0
}

// parseVersionParts splits a version string into integer parts.
func parseVersionParts(version string) []int {
	parts := strings.Split(version, ".")
	result := make([]int, 0, len(parts))

	for _, part := range parts {
		val := 0
		for _, ch := range part {
			if ch >= '0' && ch <= '9' {
				newVal := val*10 + int(ch-'0')
				if newVal < val {
					// overflow, cap at current value
					break
				}
				val = newVal
			} else {
				break
			}
		}
		result = append(result, val)
	}

	return result
}
