// Package httputil provides shared HTTP security utilities for safe downloads and API requests.
package httputil

import (
	"fmt"
	"net/http"
)

const (
	// MaxRedirects is the maximum number of HTTP redirects allowed.
	MaxRedirects = 10
)

// gitHubTrustedHosts contains trusted hosts for GitHub API and download requests.
var gitHubTrustedHosts = []string{
	"github.com",
	"api.github.com",
	"objects.githubusercontent.com",
}

// allTrustedHosts contains all trusted hosts including Node.js CDN.
var allTrustedHosts = []string{
	"github.com",
	"api.github.com",
	"objects.githubusercontent.com",
	"nodejs.org",
	"cdn.nodejs.org",
}

// GitHubTrustedHosts returns a copy of the trusted hosts for GitHub API and download requests.
func GitHubTrustedHosts() []string {
	result := make([]string, len(gitHubTrustedHosts))
	copy(result, gitHubTrustedHosts)
	return result
}

// AllTrustedHosts returns a copy of all trusted hosts including Node.js CDN.
func AllTrustedHosts() []string {
	result := make([]string, len(allTrustedHosts))
	copy(result, allTrustedHosts)
	return result
}

// NewTrustedCheckRedirect creates a CheckRedirect function that only allows HTTPS redirects to trusted hosts.
func NewTrustedCheckRedirect(trustedHosts []string) func(*http.Request, []*http.Request) error {
	return func(req *http.Request, via []*http.Request) error {
		if len(via) >= MaxRedirects {
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
