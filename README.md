# Claude Code Windows Installer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Wails](https://img.shields.io/badge/Wails-v2.11-red.svg)](https://wails.io/)

**Windows에서 Claude Code를 버튼 하나로 설치하세요.**

One-click installer for Claude Code on Windows. No command-line knowledge required.

---

## 한국어

### 소개

Windows 사용자를 위한 Claude Code 원클릭 설치 프로그램입니다.
Node.js, Git, Claude Code를 한 번에 자동으로 설치합니다. 터미널 지식이 없어도 됩니다.

### 주요 기능

- **원클릭 설치** - 다운로드 받고 실행하면 끝
- **자동 감지** - 이미 설치된 도구는 자동으로 건너뜀
- **이중 설치 전략** - winget 우선, 직접 다운로드 fallback
- **실시간 진행률** - 각 단계별 설치 상태를 실시간으로 표시
- **한국어/영어** - 버튼 하나로 언어 전환
- **로그인 가이드** - Claude Code 인증 방법을 단계별로 안내
- **다크 테마 UI** - React + Tailwind CSS로 만든 깔끔한 인터페이스

### 사용 방법

1. [Releases](https://github.com/junghwaYang/claude-code-installer/releases) 에서 `claude-code-installer.exe` 다운로드
2. 실행 (더블클릭)
3. "설치 시작" 버튼 클릭
4. 완료! 터미널에서 `claude` 입력하여 사용

### 설치되는 항목

| 구성 요소 | 버전 | 용도 |
|-----------|------|------|
| **Node.js** | LTS (20.x) | Claude Code 실행에 필요 |
| **Git** | 최신 | 버전 관리 통합 |
| **Claude Code** | 최신 | Anthropic의 AI 코딩 어시스턴트 CLI |

### 설치 흐름

```
환영 화면 → 시스템 점검 → 설치 진행 → 로그인 안내 → 완료
```

1. **환영 화면**: 설치할 항목 소개
2. **시스템 점검**: Node.js, Git, Claude Code 설치 여부 자동 감지
3. **설치 진행**: 미설치 항목을 순서대로 설치 (실시간 진행률 표시)
4. **로그인 안내**: Claude Code OAuth 인증 방법 안내
5. **완료**: 설치 요약 및 유용한 링크 제공

### 소스에서 빌드하기

```powershell
# 사전 요구사항: Go 1.22+, Node.js 20+
go install github.com/wailsapp/wails/v2/cmd/wails@latest

git clone https://github.com/junghwaYang/claude-code-installer.git
cd claude-code-installer

# 개발 모드 (핫 리로드)
wails dev

# 프로덕션 빌드
wails build -clean -webview2 embed
# 결과: build/bin/claude-code-installer.exe
```

---

## English

### About

A beautiful, one-click installer for Claude Code on Windows.
Automatically installs Node.js, Git, and Claude Code with zero configuration.

### Features

- **Zero Configuration** - Downloads and installs everything automatically
- **Smart Detection** - Skips already-installed components
- **Dual Install Strategy** - winget first, direct download fallback
- **Real-time Progress** - Live progress updates for each step
- **Bilingual UI** - Korean/English toggle with one click
- **Login Guidance** - Step-by-step Claude Code authentication guide
- **Dark Theme** - Modern UI built with React + Tailwind CSS

### Quick Start

1. Download `claude-code-installer.exe` from [Releases](https://github.com/junghwaYang/claude-code-installer/releases)
2. Run the installer (double-click)
3. Click "Start Installation"
4. Done! Type `claude` in your terminal to get started

### What Gets Installed

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | LTS (20.x) | Required runtime for Claude Code |
| **Git** | Latest | Version control integration |
| **Claude Code** | Latest | Anthropic's AI coding assistant CLI |

### Installation Flow

```
Welcome → System Check → Installing → Login Guide → Complete
```

1. **Welcome**: Overview of what will be installed
2. **System Check**: Auto-detect Node.js, Git, Claude Code status
3. **Installing**: Install missing components in order (real-time progress)
4. **Login Guide**: Step-by-step OAuth authentication instructions
5. **Complete**: Summary and useful links

### Building from Source

```bash
# Prerequisites: Go 1.22+, Node.js 20+
go install github.com/wailsapp/wails/v2/cmd/wails@latest

git clone https://github.com/junghwaYang/claude-code-installer.git
cd claude-code-installer

# Development mode (hot reload)
wails dev

# Production build
wails build -clean -webview2 embed
# Output: build/bin/claude-code-installer.exe
```

---

## Architecture

```
claude-code-installer/
├── frontend/              # React + TypeScript + Tailwind UI
│   ├── src/
│   │   ├── components/    # 5-step wizard components
│   │   ├── hooks/         # State management + i18n
│   │   └── styles/        # Tailwind + custom animations
│   └── package.json
├── internal/              # Go backend
│   ├── detector/          # Software detection (PATH + registry)
│   ├── installer/         # Install logic (winget + download fallback)
│   ├── pathutil/          # Windows PATH management
│   └── updater/           # Version check via GitHub API
├── build/windows/         # UAC manifest
├── main.go                # Wails entry point
└── app.go                 # Frontend-bound API
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go + Wails v2 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build | Single `.exe` with embedded WebView2 |
| CI/CD | GitHub Actions (tag-triggered) |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Wails Documentation](https://wails.io/docs/introduction)
- [Report Issues](https://github.com/junghwaYang/claude-code-installer/issues)

---

Made with Claude Code
