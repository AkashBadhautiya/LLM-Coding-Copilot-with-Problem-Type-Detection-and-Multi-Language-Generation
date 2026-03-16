# AI Code Helper Pro

A Chrome extension that serves as an AI-powered coding assistant for competitive programming. It uses OpenAI's API to generate code solutions in multiple languages based on problem descriptions or selected text.

## Features

- **Context-Aware Code Generation**: Extracts problem context from web pages and generates appropriate code solutions.
- **Multi-Language Support**: Defaults to C++ for DSA problems, Python for ML, and SQL when requested.
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+G` / `Cmd+Shift+G`: Generate C++ solution
  - `Ctrl+Shift+P` / `Cmd+Shift+P`: Generate Python solution
  - `Ctrl+Shift+V` / `Cmd+Shift+V`: Paste last generated code
  - `Ctrl+Shift+X` / `Cmd+Shift+X`: Clear last generated code
- **Context Menu Integration**: Right-click on selected text to generate code.
- **Smart Code Injection**: Automatically inserts code into Monaco, Ace, or textarea editors.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the folder containing the extension files.
5. The extension should now be installed.

## Setup

1. Click the extension icon in the toolbar.
2. Enter your OpenAI API key (starts with `sk-...`).
3. Click "Save" to store the key securely.

## Usage

- Navigate to a competitive programming problem page (e.g., LeetCode, Codeforces).
- Select text describing the problem or code snippet.
- Use keyboard shortcuts or right-click context menu to generate code.
- The generated code will be stored and can be pasted directly into code editors.

## Permissions

The extension requires the following permissions:

- `contextMenus`: For right-click menu integration
- `activeTab`: To access the current tab's content
- `scripting`: To inject code into web pages
- `storage`: To save API key and generated code
- `commands`: For keyboard shortcuts

## Host Permissions

- `https://api.openai.com/*`: To communicate with OpenAI API
- `<all_urls>`: To extract context from any webpage

## Contributing

Feel free to submit issues or pull requests to improve the extension.

## License

This project is open-source. Check the repository for license details.
