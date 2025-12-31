# Xiaomi MiMo Studio 去水印脚本

## 📑 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [核心模块](#核心模块)
- [开发指南](#开发指南)
- [当前版本](#当前版本)
- [相关链接](#相关链接)

---

## 项目概述

**版本**: v1.3.5 | **语言**: JavaScript (ES6+) | **许可证**: MIT

自动检测并移除 Xiaomi MiMo Studio 页面水印的 Tampermonkey 脚本。

### 项目简介

Xiaomi MiMo Studio 去水印脚本是一个专为 [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/) 平台设计的 Tampermonkey 用户脚本。该脚本能够自动检测并移除页面中的各种形式水印，为用户提供更清晰的浏览体验。

### 主要功能

- 动态获取用户水印内容（通过 API）
- 支持多种水印形式（文本、图片、Canvas、CSS）
- 实时监听 DOM 变化，自动移除动态水印
- 性能优化，CPU 占用低
- 零依赖，纯原生 JavaScript 实现

---

## 核心特性

- ✅ **动态获取水印**: 自动从 API 获取当前用户的水印内容，无需手动配置
- ✅ **多种检测方式**: 支持文本、图片、Canvas、CSS 等多种水印形式的检测和移除
- ✅ **实时监听**: 使用 MutationObserver 监听 DOM 变化，自动检测并移除动态添加的水印
- ✅ **性能优化**: 防抖机制、元素缓存、检测深度限制等优化措施
- ✅ **日志控制**: 可配置的日志开关，默认关闭，需要调试时可开启
- ✅ **异常处理**: 完善的错误处理和日志记录，便于问题排查
- ✅ **零依赖**: 纯原生 JavaScript 实现，无外部依赖
- ✅ **内存优化**: 使用 WeakSet 和 WeakMap 避免内存泄漏

---

## 项目结构

```
xiaomi_mimo/
├── xiaomi-mimo-watermark-remover.user.js  # 主脚本文件
├── README.md                               # 项目说明（英文）
├── README_zh.md                            # 项目说明（中文）
├── README_en.md                            # 项目说明（英文）
├── LICENSE                                 # MIT 许可证
├── IFLOW.md                                # 项目上下文文档（本文件）
├── WIKI.md                                 # 完整 WIKI 文档
└── doc/
    └── SEQUENCE_DIAGRAMS.md                # 时序图文档
```

### 文件说明

| 文件 | 说明 |
|------|------|
| `xiaomi-mimo-watermark-remover.user.js` | 主脚本文件，包含所有核心功能 |
| `README_zh.md` | 中文版 README，包含项目介绍、安装方法、使用说明等 |
| `README_en.md` | 英文版 README |
| `IFLOW.md` | 项目上下文文档，用于 iFlow CLI |
| `WIKI.md` | 完整的 WIKI 文档，包含详细的技术文档 |
| `doc/SEQUENCE_DIAGRAMS.md` | 时序图文档，展示各组件之间的交互 |
| `LICENSE` | MIT 许可证 |

---

## 技术栈

| 技术 | 版本要求 | 用途 |
|------|---------|------|
| JavaScript | ES6+ | 核心实现语言 |
| Tampermonkey | 最新版 | 用户脚本管理器 |
| DOM API | 现代浏览器 | DOM 操作 |
| Canvas API | 现代浏览器 | Canvas 拦截 |
| MutationObserver | 现代浏览器 | DOM 变化监听 |

---

## 核心模块

### 1. 水印获取模块
- API 请求（GET /open-apis/user/mi/get）
- 自动重试机制
- Base64/UTF-8 解码
- 构建水印候选列表

### 2. 水印检测模块
- 文本检测（textContent、innerText、innerHTML）
- 图片检测（src、background-image）
- Canvas 拦截（fillText、strokeText、drawImage）
- CSS 样式检测（覆盖层、固定定位、pointer-events）

### 3. 水印移除模块
- DOM 元素移除
- Canvas 清空
- 样式修改（隐藏、透明度、背景清除）

### 4. DOM 监听模块
- MutationObserver 局部扫描
- 防抖机制
- 样式缓存管理

### 5. Canvas 拦截模块
- 拦截 CanvasRenderingContext2D 方法
- 拦截 OffscreenCanvasRenderingContext2D 方法
- 阻止包含水印的绘制操作

### 6. 日志系统模块
- 可配置日志开关（ENABLE_LOG）
- 多级别日志（log、warn、error）
- 错误统计功能

### 7. 样式缓存模块
- WeakMap 缓存 getComputedStyle 结果
- 避免频繁调用计算样式
- 自动垃圾回收

### 8. 配置管理模块
- 集中的 CONFIG 对象
- DOM 遍历配置
- 轮询配置
- 重试配置
- 超时配置
- 防抖配置

---

## 开发指南

### 配置

修改脚本开头的配置项：

```javascript
// 日志开关
const ENABLE_LOG = false;

// 配置对象
const CONFIG = {
    MAX_DEPTH: 12,              // 最大遍历深度
    MAX_NODES: 10000,           // 最大处理节点数
    MAX_POLL_COUNT: 20,         // 最大轮询次数
    POLL_INTERVAL: 500,         // 轮询间隔（毫秒）
    MAX_RETRIES: 5,             // API 请求最大重试次数
    RETRY_DELAY: 1000,          // 初始重试延迟（毫秒）
    FETCH_TIMEOUT: 10000,       // API 请求超时（毫秒）
    REGEX_TIMEOUT: 100,         // 正则替换超时（毫秒）
    OBSERVER_DEBOUNCE: 50,      // MutationObserver 防抖延迟
    RESIZE_DEBOUNCE: 300,       // resize 事件防抖延迟
};
```

### 调试

1. 将 `ENABLE_LOG` 设置为 `true`
2. 打开浏览器控制台（F12）
3. 刷新页面
4. 查看日志输出

### 测试

访问测试网站：https://aistudio.xiaomimico.com/

### 文档

详细文档请参考：
- [README_zh.md](README_zh.md) - 项目说明文档
- [WIKI.md](WIKI.md) - 完整技术文档
- [doc/SEQUENCE_DIAGRAMS.md](doc/SEQUENCE_DIAGRAMS.md) - 时序图文档

---

## 当前版本

**v1.3.5** (2025-12-30)

### 更新内容

**安全修复**:
- 修复内存泄漏风险，添加定时器和事件监听器的清理机制
- 修复原型链污染风险，使用 Object.defineProperty 减少对第三方代码的影响
- 修复递归深度问题，将递归改为迭代，添加节点数量限制

**性能优化**:
- 添加样式缓存机制，减少 getComputedStyle 调用

**安全修复**:
- 修复正则表达式拒绝服务风险，添加安全验证和超时保护

**代码改进**:
- 添加配置常量对象，集中管理所有配置参数
- 增强网络错误处理和 API 响应验证

**边界条件**:
- 改进视口尺寸为 0 时的处理
- 正确处理 zIndex 为 'auto' 的情况

**输入验证**:
- 为关键函数添加输入验证，防止无效输入导致的问题

---

## 相关链接

- **GitHub 仓库**: https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover
- **Greasy Fork**: https://greasyfork.org/zh-CN/scripts/559263-xiaomi-mimo-studio-%E5%8E%BB%E6%B0%B4%E5%8D%B0
- **OpenUserJS**: https://openuserjs.org/scripts/AlanWang/Xiaomi_MiMo_Studio_%E5%8E%BB%E6%B0%B4%E5%8D%B0
- **问题反馈**: https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues
- **讨论区**: https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/discussions
- **Xiaomi MiMo Studio**: https://aistudio.xiaomimimo.com/
- **Tampermonkey 官网**: https://www.tampermonkey.net/

---

**最后更新**: 2025-12-30 | **维护者**: AlanWang