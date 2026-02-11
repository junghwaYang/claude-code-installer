//go:build !windows

package pathutil

import (
	"fmt"
	"os"
	"strings"
)

// GetUserPath reads the PATH environment variable on non-Windows platforms.
func GetUserPath() (string, error) {
	return os.Getenv("PATH"), nil
}

// AddToPath is a no-op on non-Windows platforms.
// PATH management via registry is Windows-specific.
func AddToPath(dir string) error {
	return fmt.Errorf("AddToPath is only supported on Windows")
}

// BroadcastSettingChange is a no-op on non-Windows platforms.
func BroadcastSettingChange() error {
	return nil
}

// RefreshPath is a no-op on non-Windows platforms.
func RefreshPath() error {
	return nil
}

// pathContains checks if a directory is already present in a PATH string.
func pathContains(pathEnv, dir string) bool {
	dir = strings.TrimRight(dir, `/\`)
	sep := ":"
	entries := strings.Split(pathEnv, sep)
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		entry = strings.TrimRight(entry, `/\`)
		if entry == dir {
			return true
		}
	}
	return false
}
