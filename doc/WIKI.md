# Xiaomi MiMo Studio 去水印脚本 - 项目WIKI

**版本**: v1.4.0 | **更新日期**: 2026-01-20 | **许可证**: MIT

---

## 📑 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [安装指南](#安装指南)
- [使用指南](#使用指南)
- [配置说明](#配置说明)
- [技术实现](#技术实现)
- [性能优化](#性能优化)
- [安全机制](#安全机制)
- [故障排除](#故障排除)
- [常见问题](#常见问题)
- [开发指南](#开发指南)
- [版本历史](#版本历史)
- [相关资源](#相关资源)

---

## 项目概述

### 项目简介

Xiaomi MiMo Studio 去水印脚本是一个专为 [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/) 平台设计的 Tampermonkey 用户脚本。该脚本能够自动检测并移除页面中的 Canvas 水印，为用户提供更清晰的浏览体验。

### 核心特性

- ✅ **动态获取水印**: 自动从 API 获取当前用户的水印内容，无需手动配置
- ✅ **Canvas 拦截**: 拦截 Canvas 绘制操作，阻止水印文本和图片的绘制
- ✅ **Canvas 清理**: 自动检测并清空覆盖大部分视口的可疑 Canvas 元素
- ✅ **实时监听**: 监听窗口 resize 事件，确保布局变化时重新检测
- ✅ **定期轮询**: 定期检测动态生成的 Canvas 水印
- ✅ **日志控制**: 可配置的日志开关，默认关闭，需要调试时可开启
- ✅ **异常处理**: 完善的错误处理和日志记录，便于问题排查
- ✅ **零依赖**: 纯原生 JavaScript 实现，无外部依赖
- ✅ **内存优化**: 使用 WeakSet 避免内存泄漏
- ✅ **现代语法**: 使用 ES6+ 特性，代码简洁高效

### 技术栈

| 技术 | 版本要求 | 用途 |
|------|---------|------|
| JavaScript | ES6+ | 核心实现语言 |
| Tampermonkey | 最新版 | 用户脚本管理器 |
| DOM API | 现代浏览器 | Canvas 元素操作 |
| Canvas API | 现代浏览器 | Canvas 拦截 |

### 项目结构

```
xiaomi_mimo/
├── xiaomi-mimo-watermark-remover.user.js  # 主脚本文件
├── README.md                               # 项目说明（中文）
├── README_en.md                            # 项目说明（英文）
├── LICENSE                                 # MIT 许可证
├── IFLOW.md                                # 项目上下文文档
├── WIKI.md                                 # 本文档 - 完整WIKI文档
└── doc/
    └── SEQUENCE_DIAGRAMS.md                # 时序图文档
```

### 版本信息

- **当前版本**: v1.4.0
- **发布日期**: 2026-01-20
- **维护者**: AlanWang
- **GitHub**: [wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover)
- **Greasy Fork**: [脚本页面](https://greasyfork.org/zh-CN/scripts/559263)

---

## 核心功能

### 功能模块

#### 1. 水印获取模块

**功能描述**: 从 MiMo API 动态获取当前用户的水印内容

**工作流程**:
1. 调用用户信息 API: `GET https://aistudio.xiaomimimo.com/open-apis/user/mi/get`
2. 自动携带用户认证信息（cookies）
3. 解析响应获取水印文本
4. 尝试 Base64 解码和 UTF-8 解码
5. 构建水印候选列表

**关键特性**:
- 自动重试机制（最多 5 次）
- 指数退避策略
- 超时保护（10 秒）
- 备选方案：从页面直接检测

**代码示例**:
```javascript
const fetchWatermark = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-timezone': browserTimeZone,
        },
        credentials: 'include',
    });

    const result = await response.json();
    state.watermarkText = result.data.watermark;
    rebuildWatermarkCandidates();
};
```

#### 2. Canvas 拦截模块

**功能描述**: 拦截 Canvas 绘制操作，阻止水印的绘制

**拦截方法**:
- `CanvasRenderingContext2D.fillText()` - 阻止文本绘制
- `CanvasRenderingContext2D.strokeText()` - 阻止描边文本绘制
- `CanvasRenderingContext2D.drawImage()` - 阻止图片绘制
- `OffscreenCanvasRenderingContext2D` - 同样支持 OffscreenCanvas

**拦截逻辑**:
1. 检查绘制内容是否包含水印文本
2. 如果包含水印，直接返回，不执行绘制
3. 如果不包含水印，执行原始绘制方法
4. 发生错误时回退到原始实现

**代码示例**:
```javascript
const interceptCanvas = () => {
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;

    Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillText', {
        value: function(...args) {
            const text = args[0];
            if (text && containsWatermark(String(text))) {
                return; // 阻止绘制
            }
            return originalFillText.apply(this, args);
        },
        writable: true,
        configurable: true,
    });
};
```

#### 3. Canvas 清理模块

**功能描述**: 定期检测并清空可疑的 Canvas 元素

**检测条件**:
- Canvas 覆盖大部分视口（>=90%）
- Canvas 使用固定定位（fixed 或 absolute）
- Canvas 设置了 `pointer-events: none`

**清理操作**:
- 使用 `clearRect()` 清空画布内容
- 隐藏 Canvas 元素（display: none）
- 使用 WeakSet 避免重复处理

**代码示例**:
```javascript
const clearSuspectedWatermarkCanvases = () => {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((canvas) => {
        if (state.processedElements.has(canvas)) return;

        const style = window.getComputedStyle(canvas);
        const positionLikely = style.position === 'fixed' || style.position === 'absolute';
        const pointerEventsNone = style.pointerEvents === 'none';

        if (coversMostViewport && (positionLikely || pointerEventsNone)) {
            const ctx2d = canvas.getContext('2d');
            ctx2d?.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
            state.processedElements.add(canvas);
        }
    });
};
```

---

## 技术架构

### 核心架构

```
├── 配置系统 (CONFIG)
│   ├── 日志配置
│   ├── API配置
│   ├── 水印文本配置
│   ├── Canvas检测配置
│   ├── 重试配置
│   ├── 轮询配置
│   ├── 页面加载配置
│   ├── 安全配置
│   └── Canvas拦截配置
├── 日志系统 (logger)
│   ├── log()
│   ├── warn()
│   ├── error()
│   ├── stat()
│   └── getStats()
├── 状态管理 (state)
│   ├── watermarkText
│   ├── watermarkCandidates
│   ├── processedElements
│   ├── pollTimer
│   └── resizeHandler
├── 工具函数
│   ├── formatErrorContext()
│   ├── containsWatermark()
│   ├── isSafeWatermarkText()
│   ├── rebuildWatermarkCandidates()
│   └── cleanup()
├── Canvas 拦截
│   ├── interceptCanvas()
│   ├── interceptMethod()
│   ├── interceptDrawImage()
│   └── OffscreenCanvas 支持
├── Canvas 清理
│   └── clearSuspectedWatermarkCanvases()
├── API 请求
│   ├── fetchWatermark()
│   ├── detectWatermarkFromPage()
│   └── fetchWatermarkWithRetry()
└── 主流程
    ├── startWatermarkRemoval()
    └── main()
```

---

## 安装指南

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

---

## 使用指南

### 基本使用

脚本安装后会自动运行，无需任何手动操作：

1. 访问 Xiaomi MiMo Studio 网站
2. 脚本自动获取水印内容
3. 脚本自动拦截 Canvas 绘制
4. 脚本自动清理可疑 Canvas 元素
5. 享受无水印的浏览体验

### 调试模式

当需要排查问题时，可以将 `ENABLE_LOG` 设置为 `true`：

```javascript
const ENABLE_LOG = true;
```

启用后，浏览器控制台（F12）会输出详细的日志信息，包括：

- 水印检测过程
- Canvas 拦截记录
- 错误和警告信息

---

## 配置说明

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

---

## 技术实现

### 核心技术

#### 1. 状态管理

使用集中式状态管理，所有状态变量存储在 `state` 对象中：

```javascript
const state = {
    watermarkText: null,
    watermarkCandidates: [],
    processedElements: new WeakSet(),
    pollTimer: null,
    resizeHandler: null,
};
```

**优势**:
- 集中管理，便于维护
- 使用 WeakSet 自动垃圾回收
- 避免全局变量污染

#### 2. Canvas 拦截

使用 `Object.defineProperty` 重写 Canvas API 原型方法：

```javascript
Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillText', {
    value: function(...args) {
        const text = args[0];
        if (text && containsWatermark(String(text))) {
            return; // 阻止绘制
        }
        return originalFillText.apply(this, args);
    },
    writable: true,
    configurable: true,
});
```

**优势**:
- 不可枚举，减少对第三方代码的影响
- 错误时回退到原始实现
- 支持 OffscreenCanvas

#### 3. 水印文本处理

支持多种编码的水印文本：

```javascript
const rebuildWatermarkCandidates = () => {
    const candidates = [state.watermarkText];

    // Base64 解码
    const decoded = atob(state.watermarkText);
    candidates.push(decoded);

    // UTF-8 解码
    const bytes = new Uint8Array(decoded.length);
    const utf8 = new TextDecoder('utf-8').decode(bytes);
    candidates.push(utf8);

    state.watermarkCandidates = Array.from(new Set(candidates));
};
```

**优势**:
- 支持多种编码格式
- 使用 Set 去重
- 提高匹配成功率

---

## 性能优化

### 优化策略

1. **WeakSet 缓存**：使用 WeakSet 存储已处理元素，避免内存泄漏
2. **可选链操作符**：使用 `?.` 安全访问嵌套属性，减少不必要的检查
3. **空值合并运算符**：使用 `??` 提供默认值，简化代码
4. **箭头函数**：简洁的函数语法和词法 this 绑定
5. **对象展开运算符**：不可变操作，避免副作用
6. **限制轮询次数**：避免无限轮询，减少性能开销
7. **自动资源清理**：页面卸载时清理定时器和事件监听器

### 性能指标

| 指标 | 值 | 说明 |
|--------|------|------|
| 脚本大小 | ~16KB | 精简后的代码体积 |
| 初始化时间 | <100ms | 脚本启动时间 |
| 轮询次数 | 20次 | 最大轮询次数 |
| 轮询间隔 | 500ms | 轮询检测间隔 |
| 内存占用 | <1MB | 使用 WeakSet 优化 |

---

## 安全机制

### 输入验证

所有输入都经过严格验证：

```javascript
const isSafeWatermarkText = (text) => {
    if (!text || typeof text !== 'string') return false;
    if (text.length === 0 || text.length > CONFIG.MAX_WATERMARK_LENGTH) return false;

    const dangerousPatterns = [
        new RegExp(`(.+)\\1{${CONFIG.MAX_REPEATED_CHARS},}`),
        new RegExp(`(.+?)(\\1+){${CONFIG.MAX_REPEATED_SUBSTRINGS},}`),
        new RegExp(`[\\(\\)\\[\\]\\{\\}]{${CONFIG.MAX_NESTED_BRACKETS},}`),
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(text));
};
```

### 安全特性

- **ReDoS 防护**：防止正则表达式拒绝服务攻击
- **长度限制**：限制水印文本最大长度
- **模式检测**：检测危险的正则表达式模式
- **错误隔离**：所有错误都有 try-catch 保护

---

## 故障排除

### 启用调试模式

1. 编辑脚本，将 `ENABLE_LOG` 改为 `true`
2. 打开浏览器控制台（F12 -> Console）
3. 刷新页面，查看日志输出

### 查看脚本是否运行

在控制台中输入：
```javascript
console.log('脚本状态:', typeof state.watermarkText !== 'undefined' ? '已运行' : '未运行');
```

### 检查水印内容

```javascript
// 在控制台中执行
console.log('当前水印内容:', state.watermarkText);
console.log('水印候选列表:', state.watermarkCandidates);
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

---

## 常见问题

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

---

## 开发指南

### 代码规范

- 使用 ES6+ 语法
- 使用 const/let 替代 var
- 使用箭头函数
- 使用模板字符串
- 使用可选链和空值合并运算符
- 遵循函数式编程原则

### 提交规范

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

---

## 版本历史

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
  - 更新版本历史，添加v1.4.0说明

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

---

## 相关资源

- [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)
- [Tampermonkey 官网](https://www.tampermonkey.net/)
- [Greasy Fork 脚本页面](https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0)
- [GitHub 项目地址](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover)
- [问题反馈](https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues)
- [时序图文档](./SEQUENCE_DIAGRAMS.md)

---

**感谢您的使用！** 如果这个脚本对您有帮助，请给个项目 Star 支持一下。
