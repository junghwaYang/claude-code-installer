# ⚡ Claude Code Windows Installer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)

A beautiful, one-click installer for Claude Code on Windows. No command-line knowledge required.

![Screenshot](docs/screenshot.png)

## Features

- **Zero Configuration** - Downloads and installs everything automatically
- **Modern UI** - Beautiful dark-themed interface built with React and Tailwind CSS
- **Complete Setup** - Installs Node.js LTS, Git, and Claude Code in one go
- **Smart Detection** - Automatically detects existing installations
- **Progress Tracking** - Real-time progress updates for each installation step
- **Login Guidance** - Step-by-step instructions to authenticate with Claude
- **No Admin Hassle** - Requests elevation only when needed
- **Offline Ready** - Embedded dependencies for reliable installation

## Quick Start

1. **Download** the latest `claude-code-installer.exe` from [Releases](https://github.com/yourusername/claude-code-installer/releases)
2. **Run** the installer (double-click)
3. **Done!** Claude Code is ready to use

No terminal commands, no configuration files, no hassle.

## What Gets Installed

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | LTS (20.x) | Required for Claude Code |
| **Git** | Latest | Version control integration |
| **Claude Code** | Latest | Anthropic's AI coding assistant CLI |

All installations are performed to standard Windows locations with proper PATH configuration.

## Installation Flow

```
┌─────────────────┐
│  System Check   │ ← Detect existing installations
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Install Node   │ ← Download & install Node.js LTS
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Install Git   │ ← Download & install Git for Windows
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Install Claude  │ ← npm install -g claude-code
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Login Guide    │ ← Step-by-step authentication
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Complete!    │ ← Ready to code with Claude
└─────────────────┘
```

## Building from Source

### Prerequisites

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Wails CLI** - Install with: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Build Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-code-installer.git
cd claude-code-installer

# Install frontend dependencies
cd frontend
npm install
cd ..

# Build the application
wails build -clean -webview2 embed

# Output: build/bin/claude-code-installer.exe
```

### Development Mode

```bash
# Run with live reload
wails dev
```

## Architecture

```
claude-code-installer/
├── frontend/          # React + TypeScript + Tailwind UI
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # Global styles
│   └── package.json
├── internal/          # Go backend logic
│   ├── detector/      # System detection
│   ├── installer/     # Installation logic
│   ├── pathutil/      # Path management
│   └── updater/       # Update checks
├── build/             # Build artifacts
│   └── windows/       # Windows-specific resources
├── main.go            # Application entry point
└── app.go             # Wails application logic
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow Go and TypeScript best practices
2. Maintain the existing code style
3. Add tests for new features
4. Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **[Claude Code](https://docs.anthropic.com/claude/docs/claude-code)** - Anthropic's AI coding assistant
- **[Wails](https://wails.io/)** - Go + Web UI framework
- **[React](https://reactjs.org/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

## Links

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Wails Documentation](https://wails.io/docs/introduction)
- [Report Issues](https://github.com/yourusername/claude-code-installer/issues)
- [Request Features](https://github.com/yourusername/claude-code-installer/issues/new?labels=enhancement)

---

Made with ❤️ for the Claude Code community
