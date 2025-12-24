# Xiaomi MiMo Studio Watermark Remover

A Tampermonkey userscript that automatically detects and removes watermarks from Xiaomi MiMo Studio (https://aistudio.xiaomimimo.com/) pages.

🇨🇳 [中文](README_zh.md) | 🇺🇸 **English**

---

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Technical Implementation](#technical-implementation)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Compatibility](#compatibility)
- [Version History](#version-history)
- [Notes](#notes)
- [License](#license)
- [Contributing](#contributing)
- [Related Links](#related-links)

## ✨ Features

- ✅ **Dynamic Watermark Detection**: Automatically fetches the current user's watermark content from the API, no manual configuration required
- ✅ **Multiple Detection Methods**: Supports detection and removal of watermarks in various forms including text, images, Canvas, and CSS
- ✅ **Real-time Monitoring**: Uses MutationObserver to monitor DOM changes and automatically detects and removes dynamically added watermarks
- ✅ **Performance Optimization**: Debouncing, element caching, detection depth limiting, and other optimizations
- ✅ **Log Control**: Configurable log switch, disabled by default, can be enabled for debugging
- ✅ **Exception Handling**: Complete error handling and logging for easy troubleshooting
- ✅ **Zero Dependencies**: Pure native JavaScript implementation, no external dependencies
- ✅ **Memory Optimization**: Uses WeakSet to prevent memory leaks

## 🚀 Installation

### 1. Install Tampermonkey

First, you need to install the Tampermonkey browser extension:

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

### 3. Verify Installation

After installation, visit [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/), and you should see:

- Watermark text on the page has disappeared
- Browser console (if logging is enabled) will display `[去水印脚本]` related log information

## ⚙️ Configuration

The script supports the following configuration options (modify at the beginning of the script):

```javascript
// ========== Configuration Options ==========
// Log switch (set to true to enable logs, false to disable)
const ENABLE_LOG = false;
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ENABLE_LOG` | Boolean | `false` | Controls whether to output debug logs, `true` to enable, `false` to disable |

### Enabling Logs for Debugging

When troubleshooting is needed, you can set `ENABLE_LOG` to `true`:

```javascript
const ENABLE_LOG = true;
```

After enabling, the browser console (F12) will output detailed log information, including:

- Watermark detection process
- DOM change monitoring
- Canvas interception records
- Error and warning information

## 🔬 How It Works

### 1. Fetch Watermark Content

The script automatically calls the API to get the current user's watermark content when it starts:

```
GET https://aistudio.xiaomimimo.com/open-apis/user/mi/get
```

API request features:
- Automatically carries user authentication (cookies)
- Automatically sets timezone-related request headers
- Timeout handling (10 seconds)
- Error retry mechanism

### 2. Detect Watermarks

The script detects watermarks on the page through multiple methods:

#### Text Detection
- Checks element `textContent`, `innerText`, `innerHTML`
- Checks form element `value` attributes
- Checks all HTML attribute values

#### Image Detection
- Checks `<img>` tag `src` attributes
- Checks CSS `background-image` properties
- Checks inline styles for background images

#### Canvas Interception
- Intercepts `CanvasRenderingContext2D.fillText()`
- Intercepts `CanvasRenderingContext2D.strokeText()`
- Intercepts `CanvasRenderingContext2D.drawImage()`
- Prevents drawing operations containing watermark content

#### CSS Style Detection
- Detects full-screen overlay elements
- Detects fixed-position elements
- Detects `pointer-events: none` elements
- Detects high z-index transparent elements

### 3. Remove Watermarks

Executes corresponding removal operations based on the detected watermark type:

- **Text Watermarks**: Removes or replaces watermark text from DOM nodes
- **Image Watermarks**: Clears background images or hides/removes elements
- **Canvas Watermarks**: Prevents drawing or clears canvas
- **Overlay Watermarks**: Hides or removes overlay elements

### 4. Dynamic Monitoring

Uses `MutationObserver` to monitor DOM changes:

- Monitors child node additions and deletions
- Monitors specific attribute changes (style, src, class, background-image)
- Only scans changed local nodes to reduce CPU usage
- Uses debouncing to avoid frequent execution

## 🛠️ Technical Implementation

### Core Architecture

```
├── Configuration
│   ├── ENABLE_LOG (log switch)
│   └── Watermark content variables
├── Logging System
│   ├── logger.log()
│   ├── logger.warn()
│   └── logger.error()
├── Watermark Detection
│   ├── containsWatermark() - Text matching
│   ├── elementContainsWatermark() - Element detection
│   ├── imageContainsWatermark() - Image detection
│   └── isLikelyWatermarkOverlay() - Overlay detection
├── Watermark Removal
│   ├── hideOverlayElement() - Hide overlay
│   ├── removeWatermark() - Remove watermark element
│   └── clearLikelyWatermarkCanvases() - Clear watermark canvas
├── DOM Monitoring
│   ├── detectAndHideOverlays() - Detect and hide overlays
│   ├── detectAndRemoveWatermarks() - Detect and remove watermarks
│   └── setupObserver() - Set up MutationObserver
└── Canvas Interception
    ├── interceptCanvas() - Intercept Canvas API
    └── OffscreenCanvas support
```

### Performance Optimization Strategies

1. **Debouncing**: Uses `debounce()` function to avoid frequent execution
2. **WeakSet Caching**: Uses WeakSet to store processed elements and prevent memory leaks
3. **Depth Limiting**: DOM traversal maximum depth limited to 10-12 levels
4. **Local Scanning**: Only scans changed local nodes instead of full-page scans
5. **Element Caching**: Avoids processing the same element repeatedly

### Error Handling

- All DOM operations have try-catch protection
- API requests have timeout handling (10 seconds)
- JSON parsing errors are captured and logged
- Detailed error logs facilitate troubleshooting

## ❓ FAQ

### Q1: Script won't install?

**Solutions**:
- Make sure Tampermonkey extension is installed
- Check if the browser supports the script
- Try refreshing the page and reinstalling
- Check for conflicts with other scripts

### Q2: Watermark not removed?

**Solutions**:
1. Open browser console (F12)
2. Set `ENABLE_LOG` to `true`
3. Refresh the page and check logs
4. Verify script is executing correctly

### Q3: Page displays incorrectly?

**Solutions**:
- Check for conflicts with other browser extensions
- Try using incognito mode
- Clear browser cache and retry

### Q4: API request failed?

**Solutions**:
- Make sure you're logged in to Xiaomi MiMo Studio
- Check network connection
- Check console error messages

### Q5: Performance issues?

**Solutions**:
- The script is optimized with low CPU usage
- If problems persist, try:
  - Disabling other extensions
  - Using the latest browser version
  - Clearing browser cache

## 🔧 Troubleshooting

### Enabling Debug Mode

1. Edit the script, change `ENABLE_LOG` to `true`
2. Open browser console (F12 -> Console)
3. Refresh the page and view log output

### Checking Script Status

Enter in the console:
```javascript
console.log('Script status:', typeof WATERMARK_TEXT !== 'undefined' ? 'Running' : 'Not running');
```

### Checking Watermark Content

```javascript
// Execute in console
console.log('Current watermark:', WATERMARK_TEXT);
console.log('Watermark candidates:', WATERMARK_TEXT_CANDIDATES);
```

### Resetting Script Status

1. Disable the script
2. Refresh the page
3. Re-enable the script

### Reporting Issues

When encountering problems, please provide:

1. Browser version and operating system
2. Tampermonkey version
3. Script version
4. Error logs (after enabling debug mode)
5. Problem description and reproduction steps

## 📱 Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Opera | 76+ | ✅ Full Support |

### System Requirements

- Modern browser supporting ES6+
- JavaScript enabled
- Tampermonkey extension

## 📝 Version History

### v1.3.3 (2025-01)
- Performance: Removed redundant DOM scans, cleanup process now executes once
- Code: Removed duplicate initialization calls, streamlined main flow
- Error handling: Added debug logs for critical operations to aid troubleshooting

### v1.3.2 (2025-01)
- Use the browser timezone for the `x-timezone` request header

### v1.3.1 (2025-01)
- Improved Windows initial watermark flash: early hide/cleanup of fullscreen Canvas watermark overlay
- Improved cleanup timing: handle overlay before watermark text is fetched, reducing reliance on forced re-render
- Performance: bounded requestAnimationFrame cleanup loop and debounced MutationObserver callbacks to avoid sustained high CPU usage

### v1.3.0 (2025-01)
- Optimized DOM observation logic to scan only the local subtree of changed nodes, significantly reducing CPU usage
- Removed periodic full-page scans and rely on incremental detection via MutationObserver for better performance and responsiveness

### v1.2.0 (2025-01)
- Added global log switch, disabled by default
- Unified log output format

### v1.1.0 (2025-01)
- Added dynamic watermark fetching functionality
- Added retry mechanism and page detection fallback
- Improved error handling and log output

### v1.0.0 (2025-01)
- Initial release
- Supports detection and removal of multiple watermark forms

## ⚠️ Notes

- This script is for learning and research purposes only
- Please ensure compliance with the relevant website's terms of use before using
- The script automatically fetches the watermark content of the currently logged-in user, no manual configuration required
- Regularly update the script to get the latest features and fixes
- If you encounter issues, please check the FAQ and troubleshooting sections first

## 📄 License

This project is open source under the MIT License.

```
MIT License

Copyright (c) 2025 AlanWang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork this project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Submit a Pull Request

### Contribution Guidelines

- Follow the project's code style
- Ensure code passes lint checks
- Add appropriate tests
- Update relevant documentation

## 🔗 Related Links

- [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)
- [Tampermonkey Official Website](https://www.tampermonkey.net/)
- [Greasy Fork Script Page](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
- [GitHub Project](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover)
- [Issue Report](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&type=Date)](https://star-history.com/#wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&Date)

---

**Thank you for using!** If this script helps you, please give the project a Star to show your support.
