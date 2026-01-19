# Xiaomi MiMo Studio 去水印脚本

🇨🇳 **中文** | 🇺🇸 [English](./doc/README_en.md)

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
- ✅ **Canvas 拦截**：拦截 Canvas 绘制操作，阻止水印文本和图片的绘制
- ✅ **Canvas 清理**：自动检测并清空覆盖大部分视口的可疑 Canvas 元素
- ✅ **实时监听**：监听窗口 resize 事件，确保布局变化时重新检测
- ✅ **定期轮询**：定期检测动态生成的 Canvas 水印
- ✅ **日志控制**：可配置的日志开关，默认关闭，需要调试时可开启
- ✅ **异常处理**：完善的错误处理和日志记录，便于问题排查
- ✅ **零依赖**：纯原生 JavaScript 实现，无外部依赖
- ✅ **内存优化**：使用 WeakSet 避免内存泄漏
- ✅ **现代语法**：使用 ES6+ 特性，代码简洁高效

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
| `API_URL` | String | `https://aistudio.xiaomimimo.com/open-apis/user/mi/get` | API 请求地址 |
| `DEFAULT_TIMEZONE` | String | `'Asia/Shanghai'` | 默认时区 |
| `FETCH_TIMEOUT` | Number | `10000` | API 请求超时（毫秒） |
| `MAX_WATERMARK_LENGTH` | Number | `500` | 水印文本最大长度 |
| `MIN_WATERMARK_LENGTH` | Number | `1` | 水印文本最小长度 |
| `BASE64_MATCH_MIN_LENGTH` | Number | `20` | Base64 匹配最小长度 |
| `BASE64_MATCH_MAX_LENGTH` | Number | `50` | Base64 匹配最大长度 |
| `VIEWPORT_COVERAGE_THRESHOLD` | Number | `0.9` | 视口覆盖阈值（90%）用于 Canvas 检测 |
| `MAX_RETRIES` | Number | `5` | API 请求最大重试次数 |
| `PAGE_LOAD_RETRIES` | Number | `3` | 页面加载后重试次数 |
| `INITIAL_RETRY_DELAY` | Number | `1000` | 初始重试延迟（毫秒） |
| `RETRY_BACKOFF_MULTIPLIER` | Number | `1.5` | 重试退避倍数 |
| `MAX_POLL_COUNT` | Number | `20` | 最大轮询次数 |
| `POLL_INTERVAL` | Number | `500` | 轮询间隔（毫秒） |
| `PAGE_LOAD_WAIT_TIME` | Number | `2000` | 页面加载等待时间（毫秒） |
| `MAX_REPEATED_CHARS` | Number | `10` | 最大重复字符数（安全检查） |
| `MAX_REPEATED_SUBSTRINGS` | Number | `5` | 最大重复子串数（安全检查） |
| `MAX_NESTED_BRACKETS` | Number | `20` | 最大嵌套括号数（安全检查） |

### 拦截配置选项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_CANVAS_INTERCEPT` | Boolean | `true` | 启用 Canvas API 拦截 |

### 启用日志进行调试

当需要排查问题时，可以将 `ENABLE_LOG` 设置为 `true`：

```javascript
const ENABLE_LOG = true;
```

启用后，浏览器控制台（F12）会输出详细的日志信息，包括：

- 水印检测过程
- Canvas 拦截记录
- 错误和警告信息

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
- 备选方案：API 失败时从页面检测水印

### 2. Canvas 拦截

脚本拦截 Canvas 绘制操作，阻止水印的绘制：

#### 拦截的方法
- `CanvasRenderingContext2D.fillText()` - 阻止文本绘制
- `CanvasRenderingContext2D.strokeText()` - 阻止描边文本绘制
- `CanvasRenderingContext2D.drawImage()` - 阻止图片绘制
- `OffscreenCanvasRenderingContext2D` - 同样支持 OffscreenCanvas

#### 拦截逻辑
1. 检查绘制内容是否包含水印文本
2. 如果包含水印，直接返回，不执行绘制
3. 如果不包含水印，执行原始绘制方法
4. 发生错误时回退到原始实现

### 3. Canvas 清理

脚本定期检测并清空可疑的 Canvas 元素：

#### 检测条件
- Canvas 覆盖大部分视口（>=90%）
- Canvas 使用固定定位（fixed 或 absolute）
- Canvas 设置了 `pointer-events: none`

#### 清理操作
- 使用 `clearRect()` 清空画布内容
- 隐藏 Canvas 元素（display: none）
- 使用 WeakSet 避免重复处理

### 4. 动态监听

脚本监听页面变化，确保动态生成的水印也能被移除：

#### 监听机制
- **轮询检测**：定期（每500ms）检测 Canvas 元素，持续20次
- **resize 监听**：窗口大小改变时重新检测 Canvas 元素
- **资源清理**：页面卸载时清理定时器和事件监听器

#### 优化策略
- WeakSet 缓存已处理元素，避免重复处理
- 限制轮询次数，减少不必要的性能开销
- 自动清理定时器和事件监听器，防止内存泄漏

## 🛠️ 技术实现

### 核心架构

