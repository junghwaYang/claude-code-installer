package detector

import (
	"testing"
)

func TestSanitizeVersion(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"v1.0.0", "1.0.0"},
		{"V2.3.4", "2.3.4"},
		{"1.0.0", "1.0.0"},
		{"  v1.0.0  ", "1.0.0"},
		{"v1.0.0\r\n", "1.0.0"},
		{"1.0.0\n", "1.0.0"},
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := sanitizeVersion(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeVersion(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
