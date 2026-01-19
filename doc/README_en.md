# Xiaomi MiMo Studio Watermark Remover

🇨🇳 [中文](./README.md) | 🇺🇸 **English**

---

A Tampermonkey userscript that automatically detects and removes Canvas watermarks from Xiaomi MiMo Studio (https://aistudio.xiaomimimo.com/) pages.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
  - [Fetching Watermark Content](#1-fetching-watermark-content)
  - [Canvas Interception](#2-canvas-interception)
  - [Canvas Cleanup](#3-canvas-cleanup)
  - [Dynamic Monitoring](#4-dynamic-monitoring)
- [Technical Implementation](#technical-implementation)
  - [Core Architecture](#core-architecture)
  - [Performance Optimization](#performance-optimization)
  - [Error Handling](#error-handling)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Compatibility](#compatibility)
- [Version History](#version-history)
- [License](#license)
- [Contributing](#contributing)
- [Related Links](#related-links)

## ✨ Features

- ✅ **Dynamic Watermark Detection**: Automatically fetches current user's watermark content from API, no manual configuration required
- ✅ **Canvas Interception**: Intercepts Canvas drawing operations to prevent watermark text and image rendering
- ✅ **Canvas Cleanup**: Automatically detects and clears suspicious Canvas elements covering most of the viewport
- ✅ **Real-time Monitoring**: Monitors window resize events to re-detect when layout changes
- ✅ **Periodic Polling**: Periodically detects dynamically generated Canvas watermarks
- ✅ **Log Control**: Configurable log switch, disabled by default, can be enabled for debugging
- ✅ **Exception Handling**: Complete error handling and logging for easy troubleshooting
- ✅ **Zero Dependencies**: Pure native JavaScript implementation, no external dependencies
- ✅ **Memory Optimization**: Uses WeakSet to prevent memory leaks
- ✅ **Modern Syntax**: Uses ES6+ features, clean and efficient code

## 🚀 Installation

### 1. Install Tampermonkey

First, you need to install the Tampermonkey browser extension:

- **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**: [App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. Install Script

Choose one of the following methods to install the script:

#### Method 1: Install from Greasy Fork (Recommended)

1. Visit [Greasy Fork script page](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
2. Click the "Install this script" button on the page
3. Confirm installation

#### Method 2: Install from OpenUserJS

1. Visit [OpenUserJS script page](https://openuserjs.org/scripts/AlanWang/Xiaomi_MiMo_Studio_%E5%8E%BB%E6%B0%B4%E5%8D%B0)
2. Click the "Install" button on the page
3. Confirm installation

#### Method 3: Install directly from GitHub

1. Visit [GitHub Raw URL](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/raw/refs/heads/main/xiaomi-mimo-watermark-remover.user.js)
2. Tampermonkey will automatically recognize and prompt for installation
3. Click "Install" button to confirm

### 3. Verify Installation

After installation, visit [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/), and you should see:

- Watermark text on the page has disappeared
- Browser console (if logging is enabled) will display `[去水印脚本]` related log information

## ⚙️ Configuration

The script supports the following configuration options (modify at the beginning of the script):

```javascript
// ========== Configuration Options ==========
// Log switch (set to true to enable logs, false to disable)
// Supports dynamic control via localStorage or URL parameters:
// - localStorage: localStorage.setItem('watermark_debug', 'true')
// - URL parameter: ?debug=true
const ENABLE_LOG = false;
```

### Core Configuration Options

| Option | Type | Default | Description |
|---------|------|---------|-------------|
| `ENABLE_LOG` | Boolean | `false` | Controls whether to output debug logs, `true` to enable, `false` to disable |
| `API_URL` | String | `https://aistudio.xiaomimimo.com/open-apis/user/mi/get` | API request URL |
| `DEFAULT_TIMEZONE` | String | `'Asia/Shanghai'` | Default timezone |
| `FETCH_TIMEOUT` | Number | `10000` | API request timeout (milliseconds) |
| `MAX_WATERMARK_LENGTH` | Number | `500` | Maximum watermark text length |
| `MIN_WATERMARK_LENGTH` | Number | `1` | Minimum watermark text length |
| `BASE64_MATCH_MIN_LENGTH` | Number | `20` | Base64 match minimum length |
| `BASE64_MATCH_MAX_LENGTH` | Number | `50` | Base64 match maximum length |
| `VIEWPORT_COVERAGE_THRESHOLD` | Number | `0.9` | Viewport coverage threshold (90%) for Canvas detection |
| `MAX_RETRIES` | Number | `5` | Maximum retry attempts for API requests |
| `PAGE_LOAD_RETRIES` | Number | `3` | Retry attempts after page load |
| `INITIAL_RETRY_DELAY` | Number | `1000` | Initial retry delay (milliseconds) |
| `RETRY_BACKOFF_MULTIPLIER` | Number | `1.5` | Retry backoff multiplier |
| `MAX_POLL_COUNT` | Number | `20` | Maximum polling count |
| `POLL_INTERVAL` | Number | `500` | Polling interval (milliseconds) |
| `PAGE_LOAD_WAIT_TIME` | Number | `2000` | Page load wait time (milliseconds) |
| `MAX_REPEATED_CHARS` | Number | `10` | Maximum repeated characters (security check) |
| `MAX_REPEATED_SUBSTRINGS` | Number | `5` | Maximum repeated substrings (security check) |
| `MAX_NESTED_BRACKETS` | Number | `20` | Maximum nested brackets (security check) |

### Interception Configuration Options

| Option | Type | Default | Description |
|---------|------|---------|-------------|
| `ENABLE_CANVAS_INTERCEPT` | Boolean | `true` | Enable Canvas API interception |

### Enabling Logs for Debugging

When troubleshooting is needed, you can set `ENABLE_LOG` to `true`:

```javascript
const ENABLE_LOG = true;
```

After enabling, the browser console (F12) will output detailed log information, including:

- Watermark detection process
- Canvas interception records
- Error and warning information

## 🔬 How It Works

### 1. Fetching Watermark Content

The script automatically calls the API to fetch the current user's watermark content when it starts:

```
GET https://aistudio.xiaomimimo.com/open-apis/user/mi/get
```

API request features:
- Automatically carries user authentication information (cookies)
- Automatically sets timezone-related request headers
- Timeout handling (10 seconds)
- Error retry mechanism
- Fallback option: Detect watermark from page if API fails

### 2. Canvas Interception

The script intercepts Canvas drawing operations to prevent watermark rendering:

#### Intercepted Methods
- `CanvasRenderingContext2D.fillText()` - Prevent text drawing
- `CanvasRenderingContext2D.strokeText()` - Prevent stroke text drawing
- `CanvasRenderingContext2D.drawImage()` - Prevent image drawing
- `OffscreenCanvasRenderingContext2D` - Also supports OffscreenCanvas

#### Interception Logic
1. Check if drawing content contains watermark text
2. If it contains watermark, return directly without executing drawing
3. If it doesn't contain watermark, execute original drawing method
4. Fallback to original implementation on error

### 3. Canvas Cleanup

The script periodically detects and clears suspicious Canvas elements:

#### Detection Conditions
- Canvas covers most of the viewport (>=90%)
- Canvas uses fixed positioning (fixed or absolute)
- Canvas has `pointer-events: none` set

#### Cleanup Operations
- Use `clearRect()` to clear canvas content
- Hide Canvas element (display: none)
- Use WeakSet to avoid duplicate processing

### 4. Dynamic Monitoring

The script monitors page changes to ensure dynamically generated Canvas watermarks are also removed:

#### Monitoring Mechanisms
- **Polling Detection**: Periodically (every 500ms) detects Canvas elements, up to 20 times
- **Resize Monitoring**: Re-detects Canvas elements when window size changes
- **Resource Cleanup**: Cleans up timers and event listeners when page unloads

#### Optimization Strategies
- WeakSet caching for processed elements, avoiding duplicate processing
- Limited polling count to reduce unnecessary performance overhead
- Automatic cleanup of timers and event listeners to prevent memory leaks

## 🛠️ Technical Implementation

### Core Architecture

```
├── Configuration System (CONFIG)
│   ├── Log Configuration
│   ├── API Configuration
│   ├── Watermark Text Configuration
│   ├── Canvas Detection Configuration
│   ├── Retry Configuration
│   ├── Polling Configuration
│   ├── Page Load Configuration
│   ├── Security Configuration
│   └── Canvas Interception Configuration
├── Logging System (logger)
│   ├── log()
│   ├── warn()
│   ├── error()
│   ├── stat() (error statistics)
│   └── getStats()
├── State Management (state)
│   ├── watermarkText
│   ├── watermarkCandidates
│   ├── processedElements
│   ├── pollTimer
│   └── resizeHandler
├── Utility Functions
│   ├── formatErrorContext()
│   ├── containsWatermark()
│   ├── isSafeWatermarkText()
│   ├── rebuildWatermarkCandidates()
│   └── cleanup()
├── Canvas Interception
│   ├── interceptCanvas()
│   ├── interceptMethod()
│   ├── interceptDrawImage()
│   └── OffscreenCanvas Support
├── Canvas Cleanup
│   └── clearSuspectedWatermarkCanvases()
├── API Requests
│   ├── fetchWatermark()
│   ├── detectWatermarkFromPage()
│   └── fetchWatermarkWithRetry()
└── Main Flow
    ├── startWatermarkRemoval()
    └── main()
```

### Performance Optimization Strategies

1. **WeakSet Caching**: Uses WeakSet to store processed elements, avoiding memory leaks
2. **Optional Chaining**: Uses `?.` operator to safely access nested properties, reducing unnecessary checks
3. **Nullish Coalescing**: Uses `??` operator to provide default values, simplifying code
4. **Arrow Functions**: Concise function syntax and lexical `this` binding
5. **Object Spread Operator**: Immutable operations, avoiding side effects
6. **Limited Polling Count**: Avoids infinite polling, reducing performance overhead
7. **Automatic Resource Cleanup**: Cleans up timers and event listeners when page unloads

### Error Handling

- All async operations have try-catch protection
- API requests have timeout handling (10 seconds)
- JSON parsing errors are caught and logged
- Canvas interception errors fallback to original implementation
- Detailed error logs for easy troubleshooting
- Error statistics feature for monitoring script running status

### Modern JavaScript Features

- **ES6+ Syntax**: Uses const/let, arrow functions, template strings, etc.
- **Optional Chaining**: `?.` operator for safe property access
- **Nullish Coalescing**: `??` operator for default values
- **Destructuring**: Concise object and array destructuring
- **Promise/async-await**: Elegant async handling
- **WeakSet/WeakMap**: Weak reference collections to prevent memory leaks

## ❓ FAQ

### Q1: Script cannot be installed?

**Solution**:
- Ensure Tampermonkey extension is installed
- Check if browser supports the script
- Try refreshing the page and reinstalling
- Check for conflicts with other scripts

### Q2: Watermark is not removed?

**Solution**:
1. Open browser console (F12)
2. Set `ENABLE_LOG` to `true`
3. Refresh page to view logs
4. Confirm script is executing correctly

### Q3: Page displays abnormally?

**Solution**:
- Check for conflicts with other browser extensions
- Try using in incognito mode
- Clear browser cache and retry

### Q4: API request failed?

**Solution**:
- Ensure you are logged in to Xiaomi MiMo Studio
- Check network connection
- View console error information

### Q5: Performance issues?

**Solution**:
- The script is optimized, CPU usage is very low
- If you still have issues, try:
  - Disable other extensions
  - Use the latest version browser
  - Clear browser cache

## 🔧 Troubleshooting

### Enable Debug Mode

1. Edit the script, change `ENABLE_LOG` to `true`
2. Open browser console (F12 -> Console)
3. Refresh page to view log output

### Check if Script is Running

Enter in console:
```javascript
console.log('Script status:', typeof WATERMARK_TEXT !== 'undefined' ? 'running' : 'not running');
```

### Check Watermark Content

```javascript
// Execute in console
console.log('Current watermark content:', WATERMARK_TEXT);
console.log('Watermark candidates:', WATERMARK_TEXT_CANDIDATES);
```

### Reset Script State

1. Disable the script
2. Refresh the page
3. Re-enable the script

### Report Issues

When encountering issues, please provide the following information:

1. Browser version and operating system
2. Tampermonkey version
3. Script version
4. Error logs (after enabling debug mode)
5. Problem description and reproduction steps

## 📱 Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Opera | 76+ | ✅ Fully Supported |

### System Requirements

- Modern browser supporting ES6+
- JavaScript enabled
- Tampermonkey extension

## 📝 Version History

### v1.4.0 (2026-01-20)
- **Architecture Refactoring**:
  - Removed all non-Canvas related code, focused on Canvas watermark interception and cleanup
  - Removed DOM traversal, CSS interception, MutationObserver, and other deprecated features
  - Simplified code structure, from 1545 lines to 559 lines
- **Code Quality Improvements**:
  - Extracted all magic numbers to CONFIG constants for better maintainability
  - Applied modern JavaScript features (optional chaining, nullish coalescing, arrow functions, etc.)
  - Centralized state management using state object for unified management
  - Extracted common logic to reduce code duplication (interceptMethod, interceptDrawImage)
  - Organized code by functional modules (configuration, logging, utilities, Canvas interception, API requests, etc.)
- **Performance Optimization**:
  - Uses WeakSet to store processed elements, automatic garbage collection
  - Uses optional chaining and nullish coalescing operators to reduce unnecessary null checks
  - Limited polling count to reduce unnecessary performance overhead
  - Automatic cleanup of timers and event listeners to prevent memory leaks
- **Security Improvements**:
  - Uses `Object.prototype.hasOwnProperty.call()` instead of direct property access
  - Regular expressions use template strings for dynamic construction, avoiding hardcoding
  - Retains watermark text security validation to prevent ReDoS attacks
- **Configuration Optimization**:
  - Added new configuration options: API_URL, DEFAULT_TIMEZONE, etc.
  - Added new configuration options: BASE64_MATCH_MIN_LENGTH, PAGE_LOAD_RETRIES, INITIAL_RETRY_DELAY, etc.
  - Added new security configuration options: MAX_REPEATED_CHARS, MAX_REPEATED_SUBSTRINGS, MAX_NESTED_BRACKETS
  - Removed deprecated configuration options: MAX_DEPTH, MAX_NODES, OBSERVER_DEBOUNCE, etc.
- **Documentation Updates**:
  - Updated features to reflect Canvas-focused design
  - Updated configuration options, removed deprecated options
  - Updated how it works section, focused on Canvas interception and cleanup
  - Updated technical implementation to reflect new code architecture

### v1.3.8 (2026-01-07)
- **Security Fixes**:
  - Fixed XSS security vulnerability, using innerHTML.replace() to handle watermark text
  - Added watermark text length limit (100 characters) and security validation to prevent ReDoS attacks
  - Enhanced error handling, added SecurityError type and detailed error context information
- **Performance Optimization**:
  - Optimized style cache cleanup strategy, reducing unnecessary querySelectorAll calls
  - Implemented smart polling mechanism: first 3 polls always execute detection, subsequent only when DOM changes occur
  - Added mutationCount global variable to implement zero-overhead DOM change detection
- **Memory Management**:
  - Added globalObserver reference and cleanup mechanism to prevent memory leaks
  - Automatically cleans up MutationObserver when page unloads
- **Code Quality**:
  - Eliminated magic numbers, extracted HIGH_ZINDEX_THRESHOLD and LOW_OPACITY_THRESHOLD to CONFIG
  - Added detailed JSDoc comments for key functions (isLikelyWatermarkOverlay, removeWatermark)
  - Improved log configuration, supports dynamic control via localStorage and URL parameters
- **Bug Fixes**:
  - Fixed issue where watermark couldn't be removed on initial load
  - Fixed style cache cleanup oversimplification causing inaccurate detection
- **Documentation Updates**:
  - Updated README, added new configuration options description
  - Added smart polling sequence diagram
  - Updated documentation version to v1.3.8

### v1.3.7 (2026-01-05)
- **Code Quality Improvements**:
  - Refactored `detectAndRemoveWatermarks` function into 6 sub-functions for better maintainability
  - Extracted magic numbers to CONFIG object (VIEWPORT_COVERAGE_THRESHOLD, BASE64_MATCH_MAX_LENGTH, PAGE_LOAD_WAIT_TIME)
  - Added regex caching to avoid repeated compilation
  - Enhanced error logging, added context information (error, stack, timestamp, URL, user agent)
  - Added configuration validation function to prevent configuration errors
  - Renamed `clearLikelyWatermarkCanvases` to `clearSuspectedWatermarkCanvases` for clearer semantics
- **Performance Optimization**:
  - Implemented TreeWalker API option for DOM traversal (experimental feature)
  - Optimized style cache invalidation strategy, supports fine-grained cache cleanup (attribute, childList, default)
  - Fixed debounce logic in MutationObserver to ensure performance optimization takes effect
- **Bug Fixes**:
  - Fixed debounce logic issue causing frequent scanning
  - Fixed configuration validation to include all new configuration items
  - Fixed TreeWalker recursive call issue that could cause node processing limit failure
- **Documentation Updates**:
  - Updated sequence diagram documentation to reflect all code improvements

### v1.3.6 (2026-01-04)
- **Code Refactoring**: Fixed code formatting issues, unified indentation and blank lines
- **Function Optimization**: Normalized startWatermarkRemoval function definition, fixed scope issues
- **Performance Optimization**: Optimized containsWatermark function, removed duplicate filtering logic, pre-filter in rebuildWatermarkCandidates
- **Performance Optimization**: Improved regex replacement timeout check logic, moved timeout check to before entire operation
- **Code Refactoring**: Split isLikelyWatermarkOverlay function, created 8 helper functions for better maintainability
- **Cache Optimization**: Improved style cache cleanup logic to ensure element cache cleanup in Shadow Root
- **API Optimization**: Simplified API request headers, reduced from 12 to 3, lowering risk of being identified as crawler
- **Feature Addition**: Added configuration switches to control prototype chain modifications (ENABLE_CANVAS_INTERCEPT, ENABLE_CSS_INTERCEPT, ENABLE_APPEND_CHILD_INTERCEPT)
- **Documentation Updates**: Updated sequence diagram documentation to reflect all code improvements

### v1.3.5 (2025-12-30)
- **Security Fixes**: Fixed memory leak risk, added cleanup mechanism for timers and event listeners
- **Security Fixes**: Fixed prototype chain pollution risk, using Object.defineProperty to reduce impact on third-party code
- **Security Fixes**: Fixed recursion depth issue, changed recursion to iteration, added node count limit
- **Performance Optimization**: Added style caching mechanism to reduce getComputedStyle calls
- **Security Fixes**: Fixed regex denial of service risk, added security validation and timeout protection
- **Code Improvements**: Added configuration constant object, centralized management of all configuration parameters
- **Error Handling**: Enhanced network error handling and API response validation
- **Edge Cases**: Improved handling of viewport size being 0, correctly handles zIndex being 'auto'
- **Input Validation**: Added input validation for key functions to prevent invalid input causing issues

### v1.3.4 (2025-12-29)
- **Fix**: Fixed watermark detection timing issue, changed @run-at from document-start to document-end
- **Addition**: Added periodic polling detection mechanism (every 500ms within 10 seconds)
- **Addition**: Added window resize monitoring to re-detect when layout changes
- **Improvement**: Improved error handling, added error statistics feature
- **Optimization**: Optimized code logic, merged duplicate detection functions
- **Optimization**: Optimized DOM traversal performance, reduced getComputedStyle calls

### v1.3.3 (2025-12-24)
- **Performance Optimization**: Removed duplicate DOM scans, cleanup process changed to single execution
- **Code Optimization**: Removed duplicate initialization calls, streamlined main process
- **Exception Handling Improvement**: Added debug logs for key operations for easier troubleshooting

### v1.3.2
- `x-timezone` request header changed to automatically get based on browser timezone

### v1.3.1
- **Optimization**: Fixed first screen watermark flashing issue on Windows: added early hiding and cleanup for full-screen Canvas watermark overlay layer
- **Optimization**: Improved cleanup trigger timing: process overlay layer before fetching watermark content to reduce dependency on page repaint
- **Performance Optimization**: Cleanup process uses requestAnimationFrame chain with upper limit

### v1.3.0
- **Optimization**: Optimized DOM monitoring logic, only scans changed local nodes
- **Removed**: Periodic full-page scanning, relies on MutationObserver for incremental detection

### v1.2.0
- **Addition**: Added global log switch, disabled by default
- **Addition**: Unified log output format

### v1.1.0
- **Addition**: Added dynamic watermark fetching feature
- **Addition**: Added retry mechanism and page detection fallback
- **Improvement**: Improved error handling and log output

### v1.0.0
- **Initial Release**: First version release
- **Support**: Supports detection and removal of multiple watermark forms

## ⚠️ Notes

- This script is for learning and research purposes only
- Please comply with the relevant website's terms of service before using
- The script automatically fetches the current logged user's watermark content, no manual configuration required
- Update the script regularly to get the latest features and fixes
- If you encounter issues, please check the FAQ and troubleshooting sections first

## 📄 License

This project is open source under the MIT License.

```
MIT License

Copyright (c) 2026 AlanWang

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

### Contributing Guidelines

- Follow the project's code style
- Ensure code passes lint checks
- Add appropriate tests
- Update relevant documentation

## 🔗 Related Links

- [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)
- [Tampermonkey Official Website](https://www.tampermonkey.net/)
- [Greasy Fork Script Page](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
- [GitHub Project Repository](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover)
- [Issue Tracker](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&type=Date)](https://star-history.com/#wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&Date)

---

**Thank you for using!** If this script helps you, please give the project a Star to support it.
