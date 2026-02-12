package installer

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestFindChecksumInSHASUMS(t *testing.T) {
	shasumsContent := `aabbccdd11223344556677889900aabbccddeeff00112233445566778899aabb node-v22.13.1-x64.msi
1122334455667788aabbccddee00112233445566778899aabbccddeeff00aabb node-v22.13.1-arm64.msi
ffeeddccbbaa998877665544332211ffeeddccbbaa99887766554433221100ab node-v22.13.1-x86.msi`

	tests := []struct {
		name        string
		filename    string
		expectHash  string
		expectError bool
	}{
		{
			name:       "find x64 MSI",
			filename:   "node-v22.13.1-x64.msi",
			expectHash: "aabbccdd11223344556677889900aabbccddeeff00112233445566778899aabb",
		},
		{
			name:       "find arm64 MSI",
			filename:   "node-v22.13.1-arm64.msi",
			expectHash: "1122334455667788aabbccddee00112233445566778899aabbccddeeff00aabb",
		},
		{
			name:        "file not found",
			filename:    "node-v22.13.1-nonexistent.msi",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := findChecksumInSHASUMS(shasumsContent, tt.filename)
			if tt.expectError {
				if err == nil {
					t.Errorf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if hash != tt.expectHash {
				t.Errorf("got hash %q, want %q", hash, tt.expectHash)
			}
		})
	}
}

func TestFindChecksumInSHASUMS_InvalidHash(t *testing.T) {
	// Hash too short (not 64 chars)
	content := `short myfile.msi`
	_, err := findChecksumInSHASUMS(content, "myfile.msi")
	if err == nil {
		t.Error("expected error for invalid hash length, got nil")
	}
}

func TestFindChecksumInSHASUMS_EmptyContent(t *testing.T) {
	_, err := findChecksumInSHASUMS("", "myfile.msi")
	if err == nil {
		t.Error("expected error for empty content, got nil")
	}
}

func TestFindChecksumInSHASUMS_StarPrefix(t *testing.T) {
	// Some SHASUMS files use "*filename" format
	content := `aabbccdd11223344556677889900aabbccddeeff00112233445566778899aabb *node-v22.13.1-x64.msi`
	hash, err := findChecksumInSHASUMS(content, "node-v22.13.1-x64.msi")
	if err != nil {
		t.Errorf("unexpected error: %v", err)
		return
	}
	if hash != "aabbccdd11223344556677889900aabbccddeeff00112233445566778899aabb" {
		t.Errorf("unexpected hash: %s", hash)
	}
}

func TestVerifyFileChecksum(t *testing.T) {
	// Create a temp file with known content
	tmpDir := t.TempDir()
	tmpFile := tmpDir + "/testfile.txt"

	// Write known content
	content := []byte("hello world")
	if err := writeTestFile(tmpFile, content); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// SHA-256 of "hello world"
	expectedHash := "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

	t.Run("valid checksum", func(t *testing.T) {
		err := verifyFileChecksum(tmpFile, expectedHash)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	t.Run("invalid checksum", func(t *testing.T) {
		err := verifyFileChecksum(tmpFile, "0000000000000000000000000000000000000000000000000000000000000000")
		if err == nil {
			t.Error("expected error for mismatched checksum")
		}
	})

	t.Run("case insensitive", func(t *testing.T) {
		upperHash := "B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9"
		err := verifyFileChecksum(tmpFile, upperHash)
		if err != nil {
			t.Errorf("unexpected error for uppercase hash: %v", err)
		}
	})

	t.Run("nonexistent file", func(t *testing.T) {
		err := verifyFileChecksum("/nonexistent/file.txt", expectedHash)
		if err == nil {
			t.Error("expected error for nonexistent file")
		}
	})
}

func writeTestFile(path string, content []byte) error {
	return writeFileHelper(path, content)
}

func TestPollForCommand_CommandNotFound(t *testing.T) {
	// Create installer with background context
	ctx := context.Background()
	installer := NewInstaller(ctx, nil)

	// Use a command name that definitely doesn't exist
	nonExistentCommand := "this-command-absolutely-does-not-exist-12345"
	maxAttempts := 3

	// Poll for the non-existent command
	err := installer.pollForCommand(nonExistentCommand, maxAttempts)

	// Verify that an error is returned (not nil)
	if err == nil {
		t.Error("expected error when command is not found after polling, got nil")
		return
	}

	// Verify the error message contains expected information
	errMsg := err.Error()
	if !strings.Contains(errMsg, nonExistentCommand) {
		t.Errorf("error message should contain command name %q, got: %s", nonExistentCommand, errMsg)
	}
	if !strings.Contains(errMsg, "not found in PATH") {
		t.Errorf("error message should contain 'not found in PATH', got: %s", errMsg)
	}
}

func TestPollForCommand_ContextCancelled(t *testing.T) {
	// Create installer with cancellable context
	ctx, cancel := context.WithCancel(context.Background())
	installer := NewInstaller(ctx, nil)

	// Cancel context immediately
	cancel()

	// Use a command name that doesn't exist
	nonExistentCommand := "nonexistent-command-67890"
	maxAttempts := 10

	// Poll for command with cancelled context
	err := installer.pollForCommand(nonExistentCommand, maxAttempts)

	// Verify that an error is returned
	if err == nil {
		t.Error("expected error when context is cancelled, got nil")
		return
	}

	// Verify the error is related to cancellation
	errMsg := err.Error()
	if !strings.Contains(errMsg, "cancelled") {
		t.Errorf("error message should indicate cancellation, got: %s", errMsg)
	}
}

func TestPollForCommand_ContextTimeout(t *testing.T) {
	// Create installer with timeout context (very short timeout)
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	installer := NewInstaller(ctx, nil)

	// Use a command that doesn't exist and many attempts
	// The context should timeout before all attempts complete
	nonExistentCommand := "timeout-test-command"
	maxAttempts := 100 // Would take 100 seconds without timeout

	// Poll for command
	err := installer.pollForCommand(nonExistentCommand, maxAttempts)

	// Verify that an error is returned
	if err == nil {
		t.Error("expected error when context times out, got nil")
		return
	}

	// Verify the error is related to timeout/cancellation
	errMsg := err.Error()
	if !strings.Contains(errMsg, "cancelled") && !strings.Contains(errMsg, "deadline") {
		t.Errorf("error message should indicate timeout/cancellation, got: %s", errMsg)
	}
}
