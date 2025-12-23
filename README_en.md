# Xiaomi MiMo Studio Watermark Remover

A Tampermonkey userscript that automatically detects and removes watermarks from Xiaomi MiMo Studio (https://aistudio.xiaomimimo.com/) pages.

🇨🇳 [中文](README_zh.md) | 🇺🇸 **English**

## Features

- ✅ **Dynamic Watermark Detection**: Automatically fetches the current user's watermark content from the API, no manual configuration required
- ✅ **Multiple Detection Methods**: Supports detection and removal of watermarks in various forms including text, images, Canvas, and CSS
- ✅ **Real-time Monitoring**: Uses MutationObserver to monitor DOM changes and automatically detects and removes dynamically added watermarks
- ✅ **Performance Optimization**: Debouncing, element caching, detection depth limiting, and other optimizations
- ✅ **Log Control**: Configurable log switch, disabled by default, can be enabled for debugging

## Installation

### 1. Install Tampermonkey

- **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**: [App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. Install the Script

Choose one of the following methods to install the script:

#### Method 1: Install from Greasy Fork (Recommended)

1. Visit the [Greasy Fork script page](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
2. Click the "Install this script" button on the page
3. Confirm the installation

#### Method 2: Install from OpenUserJS

1. Visit the [OpenUserJS script page](https://openuserjs.org/scripts/AlanWang/Xiaomi_MiMo_Studio_%E5%8E%BB%E6%B0%B4%E5%8D%B0)
2. Click the "Install" button on the page
3. Confirm the installation

#### Method 3: Install directly from GitHub

1. Visit the [GitHub Raw URL](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/raw/refs/heads/main/xiaomi-mimo-watermark-remover.user.js)
2. Tampermonkey will automatically recognize and prompt for installation
3. Click the "Install" button to confirm

### 3. Usage

Visit [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/), and the script will automatically run and remove watermarks from the page.

## Configuration Options

The script supports the following configuration options (modify at the beginning of the script):

```javascript
// Log switch (set to true to enable logs, false to disable)
const ENABLE_LOG = false;
```

- **ENABLE_LOG**: Controls whether to output debug logs
  - `false` (default): No logs output, runs silently
  - `true`: Outputs detailed logs in the browser console for debugging

## How It Works

1. **Fetch Watermark Content**: The script automatically calls the API `https://aistudio.xiaomimimo.com/open-apis/user/mi/get` to get the current user's watermark content when it starts
2. **Detect Watermarks**: Detects watermarks on the page through multiple methods:
   - Text content detection (textContent, innerText, innerHTML)
   - Image detection (img src, CSS background-image)
   - Canvas drawing interception
   - CSS style interception
3. **Remove Watermarks**: Executes corresponding removal operations based on the detected watermark type
4. **Dynamic Monitoring**: Uses MutationObserver to monitor DOM changes, ensuring dynamically added watermarks are also removed

## Technical Implementation

- **API Requests**: Uses `fetch` API to get user information and watermark content
- **DOM Monitoring**: Uses `MutationObserver` to monitor page changes
- **Canvas Interception**: Intercepts `CanvasRenderingContext2D` drawing methods
- **Performance Optimization**: Debouncing, WeakSet caching, detection depth limiting

## Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Other browsers that support Tampermonkey

## Version History

### v1.3.3
- Performance: Removed redundant DOM scans, cleanup process now executes once
- Code: Removed duplicate initialization calls, streamlined main flow
- Error handling: Added debug logs for critical operations to aid troubleshooting

### v1.3.2
- Use the browser timezone for the `x-timezone` request header

### v1.3.1
- Improved Windows initial watermark flash: early hide/cleanup of fullscreen Canvas watermark overlay
- Improved cleanup timing: handle overlay before watermark text is fetched, reducing reliance on forced re-render (e.g., opening DevTools)
- Performance: bounded requestAnimationFrame cleanup loop and debounced MutationObserver callbacks to avoid sustained high CPU usage

### v1.3.0
- Optimized DOM observation logic to scan only the local subtree of changed nodes, significantly reducing CPU usage
- Removed periodic full-page scans and rely on incremental detection via MutationObserver for better performance and responsiveness

### v1.2.0
- Added global log switch, disabled by default
- Unified log output format

### v1.1.0
- Added dynamic watermark fetching functionality
- Added retry mechanism and page detection fallback
- Improved error handling and log output

### v1.0.0
- Initial release
- Supports detection and removal of multiple watermark forms

## Notes

- This script is for learning and research purposes only
- Please ensure compliance with the relevant website's terms of use before using
- The script automatically fetches the watermark content of the currently logged-in user, no manual configuration required

## License

MIT License

Copyright (c) 2025 AlanWang

## Contributing

Issues and Pull Requests are welcome!

## Related Links

- [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)
- [Tampermonkey Official Website](https://www.tampermonkey.net/)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&type=Date)](https://star-history.com/#wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&Date)

