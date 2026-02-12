package installer

import "os"

func writeFileHelper(path string, content []byte) error {
	return os.WriteFile(path, content, 0600)
}
