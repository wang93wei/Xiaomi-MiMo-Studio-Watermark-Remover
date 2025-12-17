# Xiaomi MiMo Studio 去水印脚本

**中文** | [English](README_en.md)

---

一个用于自动检测并移除 Xiaomi MiMo Studio (https://aistudio.xiaomimimo.com/) 页面中水印的 Tampermonkey 用户脚本。

## 功能特性

- ✅ **动态获取水印**：自动从 API 获取当前用户的水印内容，无需手动配置
- ✅ **多种检测方式**：支持文本、图片、Canvas、CSS 等多种水印形式的检测和移除
- ✅ **实时监听**：使用 MutationObserver 监听 DOM 变化，自动检测并移除动态添加的水印
- ✅ **性能优化**：防抖机制、元素缓存、检测深度限制等优化措施
- ✅ **日志控制**：可配置的日志开关，默认关闭，需要调试时可开启

## 安装方法

### 1. 安装 Tampermonkey

- **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**: [App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. 安装脚本

1. 打开 Tampermonkey 管理面板
2. 点击"创建新脚本"
3. 将 `xiaomi-mimo-watermark-remover.user.js` 文件的内容复制到编辑器中
4. 保存脚本（Ctrl+S 或 Cmd+S）
5. 确保脚本已启用

### 3. 使用

访问 [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)，脚本会自动运行并移除页面中的水印。

## 配置选项

脚本支持以下配置选项（在脚本开头修改）：

```javascript
// 日志开关（设置为 true 启用日志，false 关闭日志）
const ENABLE_LOG = false;
```

- **ENABLE_LOG**: 控制是否输出调试日志
  - `false`（默认）：不输出日志，静默运行
  - `true`：在浏览器控制台输出详细日志，便于调试

## 工作原理

1. **获取水印内容**：脚本启动时自动调用 API `https://aistudio.xiaomimimo.com/open-apis/user/mi/get` 获取当前用户的水印内容
2. **检测水印**：通过多种方式检测页面中的水印：
   - 文本内容检测（textContent、innerText、innerHTML）
   - 图片检测（img src、CSS background-image）
   - Canvas 绘制拦截
   - CSS 样式拦截
3. **移除水印**：根据检测到的水印类型，执行相应的移除操作
4. **动态监听**：使用 MutationObserver 监听 DOM 变化，确保动态添加的水印也能被移除

## 技术实现

- **API 请求**：使用 `fetch` API 获取用户信息和水印内容
- **DOM 监听**：使用 `MutationObserver` 监听页面变化
- **Canvas 拦截**：拦截 `CanvasRenderingContext2D` 的绘制方法
- **性能优化**：防抖、WeakSet 缓存、检测深度限制

## 兼容性

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ 其他支持 Tampermonkey 的浏览器

## 版本历史

### v1.2.0
- 添加全局日志开关，默认关闭
- 统一日志输出格式

### v1.1.0
- 添加动态获取水印功能
- 添加重试机制和页面检测备选方案
- 改进错误处理和日志输出

### v1.0.0
- 初始版本
- 支持多种水印形式的检测和移除

## 注意事项

- 本脚本仅用于学习和研究目的
- 使用前请确保遵守相关网站的使用条款
- 脚本会自动获取当前登录用户的水印内容，无需手动配置

## 许可证

MIT License

Copyright (c) 2025 AlanWang

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Xiaomi MiMo Studio](https://aistudio.xiaomimimo.com/)
- [Tampermonkey 官网](https://www.tampermonkey.net/)
