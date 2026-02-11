//go:build windows

package pathutil

import (
	"fmt"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows/registry"
)

const (
	// registryKeyPath is the registry path for user environment variables.
	registryKeyPath = `Environment`
	// hwndBroadcast is the HWND_BROADCAST constant for SendMessageTimeout.
	hwndBroadcast = 0xFFFF
	// wmSettingChange is the WM_SETTINGCHANGE message constant.
	wmSettingChange = 0x001A
	// smtoAbortIfHung is the SMTO_ABORTIFHUNG flag for SendMessageTimeout.
	smtoAbortIfHung = 0x0002
	// sendMessageTimeoutMs is the timeout for SendMessageTimeout in milliseconds.
	sendMessageTimeoutMs = 5000
)

// GetUserPath reads the user-level PATH from the Windows registry.
func GetUserPath() (string, error) {
	key, err := registry.OpenKey(registry.CURRENT_USER, registryKeyPath, registry.QUERY_VALUE)
	if err != nil {
		return "", fmt.Errorf("failed to open registry key: %w", err)
	}
	defer key.Close()

	path, _, err := key.GetStringValue("Path")
	if err != nil {
		// If the Path value doesn't exist, return empty string (not an error)
		if err == registry.ErrNotExist {
			return "", nil
		}
		return "", fmt.Errorf("failed to read Path value: %w", err)
	}

	return path, nil
}

// AddToPath adds a directory to the user-level PATH if it's not already present.
// It modifies the registry and broadcasts a WM_SETTINGCHANGE message to notify
// other processes of the environment change.
func AddToPath(dir string) error {
	currentPath, err := GetUserPath()
	if err != nil {
		return fmt.Errorf("failed to get current PATH: %w", err)
	}

	// Check if directory is already in PATH
	if pathContains(currentPath, dir) {
		return nil // Already present, nothing to do
	}

	// Build the new PATH value
	var newPath string
	if currentPath == "" {
		newPath = dir
	} else {
		newPath = currentPath + ";" + dir
	}

	// Write the new PATH to the registry
	key, err := registry.OpenKey(registry.CURRENT_USER, registryKeyPath, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("failed to open registry key for writing: %w", err)
	}
	defer key.Close()

	// Use REG_EXPAND_SZ to support environment variable references in PATH
	err = key.SetExpandStringValue("Path", newPath)
	if err != nil {
		return fmt.Errorf("failed to write Path value: %w", err)
	}

	// Broadcast the change to all windows
	return BroadcastSettingChange()
}

// BroadcastSettingChange sends a WM_SETTINGCHANGE message to all top-level windows
// to notify them that environment variables have changed. This causes Explorer and
// other applications to reload their environment.
func BroadcastSettingChange() error {
	user32 := syscall.NewLazyDLL("user32.dll")
	sendMessageTimeout := user32.NewProc("SendMessageTimeoutW")

	envStr, err := syscall.UTF16PtrFromString("Environment")
	if err != nil {
		return fmt.Errorf("failed to convert string: %w", err)
	}

	ret, _, callErr := sendMessageTimeout.Call(
		uintptr(hwndBroadcast),
		uintptr(wmSettingChange),
		0,
		uintptr(unsafe.Pointer(envStr)),
		uintptr(smtoAbortIfHung),
		uintptr(sendMessageTimeoutMs),
		0,
	)

	// SendMessageTimeout returns 0 on failure
	if ret == 0 {
		return fmt.Errorf("SendMessageTimeout failed: %v", callErr)
	}

	return nil
}

// RefreshPath updates the PATH environment variable in the current process
// by reading the latest value from the registry and combining it with the
// system PATH.
func RefreshPath() error {
	userPath, err := GetUserPath()
	if err != nil {
		return fmt.Errorf("failed to get user PATH: %w", err)
	}

	// Read system PATH from registry
	systemKey, err := registry.OpenKey(
		registry.LOCAL_MACHINE,
		`SYSTEM\CurrentControlSet\Control\Session Manager\Environment`,
		registry.QUERY_VALUE,
	)
	if err != nil {
		return fmt.Errorf("failed to open system registry key: %w", err)
	}
	defer systemKey.Close()

	systemPath, _, err := systemKey.GetStringValue("Path")
	if err != nil {
		return fmt.Errorf("failed to read system Path: %w", err)
	}

	// Combine system and user PATH
	combinedPath := systemPath
	if userPath != "" {
		combinedPath = systemPath + ";" + userPath
	}

	// Set the combined PATH in the current process environment
	return syscall.Setenv("PATH", combinedPath)
}

// pathContains checks if a directory is already present in a PATH string.
// The comparison is case-insensitive on Windows.
func pathContains(pathEnv, dir string) bool {
	dir = strings.TrimRight(dir, `\/`)
	entries := strings.Split(pathEnv, ";")
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		entry = strings.TrimRight(entry, `\/`)
		if strings.EqualFold(entry, dir) {
			return true
		}
	}
	return false
}
