// Package pathutil provides Windows PATH environment variable management utilities.
// It handles reading and modifying the user-level PATH via the Windows registry
// and broadcasting environment change notifications.
package pathutil

// PathContains checks if a directory is already present in a PATH string.
func PathContains(pathEnv, dir string) bool {
	return pathContains(pathEnv, dir)
}
