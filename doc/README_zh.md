# Xiaomi MiMo Studio 去水印脚本

🇨🇳 **中文** | 🇺🇸 [English](./README_en.md)

---

一个用于自动检测并移除 Xiaomi MiMo Studio (https://aistudio.xiaomimimo.com/) 页面中水印的 Tampermonkey 用户脚本。

## 📋 目录

- [功能特性](#功能特性)
- [安装方法](#安装方法)
- [配置选项](#配置选项)
- [工作原理](#工作原理)
  - [获取水印内容](#1-获取水印内容)
  - [检测水印](#2-检测水印)
  - [移除水印](#3-移除水印)
  - [动态监听](#4-动态监听)
- [技术实现](#技术实现)
  - [核心架构](#核心架构)
  - [性能优化策略](#性能优化策略)
  - [错误处理](#错误处理)
- [常见问题](#常见问题)
- [故障排除](#故障排除)
  - [启用调试模式](#启用调试模式)
  - [查看脚本是否运行](#查看脚本是否运行)
  - [检查水印内容](#检查水印内容)
  - [重置脚本状态](#重置脚本状态)
  - [报告问题](#报告问题)
- [兼容性](#兼容性)
- [版本历史](#版本历史)
- [注意事项](#注意事项)
- [许可证](#许可证)
- [贡献](#贡献)
- [相关链接](#相关链接)

## ✨ 功能特性

- ✅ **动态获取水印**：自动从 API 获取当前用户的水印内容，无需手动配置
- ✅ **多种检测方式**：支持文本、图片、Canvas、CSS 等多种水印形式的检测和移除
- ✅ **实时监听**：使用 MutationObserver 监听 DOM 变化，自动检测并移除动态添加的水印
- ✅ **性能优化**：防抖机制、元素缓存、检测深度限制等优化措施
- ✅ **日志控制**：可配置的日志开关，默认关闭，需要调试时可开启
- ✅ **异常处理**：完善的错误处理和日志记录，便于问题排查
- ✅ **零依赖**：纯原生 JavaScript 实现，无外部依赖
- ✅ **内存优化**：使用 WeakSet 避免内存泄漏

## 🚀 安装方法

### 1. 安装 Tampermonkey

首先需要安装 Tampermonkey 浏览器扩展：

- **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**: [App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. 安装脚本

选择以下任一方式安装脚本：

#### 方式一：从 Greasy Fork 安装（推荐）

1. 访问 [Greasy Fork 脚本页面](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
2. 点击页面上的"安装此脚本"按钮
3. 确认安装即可

#### 方式二：从 OpenUserJS 安装

1. 访问 [OpenUserJS 脚本页面](https://openuserjs.org/scripts/AlanWang/Xiaomi_MiMo_Studio_%E5%8E%BB%E6%B0%B4%E5%8D%B0)
2. 点击页面上的"Install"按钮
3. 确认安装即可

#### 方式三：从 GitHub 直接安装

1. 访问 [GitHub Raw 地址](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/raw/refs/heads/main/xiaomi-mimo-watermark-remover.user.js)
2. Tampermonkey 会自动识别并提示安装
3. 点击"安装"按钮确认即可

### 3. 验证安装

安装完成后，访问 [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)，你应该能看到：

- 页面上的水印文字已经消失
- 浏览器控制台（如果开启了日志）会显示 `[去水印脚本]` 相关的日志信息

## ⚙️ 配置选项

脚本支持以下配置选项（在脚本开头修改）：

```javascript
// ========== 配置选项 ==========
// 日志开关（设置为 true 启用日志，false 关闭日志）
// 支持通过 localStorage 或 URL 参数动态控制：
// - localStorage: localStorage.setItem('watermark_debug', 'true')
// - URL 参数: ?debug=true
const ENABLE_LOG = false;
```

### 核心配置选项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_LOG` | Boolean | `false` | 控制是否输出调试日志，`true` 启用，`false` 关闭 |
| `MAX_DEPTH` | Number | `12` | 最大遍历深度，防止调用栈溢出 |
| `MAX_NODES` | Number | `10000` | 最大处理节点数，防止性能问题 |
| `MAX_POLL_COUNT` | Number | `20` | 最大轮询次数 |
| `POLL_INTERVAL` | Number | `500` | 轮询间隔（毫秒） |
| `MAX_RETRIES` | Number | `5` | API 请求最大重试次数 |
| `RETRY_DELAY` | Number | `1000` | 初始重试延迟（毫秒） |
| `RETRY_BACKOFF` | Number | `1.5` | 重试退避倍数 |
| `FETCH_TIMEOUT` | Number | `10000` | API 请求超时（毫秒） |
| `REGEX_TIMEOUT` | Number | `100` | 正则替换超时（毫秒） |
| `MAX_WATERMARK_LENGTH` | Number | `500` | 水印文本最大长度 |
| `MIN_WATERMARK_LENGTH` | Number | `1` | 水印文本最小长度 |
| `OBSERVER_DEBOUNCE` | Number | `50` | MutationObserver 防抖延迟（毫秒） |
| `RESIZE_DEBOUNCE` | Number | `300` | resize 事件防抖延迟（毫秒） |

### 拦截配置选项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_CANVAS_INTERCEPT` | Boolean | `true` | 启用 Canvas API 拦截 |
| `ENABLE_CSS_INTERCEPT` | Boolean | `false` | 启用 CSS 样式拦截（默认关闭） |
| `ENABLE_APPEND_CHILD_INTERCEPT` | Boolean | `false` | 启用 appendChild 拦截（默认关闭） |

### 性能优化配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `VIEWPORT_COVERAGE_THRESHOLD` | Number | `0.9` | 视口覆盖阈值（90%）用于覆盖层检测 |
| `BASE64_MATCH_MAX_LENGTH` | Number | `50` | Base64 匹配长度上限用于水印检测 |
| `PAGE_LOAD_WAIT_TIME` | Number | `2000` | 页面加载等待时间（毫秒） |
| `HIGH_ZINDEX_THRESHOLD` | Number | `100` | 高 z-index 阈值用于覆盖层检测 |
| `LOW_OPACITY_THRESHOLD` | Number | `1` | 低透明度阈值用于覆盖层检测 |
| `USE_TREE_WALKER` | Boolean | `false` | 使用 TreeWalker API 进行 DOM 遍历（实验性） |

### 启用日志进行调试

当需要排查问题时，可以将 `ENABLE_LOG` 设置为 `true`：

```javascript
const ENABLE_LOG = true;
```

启用后，浏览器控制台（F12）会输出详细的日志信息，包括：

- 水印检测过程
- DOM 变化监听
- Canvas 拦截记录
- 错误和警告信息

### 性能优化选项

高级用户可以调整以下选项以获得更好的性能：

1. **TreeWalker API**：设置 `USE_TREE_WALKER` 为 `true` 使用 TreeWalker API 进行 DOM 遍历（在大页面上可能提升性能）
2. **防抖设置**：调整 `OBSERVER_DEBOUNCE` 和 `RESIZE_DEBOUNCE` 以平衡响应性和性能
3. **节点限制**：根据页面复杂度调整 `MAX_NODES` 和 `MAX_DEPTH`

### 拦截控制

脚本提供对原型链修改的精细控制：

- **Canvas 拦截**：默认启用，拦截 Canvas 绘制操作
- **CSS 拦截**：默认关闭，需要时可启用（可能影响页面功能）
- **appendChild 拦截**：默认关闭，需要时可启用（可能影响页面功能）

## 🔬 工作原理

### 1. 获取水印内容

脚本启动时自动调用 API 获取当前用户的水印内容：

```
GET https://aistudio.xiaomimimo.com/open-apis/user/mi/get
```

API 请求特点：
- 自动携带用户认证信息（cookies）
- 自动设置时区相关的请求头
- 超时处理（10秒）
- 错误重试机制

### 2. 检测水印

脚本通过多种方式检测页面中的水印：

#### 文本检测
- 检查元素的 `textContent`、`innerText`、`innerHTML`
- 检查表单元素的 `value` 属性
- 检查所有 HTML 属性的值

#### 图片检测
- 检查 `<img>` 标签的 `src` 属性
- 检查 CSS 的 `background-image` 属性
- 检查内联样式中的背景图片

#### Canvas 拦截
- 拦截 `CanvasRenderingContext2D.fillText()`
- 拦截 `CanvasRenderingContext2D.strokeText()`
- 拦截 `CanvasRenderingContext2D.drawImage()`
- 阻止包含水印内容的绘制操作

#### CSS 样式检测
- 检测全屏覆盖层元素
- 检测固定定位的元素
- 检测 `pointer-events: none` 的元素
- 检测高 z-index 的透明元素

### 3. 移除水印

根据检测到的水印类型，执行相应的移除操作：

- **文本水印**：从 DOM 节点中移除或替换水印文本
- **图片水印**：清除背景图片或隐藏/移除元素
- **Canvas 水印**：阻止绘制或清空画布
- **覆盖层水印**：隐藏或移除覆盖层元素

### 4. 动态监听

使用 `MutationObserver` 监听 DOM 变化：

- 监听子节点的添加和删除
- 监听特定属性变化（style、src、class、background-image）
- 仅扫描变化的局部节点，降低 CPU 占用
- 使用防抖机制，避免频繁执行

## 🛠️ 技术实现

### 核心架构

```
├── 配置文件
│   ├── ENABLE_LOG (日志开关)
│   └── 水印内容变量
├── 日志系统
│   ├── logger.log()
│   ├── logger.warn()
│   └── logger.error()
├── 水印检测
│   ├── containsWatermark() - 文本匹配
│   ├── elementContainsWatermark() - 元素检测
│   ├── imageContainsWatermark() - 图片检测
│   └── isLikelyWatermarkOverlay() - 覆盖层检测
├── 水印移除
│   ├── hideOverlayElement() - 隐藏覆盖层
│   ├── removeWatermark() - 移除水印元素
│   └── clearLikelyWatermarkCanvases() - 清空水印画布
├── DOM 监听
│   ├── detectAndHideOverlays() - 检测并隐藏覆盖层
│   ├── detectAndRemoveWatermarks() - 检测并移除水印
│   └── setupObserver() - 设置 MutationObserver
└── Canvas 拦截
    ├── interceptCanvas() - 拦截 Canvas API
    └── OffscreenCanvas 支持
```

### 性能优化策略

1. **防抖机制**：使用 `debounce()` 函数，避免频繁执行
2. **WeakSet 缓存**：使用 WeakSet 存储已处理元素，避免内存泄漏
3. **深度限制**：DOM 遍历最大深度限制为 10-12 层
4. **局部扫描**：仅扫描变化的局部节点，而非全量扫描
5. **元素缓存**：避免重复处理同一元素

### 错误处理

- 所有 DOM 操作都有 try-catch 保护
- API 请求有超时处理（10秒）
- JSON 解析错误会被捕获和记录
- 详细的错误日志便于问题排查

## ❓ 常见问题

### Q1: 脚本无法安装？

**解决方案**：
- 确保已安装 Tampermonkey 扩展
- 检查浏览器是否支持该脚本
- 尝试刷新页面后重新安装
- 检查是否有其他脚本冲突

### Q2: 水印没有移除？

**解决方案**：
1. 打开浏览器控制台（F12）
2. 将 `ENABLE_LOG` 设置为 `true`
3. 刷新页面查看日志
4. 确认脚本是否正确执行

### Q3: 页面显示异常？

**解决方案**：
- 检查是否有其他浏览器扩展冲突
- 尝试在隐身模式下使用
- 清除浏览器缓存后重试

### Q4: API 请求失败？

**解决方案**：
- 确保已登录 Xiaomi MiMo Studio
- 检查网络连接
- 查看控制台错误信息

### Q5: 性能问题？

**解决方案**：
- 脚本已优化，CPU 占用很低
- 如仍有问题，尝试：
  - 关闭其他扩展
  - 使用最新版本浏览器
  - 清理浏览器缓存

## 🔧 故障排除

### 启用调试模式

1. 编辑脚本，将 `ENABLE_LOG` 改为 `true`
2. 打开浏览器控制台（F12 -> Console）
3. 刷新页面，查看日志输出

### 查看脚本是否运行

在控制台中输入：
```javascript
console.log('脚本状态:', typeof WATERMARK_TEXT !== 'undefined' ? '已运行' : '未运行');
```

### 检查水印内容

```javascript
// 在控制台中执行
console.log('当前水印内容:', WATERMARK_TEXT);
console.log('水印候选列表:', WATERMARK_TEXT_CANDIDATES);
```

### 重置脚本状态

1. 禁用脚本
2. 刷新页面
3. 重新启用脚本

### 报告问题

当遇到问题时，请提供以下信息：

1. 浏览器版本和操作系统
2. Tampermonkey 版本
3. 脚本版本
4. 错误日志（开启调试模式后）
5. 问题描述和复现步骤

## 📱 兼容性

| 浏览器 | 版本 | 状态 |
|--------|------|------|
| Chrome | 90+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Opera | 76+ | ✅ 完全支持 |

### 系统要求

- 支持 ES6+ 的现代浏览器
- 启用 JavaScript
- Tampermonkey 扩展

## 📝 版本历史

### v1.3.7 (2026-01-05)
- **代码质量改进**：
  - 将 `detectAndRemoveWatermarks` 函数重构为 6 个子函数，提高可维护性
  - 将魔法数字提取到 CONFIG 对象（VIEWPORT_COVERAGE_THRESHOLD、BASE64_MATCH_MAX_LENGTH、PAGE_LOAD_WAIT_TIME）
  - 添加正则表达式缓存，避免重复编译
  - 增强错误日志，添加上下文信息（错误、堆栈、时间戳、URL、用户代理）
  - 添加配置验证函数，防止配置错误
  - 将 `clearLikelyWatermarkCanvases` 重命名为 `clearSuspectedWatermarkCanvases`，语义更清晰
- **性能优化**：
  - 实现 TreeWalker API 选项用于 DOM 遍历（实验性功能）
  - 优化样式缓存失效策略，支持精细的缓存清理（attribute、childList、default）
  - 修复 MutationObserver 中的防抖逻辑，确保性能优化生效
- **Bug 修复**：
  - 修复防抖逻辑问题，导致频繁扫描
  - 修复配置验证，包含所有新增配置项
  - 修复 TreeWalker 递归调用问题，可能导致节点处理限制失效

### v1.3.6 (2026-01-04)
- 代码重构：修复代码格式问题，统一缩进和空行
- 函数优化：将 startWatermarkRemoval 函数定义规范化，修复作用域问题
- 性能优化：优化 containsWatermark 函数，移除重复的过滤逻辑，在 rebuildWatermarkCandidates 中预过滤
- 性能优化：改进正则替换超时检查逻辑，将超时检查移到整个操作的前后
- 代码重构：拆分 isLikelyWatermarkOverlay 函数，创建 8 个辅助函数提高可维护性
- 缓存优化：改进样式缓存清理逻辑，确保清理 Shadow Root 中的元素缓存
- API 优化：简化 API 请求 headers，从 12 个减少到 3 个，降低被识别为爬虫的风险
- 功能新增：添加配置开关控制原型链修改（ENABLE_CANVAS_INTERCEPT、ENABLE_CSS_INTERCEPT、ENABLE_APPEND_CHILD_INTERCEPT）
- 文档更新：更新时序图文档，反映所有代码改进

### v1.3.5 (2025-12-30)
- 安全修复：修复内存泄漏风险，添加定时器和事件监听器的清理机制
- 安全修复：修复原型链污染风险，使用 Object.defineProperty 减少对第三方代码的影响
- 安全修复：修复递归深度问题，将递归改为迭代，添加节点数量限制
- 性能优化：添加样式缓存机制，减少 getComputedStyle 调用
- 安全修复：修复正则表达式拒绝服务风险，添加安全验证和超时保护
- 代码改进：添加配置常量对象，集中管理所有配置参数
- 错误处理：增强网络错误处理和 API 响应验证
- 边界条件：改进视口尺寸为 0 时的处理，正确处理 zIndex 为 'auto' 的情况
- 输入验证：为关键函数添加输入验证，防止无效输入导致的问题

### v1.3.4 (2025-12-29)
- 修复：修复水印检测时机问题，将 @run-at 从 document-start 改为 document-end
- 新增：添加定期轮询检测机制（10秒内每500ms检测一次）
- 新增：添加窗口 resize 监听，确保布局变化时重新检测
- 改进：改进错误处理，添加错误统计功能
- 优化：优化代码逻辑，合并重复的检测函数
- 优化：优化 DOM 遍历性能，减少 getComputedStyle 调用

### v1.3.3 (2025-12-24)
- 性能优化：移除重复的 DOM 扫描，清理流程改为单次执行
- 代码优化：移除重复的初始化调用，精简主流程
- 异常处理改进：为关键操作添加调试日志，便于问题排查

### v1.3.2
- `x-timezone` 请求头改为根据浏览器时区自动获取

### v1.3.1
- 优化 Windows 下首屏水印闪现问题：新增对全屏 Canvas 水印覆盖层的提前隐藏与清理
- 优化清理触发时机：在获取水印内容前先处理覆盖层，减少对页面重绘依赖
- 性能优化：清理流程使用有上限的 requestAnimationFrame 链执行

### v1.3.0
- 优化 DOM 监听逻辑，仅对发生变化的局部节点进行扫描
- 移除定时全量扫描，依赖 MutationObserver 的增量检测

### v1.2.0
- 添加全局日志开关，默认关闭
- 统一日志输出格式

### v1.1.0
- 添加动态获取水印功能
- 添加重试机制和页面检测备选方案
- 改进错误处理和日志输出

### v1.0.0
- 初始版本发布
- 支持多种水印形式的检测和移除

## ⚠️ 注意事项

- 本脚本仅用于学习和研究目的
- 使用前请确保遵守相关网站的使用条款
- 脚本会自动获取当前登录用户的水印内容，无需手动配置
- 定期更新脚本以获取最新功能和修复
- 如遇到问题，请先查看常见问题和故障排除部分

## 📄 许可证

本项目采用 MIT 许可证开源。

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

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 贡献指南

- 遵循项目的代码风格
- 确保代码通过 lint 检查
- 添加适当的测试
- 更新相关文档

## 🔗 相关链接

- [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)
- [Tampermonkey 官网](https://www.tampermonkey.net/)
- [Greasy Fork 脚本页面](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
- [GitHub 项目地址](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover)
- [问题反馈](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&type=Date)](https://star-history.com/#wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover&Date)

---

**感谢您的使用！** 如果这个脚本对您有帮助，请给个项目 Star 支持一下。
