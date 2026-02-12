package httputil

import (
	"net/http"
	"testing"
)

func TestNewTrustedCheckRedirect_TooManyRedirects(t *testing.T) {
	check := NewTrustedCheckRedirect(GitHubTrustedHosts())

	req, _ := http.NewRequest("GET", "https://github.com/test", nil)
	via := make([]*http.Request, MaxRedirects)
	for i := range via {
		via[i] = req
	}

	err := check(req, via)
	if err == nil {
		t.Error("expected error for too many redirects")
	}
}

func TestNewTrustedCheckRedirect_NonHTTPS(t *testing.T) {
	check := NewTrustedCheckRedirect(GitHubTrustedHosts())

	req, _ := http.NewRequest("GET", "http://github.com/test", nil)
	err := check(req, nil)
	if err == nil {
		t.Error("expected error for non-HTTPS redirect")
	}
}

func TestNewTrustedCheckRedirect_UntrustedHost(t *testing.T) {
	check := NewTrustedCheckRedirect(GitHubTrustedHosts())

	req, _ := http.NewRequest("GET", "https://evil.com/malware", nil)
	err := check(req, nil)
	if err == nil {
		t.Error("expected error for untrusted host")
	}
}

func TestNewTrustedCheckRedirect_TrustedHost(t *testing.T) {
	check := NewTrustedCheckRedirect(GitHubTrustedHosts())

	for _, host := range GitHubTrustedHosts() {
		req, _ := http.NewRequest("GET", "https://"+host+"/test", nil)
		err := check(req, nil)
		if err != nil {
			t.Errorf("unexpected error for trusted host %s: %v", host, err)
		}
	}
}
