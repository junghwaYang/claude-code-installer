//go:build !windows

package detector

import "os/exec"

// hideConsoleWindow is a no-op on non-Windows platforms.
func hideConsoleWindow(cmd *exec.Cmd) {
	// No-op: console window hiding is only needed on Windows
}
