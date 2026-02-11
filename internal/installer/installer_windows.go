//go:build windows

package installer

import (
	"os/exec"
	"syscall"
)

// hideConsoleWindow sets the SysProcAttr to hide the console window on Windows.
func hideConsoleWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}
}