```
├── 配置文件
│   ├── ENABLE_LOG (日志开关)
│   ├── API_URL (API地址)
│   └── 各种阈值和限制参数
├── 日志系统
│   ├── logger.log()
│   ├── logger.warn()
│   ├── logger.error()
│   └── logger.stat() (错误统计)
├── 状态管理
│   ├── state.watermarkText (水印文本)
│   ├── state.watermarkCandidates (水印候选列表)
│   ├── state.processedElements (已处理元素缓存)
│   ├── state.pollTimer (轮询定时器)
│   └── state.resizeHandler (resize事件处理器)
├── 工具函数
│   ├── formatErrorContext() - 格式化错误信息
│   ├── containsWatermark() - 检查文本是否包含水印
│   ├── isSafeWatermarkText() - 验证水印文本安全性
│   ├── rebuildWatermarkCandidates() - 重建水印候选列表
│   └── cleanup() - 清理资源
├── Canvas 拦截
│   ├── interceptCanvas() - 拦截 Canvas API
│   ├── interceptMethod() - 通用方法拦截器
│   ├── interceptDrawImage() - 图片绘制拦截器
│   └── OffscreenCanvas 支持
├── Canvas 清理
│   └── clearSuspectedWatermarkCanvases() - 清空可疑 Canvas
├── API 请求
│   ├── fetchWatermark() - 获取水印内容
│   ├── detectWatermarkFromPage() - 从页面检测水印
│   └── fetchWatermarkWithRetry() - 带重试的获取
└── 主流程
    ├── startWatermarkRemoval() - 启动水印移除
    └── main() - 主函数
```

### 性能优化策略

1. **WeakSet 缓存**：使用 WeakSet 存储已处理元素，避免内存泄漏
2. **可选链操作符**：使用 `?.` 安全访问嵌套属性，减少不必要的检查
3. **空值合并运算符**：使用 `??` 提供默认值，简化代码
4. **箭头函数**：简洁的函数语法和词法 this 绑定
5. **对象展开运算符**：不可变操作，避免副作用
6. **限制轮询次数**：避免无限轮询，减少性能开销
7. **自动资源清理**：页面卸载时清理定时器和事件监听器

### 错误处理

- 所有异步操作都有 try-catch 保护
- API 请求有超时处理（10秒）
- JSON 解析错误会被捕获和记录
- Canvas 拦截错误会回退到原始实现
- 详细的错误日志便于问题排查
- 错误统计功能，便于监控脚本运行状态

### 现代JavaScript特性

- **ES6+ 语法**：使用 const/let、箭头函数、模板字符串等
- **可选链**：`?.` 操作符安全访问属性
- **空值合并**：`??` 操作符提供默认值
- **解构赋值**：简洁的对象和数组解构
- **Promise/async-await**：优雅的异步处理
- **WeakSet/WeakMap**：避免内存泄漏的弱引用集合

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

### v1.4.0 (2026-01-20)
- **架构重构**：
  - 移除所有非Canvas相关代码，专注于Canvas水印拦截和清理
  - 移除DOM遍历、CSS拦截、MutationObserver等功能
  - 简化代码结构，从1545行精简到559行
- **代码质量改进**：
  - 提取所有魔法数字到CONFIG常量，提高可维护性
  - 应用现代JavaScript特性（可选链、空值合并、箭头函数等）
  - 集中状态管理，使用state对象统一管理所有状态
  - 提取公共逻辑，减少重复代码（interceptMethod、interceptDrawImage）
  - 按功能模块化组织代码（配置、日志、工具、Canvas拦截、API请求等）
- **性能优化**：
  - 使用WeakSet存储已处理元素，自动垃圾回收
  - 使用可选链和空值合并运算符，减少不必要的null检查
  - 限制轮询次数，减少不必要的性能开销
  - 自动清理定时器和事件监听器，防止内存泄漏
- **安全改进**：
  - 使用Object.prototype.hasOwnProperty.call()替代直接调用
  - 正则表达式使用模板字符串动态构建，避免硬编码
  - 保留水印文本安全验证，防止ReDoS攻击
- **配置优化**：
  - 新增API_URL、DEFAULT_TIMEZONE等配置项
  - 新增BASE64_MATCH_MIN_LENGTH、PAGE_LOAD_RETRIES等配置项
  - 新增MAX_REPEATED_CHARS、MAX_REPEATED_SUBSTRINGS、MAX_NESTED_BRACKETS安全配置
  - 移除不再使用的配置项（MAX_DEPTH、MAX_NODES、OBSERVER_DEBOUNCE等）
- **文档更新**：
  - 更新功能特性，反映Canvas专用设计
  - 更新配置选项，移除废弃配置项
  - 更新工作原理，专注Canvas拦截和清理
  - 更新技术实现，反映新的代码架构
  - 更新版本历史，添加v1.3.9说明

### v1.3.8 (2026-01-07)
- **安全修复**：
  - 修复 XSS 安全漏洞，使用 innerHTML.replace() 处理水印文本
  - 添加水印文本长度限制（100字符）和安全验证，防止 ReDoS 攻击
  - 增强错误处理，添加 SecurityError 类型和详细错误上下文信息
- **性能优化**：
  - 优化样式缓存清理策略，减少不必要的 querySelectorAll 调用
  - 实现智能轮询机制：前3次轮询总是执行检测，后续只在有 DOM 变化时执行
  - 添加 mutationCount 全局变量，实现零开销的 DOM 变化检测
- **内存管理**：
  - 添加 globalObserver 引用和清理机制，防止内存泄漏
  - 在页面卸载时自动清理 MutationObserver
- **代码质量**：
  - 消除魔法数字，提取 HIGH_ZINDEX_THRESHOLD 和 LOW_OPACITY_THRESHOLD 到 CONFIG
  - 为关键函数添加详细的 JSDoc 注释（isLikelyWatermarkOverlay、removeWatermark）
  - 改进日志配置，支持通过 localStorage 和 URL 参数动态控制
- **Bug 修复**：
  - 修复初始加载时水印无法去除的问题
  - 修复样式缓存清理过度简化导致的检测不准确问题
- **文档更新**：
  - 更新 README，添加新配置项说明
  - 添加智能轮询时序图
  - 更新文档版本到 v1.3.8

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
