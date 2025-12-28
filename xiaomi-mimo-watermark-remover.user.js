// ==UserScript==
// @name         Xiaomi MiMo Studio 去水印
// @namespace    https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover
// @version      1.3.4
// @description  自动检测并移除 Xiaomi MiMo Studio 页面中的水印内容（动态获取水印）
// @author       AlanWang
// @license      MIT
// @homepageURL  https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover
// @supportURL   https://github.com/wang93wei/Xiaomi-MiMo-Studio-Watermark-Remover/issues
// @match        https://aistudio.xiaomimimo.com/*
// @match        https://aistudio.xiaomimimo.com/#/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ========== 配置选项 ==========
    // 日志开关（设置为 true 启用日志，false 关闭日志）
    const ENABLE_LOG = false;

    // 错误统计
    const errorStats = {
        fetchErrors: 0,
        domErrors: 0,
        canvasErrors: 0,
        styleErrors: 0
    };

    // ========== 日志函数 ==========
    const logger = {
        log: (...args) => {
            if (ENABLE_LOG) {
                console.log('[去水印脚本]', ...args);
            }
        },
        warn: (...args) => {
            if (ENABLE_LOG) {
                console.warn('[去水印脚本]', ...args);
            }
        },
        error: (...args) => {
            // 错误信息始终输出，即使日志关闭
            console.error('[去水印脚本]', ...args);
        },
        stat: (type) => {
            if (errorStats.hasOwnProperty(type)) {
                errorStats[type]++;
            }
        },
        getStats: () => {
            return { ...errorStats };
        }
    };

    // 水印内容（将从 API 动态获取）
    let WATERMARK_TEXT = null;
    let WATERMARK_TEXT_CANDIDATES = [];
    
    // API 端点
    const USER_API_URL = 'https://aistudio.xiaomimimo.com/open-apis/user/mi/get';
    
    // 已处理的元素缓存，避免重复处理
    const processedElements = new WeakSet();
    
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 检查文本内容是否包含水印
    function containsWatermark(text) {
        if (!text || typeof text !== 'string') return false;
        if (!Array.isArray(WATERMARK_TEXT_CANDIDATES) || WATERMARK_TEXT_CANDIDATES.length === 0) return false;
        return WATERMARK_TEXT_CANDIDATES.some((candidate) => candidate && text.includes(candidate));
    }

    function rebuildWatermarkCandidates() {
        const candidates = [];
        if (WATERMARK_TEXT && typeof WATERMARK_TEXT === 'string') {
            candidates.push(WATERMARK_TEXT);

            try {
                // 尝试 Base64 解码
                const decoded = atob(WATERMARK_TEXT);
                if (decoded && typeof decoded === 'string') {
                    candidates.push(decoded);

                    // 尝试 UTF-8 解码（处理多字节字符）
                    try {
                        const bytes = new Uint8Array(decoded.length);
                        for (let i = 0; i < decoded.length; i++) {
                            bytes[i] = decoded.charCodeAt(i);
                        }
                        const utf8 = new TextDecoder('utf-8').decode(bytes);
                        if (utf8 && typeof utf8 === 'string' && utf8 !== decoded) {
                            candidates.push(utf8);
                        }
                    } catch (_) {
                        // UTF-8 解码失败，忽略
                    }
                }
            } catch (_) {
                // Base64 解码失败，忽略
            }
        }

        WATERMARK_TEXT_CANDIDATES = Array.from(new Set(candidates.filter(Boolean)));
        logger.log('水印匹配候选:', WATERMARK_TEXT_CANDIDATES);
    }

    function isLikelyWatermarkOverlay(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
        const tag = element.tagName;

        // 快速检查：只处理 Canvas 或常见容器元素
        const isCanvas = tag === 'CANVAS';
        const isDivLike = tag === 'DIV' || tag === 'SECTION' || tag === 'MAIN' || tag === 'ASIDE';
        if (!(isCanvas || isDivLike)) return false;

        // 快速检查：内联样式（避免昂贵的 getComputedStyle）
        if (element.style) {
            // 如果内联样式明确设置了 pointer-events 为 auto，则不是水印覆盖层
            if (element.style.pointerEvents === 'auto') return false;
        }

        let style;
        try {
            style = window.getComputedStyle(element);
        } catch (e) {
            logger.warn('获取元素样式失败:', e);
            logger.stat('domErrors');
            return false;
        }
        if (!style) return false;

        const pointerEventsNone = style.pointerEvents === 'none';
        const positionLikely = style.position === 'fixed' || style.position === 'absolute';
        const zIndex = Number(style.zIndex);
        const zIndexLikely = Number.isFinite(zIndex) ? zIndex >= 100 : false;

        const bgImage = style.backgroundImage;
        const hasBgImage = bgImage && bgImage !== 'none';
        const opacity = Number(style.opacity);
        const opacityLikely = Number.isFinite(opacity) ? opacity < 1 : false;

        let rect;
        try {
            rect = element.getBoundingClientRect();
        } catch (e) {
            logger.warn('获取元素尺寸失败:', e);
            logger.stat('domErrors');
            return false;
        }
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        const coversMostViewport = vw > 0 && vh > 0 && rect.width >= vw * 0.9 && rect.height >= vh * 0.9;

        if (!coversMostViewport) return false;
        if (!pointerEventsNone) return false;
        if (!(hasBgImage || isCanvas)) return false;
        if (!(zIndexLikely || opacityLikely || positionLikely)) return false;

        return true;
    }

    function hideOverlayElement(element) {
        if (!element || processedElements.has(element)) return;
        try {
            if (element.style) {
                element.style.backgroundImage = 'none';
                element.style.background = 'none';
                element.style.opacity = '0';
                element.style.visibility = 'hidden';
                element.style.display = 'none';
            }
            processedElements.add(element);
        } catch (e) {
            logger.warn('隐藏元素时出错:', e);
        }
    }

    // 统一的水印检测和移除函数
    function detectAndRemoveWatermarks(root = document.body) {
        if (!root) return;

        const maxDepth = 12;

        function traverse(node, depth) {
            if (!node || depth > maxDepth) return;

            try {
                // 处理元素节点
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 如果该节点已经处理过则直接跳过
                    if (processedElements.has(node)) return;

                    // 优先检测并隐藏水印覆盖层
                    if (isLikelyWatermarkOverlay(node)) {
                        hideOverlayElement(node);
                        return;
                    }

                    // 检查当前节点是否包含水印文本或图片
                    if (WATERMARK_TEXT && (elementContainsWatermark(node) || imageContainsWatermark(node))) {
                        removeWatermark(node);
                        return;
                    }
                }

                // 遍历子节点
                if (node.childNodes && node.childNodes.length) {
                    for (let child of node.childNodes) {
                        if (child.nodeType === Node.TEXT_NODE) {
                            // 检查并移除文本节点中的水印
                            const textContent = child.textContent || '';
                            if (WATERMARK_TEXT && containsWatermark(textContent)) {
                                child.remove();
                            }
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            traverse(child, depth + 1);
                        }
                    }
                }

                // 处理 Shadow Root
                if (node.nodeType === Node.ELEMENT_NODE && node.shadowRoot) {
                    traverse(node.shadowRoot, depth + 1);
                }
                // 处理 Document Fragment
                if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && node.childNodes && node.childNodes.length) {
                    for (let child of node.childNodes) {
                        if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                            traverse(child, depth + 1);
                        }
                    }
                }
            } catch (e) {
                logger.warn('检测水印时出错:', e);
            }
        }

        traverse(root, 0);
    }

    // 检查元素是否包含水印文本
    function elementContainsWatermark(element) {
        if (!element || processedElements.has(element)) return false;
        
        // 检查 textContent
        if (containsWatermark(element.textContent)) return true;
        
        // 检查 innerText
        if (containsWatermark(element.innerText)) return true;
        
        // 检查 innerHTML
        if (containsWatermark(element.innerHTML)) return true;
        
        // 检查 value 属性（用于 input、textarea 等）
        if (element.value && containsWatermark(element.value)) return true;
        
        // 检查所有属性值
        if (element.attributes) {
            for (let attr of element.attributes) {
                if (containsWatermark(attr.value)) return true;
            }
        }
        
        return false;
    }

    // 检查图片是否包含水印
    function imageContainsWatermark(element) {
        if (!element) return false;
        
        // 检查 img src
        if (element.tagName === 'IMG' && element.src) {
            if (containsWatermark(element.src)) return true;
        }
        
        // 检查背景图片
        const style = window.getComputedStyle(element);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none' && containsWatermark(bgImage)) {
            return true;
        }
        
        // 检查内联样式
        if (element.style && element.style.backgroundImage) {
            if (containsWatermark(element.style.backgroundImage)) return true;
        }
        
        return false;
    }

    // 移除水印元素
    function removeWatermark(element) {
        if (!element || processedElements.has(element)) return;

        try {
            // 标记为已处理
            processedElements.add(element);

            // 如果是图片水印，尝试清除背景或移除元素
            if (imageContainsWatermark(element)) {
                // 尝试清除背景图片
                if (element.style) {
                    element.style.backgroundImage = 'none';
                    element.style.background = 'none';
                }
                // 如果是 img 标签，隐藏或移除
                if (element.tagName === 'IMG') {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.remove();
                    return;
                }
            }

            // 检查是否是文本水印
            if (elementContainsWatermark(element)) {
                // 如果元素只包含水印文本，直接移除
                const text = element.textContent || element.innerText || '';
                if (WATERMARK_TEXT && (text.trim() === WATERMARK_TEXT || text.includes(WATERMARK_TEXT))) {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.remove();
                    return;
                }

                // 如果元素包含其他内容，尝试移除水印文本部分
                // 使用更安全的正则表达式转义
                if (WATERMARK_TEXT && WATERMARK_TEXT.length < 1000) {
                    try {
                        const escapedWatermark = WATERMARK_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const watermarkRegex = new RegExp(escapedWatermark, 'g');

                        if (element.textContent) {
                            element.textContent = element.textContent.replace(watermarkRegex, '');
                        }
                        if (element.innerText) {
                            element.innerText = element.innerText.replace(watermarkRegex, '');
                        }
                        if (element.innerHTML) {
                            element.innerHTML = element.innerHTML.replace(watermarkRegex, '');
                        }
                    } catch (e) {
                        logger.warn('正则表达式替换失败:', e);
                    }
                }

                // 如果移除文本后元素为空，则移除元素
                if (!element.textContent || element.textContent.trim() === '') {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.remove();
                }
            }
        } catch (e) {
            logger.warn('移除水印时出错:', e);
        }
    }

    // 初始化检测
    function init() {
        // 等待 DOM 加载完成
        if (document.body) {
            detectAndRemoveWatermarks();
        } else {
            // 如果 body 还未加载，等待 DOMContentLoaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    detectAndRemoveWatermarks();
                });
            }
        }
    }

    // 创建 MutationObserver 监听 DOM 变化（仅处理发生变化的局部节点，降低 CPU 占用）
    function setupObserver() {
        const scheduleLocalScan = debounce((nodes) => {
            try {
                nodes.forEach((node) => {
                    if (!node) return;
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                        detectAndRemoveWatermarks(node);
                    }
                });
            } catch (e) {
                logger.warn('局部扫描时出错:', e);
            }
        }, 50);

        const observer = new MutationObserver((mutations) => {
            const nodesToScan = [];
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => nodesToScan.push(node));
                }

                if (mutation.type === 'attributes') {
                    const attrName = mutation.attributeName;
                    // 监听 style、src、class 属性变化
                    if (attrName === 'style' || attrName === 'src' || attrName === 'class') {
                        if (mutation.target) nodesToScan.push(mutation.target);
                    }
                }
            });

            if (nodesToScan.length > 0) scheduleLocalScan(nodesToScan);
        });

        // 配置观察选项
        const config = {
            childList: true,      // 监听子节点的添加和删除
            subtree: true,         // 监听所有后代节点
            attributes: true,     // 监听属性变化
            attributeFilter: ['style', 'src', 'class'] // 只监听特定属性
        };

        // 开始观察
        if (document.body) {
            observer.observe(document.body, config);
        } else {
            // 等待 body 加载后再开始观察
            const bodyObserver = new MutationObserver((mutations, obs) => {
                if (document.body) {
                    observer.observe(document.body, config);
                    obs.disconnect();
                }
            });
            bodyObserver.observe(document.documentElement, { childList: true });
        }
    }

    // Canvas 水印检测（拦截 Canvas 绘制操作）
    function interceptCanvas() {
        // 添加标记，避免重复修改原型
        if (CanvasRenderingContext2D.prototype._watermarkIntercepted) {
            logger.log('Canvas 拦截器已安装，跳过重复安装');
            return;
        }

        try {
            const originalFillText = CanvasRenderingContext2D.prototype.fillText;
            const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
            const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;

            CanvasRenderingContext2D.prototype.fillText = function(...args) {
                try {
                    const text = args[0];
                    if (text && containsWatermark(String(text))) {
                        return; // 不绘制包含水印的文本
                    }
                    return originalFillText.apply(this, args);
                } catch (e) {
                    // 发生错误时回退到原始实现
                    logger.warn('fillText 拦截出错，使用原始实现:', e);
                    logger.stat('canvasErrors');
                    return originalFillText.apply(this, args);
                }
            };

            CanvasRenderingContext2D.prototype.strokeText = function(...args) {
                try {
                    const text = args[0];
                    if (text && containsWatermark(String(text))) {
                        return; // 不绘制包含水印的文本
                    }
                    return originalStrokeText.apply(this, args);
                } catch (e) {
                    logger.warn('strokeText 拦截出错，使用原始实现:', e);
                    logger.stat('canvasErrors');
                    return originalStrokeText.apply(this, args);
                }
            };

            CanvasRenderingContext2D.prototype.drawImage = function(...args) {
                try {
                    // 检查图片源是否包含水印
                    const image = args[0];
                    if (image && image.src && containsWatermark(image.src)) {
                        return; // 不绘制包含水印的图片
                    }
                    return originalDrawImage.apply(this, args);
                } catch (e) {
                    logger.warn('drawImage 拦截出错，使用原始实现:', e);
                    logger.stat('canvasErrors');
                    return originalDrawImage.apply(this, args);
                }
            };

            // 标记已拦截
            CanvasRenderingContext2D.prototype._watermarkIntercepted = true;
        } catch (e) {
            logger.error('拦截 CanvasRenderingContext2D 失败:', e);
            logger.stat('canvasErrors');
        }

        try {
            if (typeof OffscreenCanvasRenderingContext2D !== 'undefined' &&
                !OffscreenCanvasRenderingContext2D.prototype._watermarkIntercepted) {
                const offscreenOriginalFillText = OffscreenCanvasRenderingContext2D.prototype.fillText;
                const offscreenOriginalStrokeText = OffscreenCanvasRenderingContext2D.prototype.strokeText;
                const offscreenOriginalDrawImage = OffscreenCanvasRenderingContext2D.prototype.drawImage;

                OffscreenCanvasRenderingContext2D.prototype.fillText = function(...args) {
                    try {
                        const text = args[0];
                        if (text && containsWatermark(String(text))) return;
                        return offscreenOriginalFillText.apply(this, args);
                    } catch (e) {
                        logger.warn('OffscreenCanvas fillText 拦截出错，使用原始实现:', e);
                        logger.stat('canvasErrors');
                        return offscreenOriginalFillText.apply(this, args);
                    }
                };

                OffscreenCanvasRenderingContext2D.prototype.strokeText = function(...args) {
                    try {
                        const text = args[0];
                        if (text && containsWatermark(String(text))) return;
                        return offscreenOriginalStrokeText.apply(this, args);
                    } catch (e) {
                        logger.warn('OffscreenCanvas strokeText 拦截出错，使用原始实现:', e);
                        logger.stat('canvasErrors');
                        return offscreenOriginalStrokeText.apply(this, args);
                    }
                };

                OffscreenCanvasRenderingContext2D.prototype.drawImage = function(...args) {
                    try {
                        const image = args[0];
                        if (image && image.src && containsWatermark(image.src)) return;
                        return offscreenOriginalDrawImage.apply(this, args);
                    } catch (e) {
                        logger.warn('OffscreenCanvas drawImage 拦截出错，使用原始实现:', e);
                        logger.stat('canvasErrors');
                        return offscreenOriginalDrawImage.apply(this, args);
                    }
                };

                // 标记已拦截
                OffscreenCanvasRenderingContext2D.prototype._watermarkIntercepted = true;
            }
        } catch (e) {
            logger.warn('拦截 OffscreenCanvas 失败:', e);
            logger.stat('canvasErrors');
        }
    }

    function clearLikelyWatermarkCanvases() {
        const canvases = document.querySelectorAll('canvas');
        if (!canvases || canvases.length === 0) return;

        canvases.forEach((canvas) => {
            if (!canvas || processedElements.has(canvas)) return;

            try {
                const style = window.getComputedStyle(canvas);
                const positionLikely = style.position === 'fixed' || style.position === 'absolute';
                const pointerEventsNone = style.pointerEvents === 'none';

                const rect = canvas.getBoundingClientRect();
                const vw = window.innerWidth || 0;
                const vh = window.innerHeight || 0;
                const coversMostViewport = vw > 0 && vh > 0 && rect.width >= vw * 0.9 && rect.height >= vh * 0.9;

                if (coversMostViewport && (positionLikely || pointerEventsNone)) {
                    const ctx2d = canvas.getContext('2d');
                    if (ctx2d) {
                        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    hideOverlayElement(canvas);
                }
            } catch (e) {
                logger.warn('清理Canvas水印时出错:', e);
            }
        });
    }

    function forceRepaint() {
        try {
            const el = document.documentElement;
            if (!el) return;

            const prevTransform = el.style.transform;
            el.style.transform = prevTransform ? prevTransform + ' translateZ(0)' : 'translateZ(0)';
            void el.offsetHeight;
            el.style.transform = prevTransform;

            window.dispatchEvent(new Event('resize'));
        } catch (e) {
            logger.warn('强制重绘时出错:', e);
        }
    }

    // 拦截 CSS 样式（检查伪元素）
    function interceptStyles() {
        // 添加标记，避免重复修改原型
        if (CSSStyleSheet.prototype._watermarkIntercepted) {
            logger.log('CSS 拦截器已安装，跳过重复安装');
            return;
        }

        try {
            // 拦截 styleSheet 的插入
            const originalInsertRule = CSSStyleSheet.prototype.insertRule;
            CSSStyleSheet.prototype.insertRule = function(rule, index) {
                try {
                    if (rule && WATERMARK_TEXT && containsWatermark(rule)) {
                        return -1; // 不插入包含水印的规则
                    }
                    return originalInsertRule.call(this, rule, index);
                } catch (e) {
                    logger.warn('insertRule 拦截出错，使用原始实现:', e);
                    logger.stat('styleErrors');
                    return originalInsertRule.call(this, rule, index);
                }
            };

            // 标记已拦截
            CSSStyleSheet.prototype._watermarkIntercepted = true;
        } catch (e) {
            logger.error('拦截 CSSStyleSheet 失败:', e);
            logger.stat('styleErrors');
        }

        try {
            // 拦截 style 元素的文本内容
            const originalAppendChild = Node.prototype.appendChild;
            Node.prototype.appendChild = function(child) {
                try {
                    if (child && child.tagName === 'STYLE' && WATERMARK_TEXT) {
                        if (child.textContent && containsWatermark(child.textContent)) {
                            // 添加长度限制，避免处理过长的水印文本
                            if (WATERMARK_TEXT.length < 1000) {
                                const escapedWatermark = WATERMARK_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const watermarkRegex = new RegExp(escapedWatermark, 'g');
                                child.textContent = child.textContent.replace(watermarkRegex, '');
                            }
                        }
                    }
                    return originalAppendChild.call(this, child);
                } catch (e) {
                    logger.warn('appendChild 拦截出错，使用原始实现:', e);
                    logger.stat('styleErrors');
                    return originalAppendChild.call(this, child);
                }
            };

            // 标记已拦截
            Node.prototype._watermarkIntercepted = true;
        } catch (e) {
            logger.error('拦截 Node.appendChild 失败:', e);
            logger.stat('styleErrors');
        }
    }

    // 从 API 获取用户信息和水印内容
    async function fetchWatermark() {
        try {
            logger.log('开始获取水印内容...');
            const browserTimeZone = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
                ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai')
                : 'Asia/Shanghai';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let response;
            try {
                response = await fetch(USER_API_URL, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'system',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'dnt': '1',
                        'pragma': 'no-cache',
                        'referer': 'https://aistudio.xiaomimimo.com/',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'x-timezone': browserTimeZone,
                    },
                    credentials: 'include',
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                const responseText = await response.text().catch(() => '无法获取响应内容');
                logger.error('解析 API 响应失败:', jsonError, '响应内容:', responseText);
                logger.stat('fetchErrors');
                return false;
            }
            logger.log('API 响应:', result);

            if (result.code === 0 && result.data && result.data.watermark) {
                WATERMARK_TEXT = result.data.watermark;
                rebuildWatermarkCandidates();
                logger.log('成功获取水印内容:', WATERMARK_TEXT);
                return true;
            } else {
                logger.warn('API 响应中未找到水印内容:', result);
                return false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.error('获取水印请求超时');
            } else {
                logger.error('获取水印内容失败:', error);
            }
            logger.stat('fetchErrors');
            return false;
        }
    }

    // 从页面中检测水印（备选方案）
    function detectWatermarkFromPage() {
        try {
            if (WATERMARK_TEXT) return true;
            
            logger.log('尝试从页面中检测水印...');
            
            if (!document.body) return false;
            
            const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
            const allText = document.body.innerText || '';
            const matches = allText.match(base64Pattern);
            
            if (matches && matches.length > 0) {
                for (let match of matches) {
                    if (match.length >= 20 && match.length <= 50) {
                        const walker = document.createTreeWalker(
                            document.body,
                            NodeFilter.SHOW_TEXT,
                            null
                        );
                        
                        let node;
                        while ((node = walker.nextNode())) {
                            const textContent = node.textContent || '';
                            if (textContent.includes(match)) {
                                WATERMARK_TEXT = match;
                                rebuildWatermarkCandidates();
                                logger.log('从页面检测到水印:', WATERMARK_TEXT);
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        } catch (error) {
            logger.error('从页面检测水印时出错:', error);
            return false;
        }
    }

    // 带重试的获取水印函数
    async function fetchWatermarkWithRetry(maxRetries = 5, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            logger.log(`尝试获取水印 (${i + 1}/${maxRetries})...`);
            
            const success = await fetchWatermark();
            if (success && WATERMARK_TEXT) {
                return true;
            }
            
            // 如果不是最后一次尝试，等待后重试
            if (i < maxRetries - 1) {
                logger.log(`等待 ${delay}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5; // 指数退避
            }
        }
        
        // 如果 API 获取失败，尝试从页面检测
        logger.log('API 获取失败，尝试从页面检测水印...');
        if (detectWatermarkFromPage()) {
            return true;
        }
        
        logger.error('无法获取水印内容，脚本将无法正常工作');
        return false;
    }

    // 启动检测和移除功能
    function startWatermarkRemoval() {
        if (!WATERMARK_TEXT) {
            logger.warn('水印内容为空，无法启动移除功能');
            return false;
        }

        logger.log('启动水印移除功能，水印内容:', WATERMARK_TEXT);

        try {
            interceptCanvas();
            interceptStyles();
            setupObserver();
            detectAndRemoveWatermarks();
            clearLikelyWatermarkCanvases();
        } catch (error) {
            logger.error('启动水印移除功能时出错:', error);
            return false;
        }

        // 添加定期轮询检测，确保捕获动态生成的水印
        let pollCount = 0;
        const maxPollCount = 20; // 最多轮询 20 次
        const pollInterval = 500; // 每 500ms 检测一次

        const pollTimer = setInterval(() => {
            pollCount++;
            if (pollCount > maxPollCount) {
                clearInterval(pollTimer);
                logger.log('轮询检测完成');
                return;
            }
            detectAndRemoveWatermarks();
            clearLikelyWatermarkCanvases();
        }, pollInterval);

        // 监听窗口 resize 事件，确保布局变化时重新检测
        const resizeHandler = debounce(() => {
            logger.log('窗口大小改变，重新检测水印');
            detectAndRemoveWatermarks();
            clearLikelyWatermarkCanvases();
        }, 300);
        window.addEventListener('resize', resizeHandler);

        return true;
    }

    // 主函数
    async function main() {
        logger.log('脚本开始运行...');

        // 首先尝试获取水印内容（带重试）
        const watermarkFetched = await fetchWatermarkWithRetry(5, 1000);

        // 如果成功获取水印，启动移除功能（startWatermarkRemoval 会执行初始检测）
        if (watermarkFetched && WATERMARK_TEXT) {
            startWatermarkRemoval();
        } else {
            // 如果仍然失败，等待页面完全加载后再试一次
            logger.log('等待页面完全加载后重试...');
            window.addEventListener('load', async () => {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 再等待 2 秒
                const retrySuccess = await fetchWatermarkWithRetry(3, 2000);
                if (retrySuccess && WATERMARK_TEXT) {
                    startWatermarkRemoval();
                } else {
                    // 最后尝试从页面检测
                    if (detectWatermarkFromPage()) {
                        startWatermarkRemoval();
                    }
                }
            });
        }

        // 输出错误统计
        const stats = logger.getStats();
        const totalErrors = stats.fetchErrors + stats.domErrors + stats.canvasErrors + stats.styleErrors;
        if (totalErrors > 0) {
            console.warn('[去水印脚本] 错误统计:', stats);
        }
    }

    // 运行主函数
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();

