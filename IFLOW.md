# Xiaomi MiMo Studio 去水印脚本

## 项目概述
**版本**: v1.3.5 | **语言**: JavaScript (ES6+) | **许可证**: MIT

自动检测并移除 Xiaomi MiMo Studio 页面水印的 Tampermonkey 脚本。

## 核心特性
- 动态获取水印（API + 重试机制）
- 多种检测方式（文本、图片、Canvas、CSS）
- 实时 DOM 监听（MutationObserver）
- 性能优化（防抖、WeakSet 缓存、深度限制、样式缓存）
- 零依赖，纯原生 JS

## 项目结构
```
xiaomi_mimo/
├── xiaomi-mimo-watermark-remover.user.js  # 主脚本
├── README.md/README_zh.md                 # 说明文档
├── SEQUENCE_DIAGRAMS.md                   # 时序图
└── LICENSE                                # MIT 许可证
```

## 技术栈
JavaScript ES6+、Tampermonkey、DOM API、Canvas API、MutationObserver

## 核心模块
1. **水印获取**: API 请求 + 重试 + Base64/UTF-8 解码
2. **水印检测**: 文本、图片、Canvas、覆盖层检测
3. **水印移除**: DOM 元素移除、Canvas 清空
4. **DOM 监听**: MutationObserver 局部扫描
5. **Canvas 拦截**: fillText/strokeText/drawImage
6. **日志系统**: 可配置开关（ENABLE_LOG）
7. **样式缓存**: WeakMap 缓存 getComputedStyle 结果
8. **配置管理**: 集中的 CONFIG 对象

## 开发指南
- **配置**: 修改脚本开头的 `ENABLE_LOG` 和 `CONFIG` 对象
- **调试**: F12 控制台查看日志
- **测试**: 访问 https://aistudio.xiaomimico.com/

## 当前版本
v1.3.5 (2025-12-30) - 安全修复、性能优化、代码改进

## 相关链接
- GitHub: https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover
- Greasy Fork: https://greasyfork.org/zh-CN/scripts/559263
- 问题反馈: https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues

---
**更新**: 2025-12-30 | **维护者**: AlanWang