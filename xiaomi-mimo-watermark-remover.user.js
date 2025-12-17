// ==UserScript==
// @name         Xiaomi MiMo Studio 去水印
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  自动检测并移除 Xiaomi MiMo Studio 页面中的水印内容（动态获取水印）
// @author       You
// @match        https://aistudio.xiaomimimo.com/*
// @match        https://aistudio.xiaomimimo.com/#/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ========== 配置选项 ==========
    // 日志开关（设置为 true 启用日志，false 关闭日志）
    const ENABLE_LOG = false;
    
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
            if (ENABLE_LOG) {
                console.error('[去水印脚本]', ...args);
            }
        }
    };

    // 水印内容（将从 API 动态获取）
    let WATERMARK_TEXT = null;
    
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
        if (!text || typeof text !== 'string' || !WATERMARK_TEXT) return false;
        return text.includes(WATERMARK_TEXT);
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
                // 转义特殊字符以避免正则表达式错误
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

    // 检测并移除水印
    function detectAndRemoveWatermarks(root = document.body) {
        if (!root || !WATERMARK_TEXT) return;
        
        // 限制检测范围，避免遍历整个 DOM 树
        const maxDepth = 10;
        let depth = 0;
        
        function traverse(node) {
            if (depth > maxDepth || !node || processedElements.has(node)) return;
            depth++;
            
            try {
                // 检查当前节点
                if (elementContainsWatermark(node) || imageContainsWatermark(node)) {
                    removeWatermark(node);
                    depth--;
                    return;
                }
                
                // 遍历子节点
                if (node.children) {
                    for (let child of node.children) {
                        traverse(child);
                    }
                }
                
                // 检查文本节点
                if (node.childNodes) {
                    for (let child of node.childNodes) {
                        if (child.nodeType === Node.TEXT_NODE) {
                            if (containsWatermark(child.textContent)) {
                                // 移除包含水印的文本节点
                                child.remove();
                            }
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            traverse(child);
                        }
                    }
                }
            } catch (e) {
                logger.warn('检测水印时出错:', e);
            }
            
            depth--;
        }
        
        traverse(root);
    }

    // 防抖版本的检测函数
    const debouncedDetect = debounce(detectAndRemoveWatermarks, 100);

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

    // 创建 MutationObserver 监听 DOM 变化
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                // 检查新增的节点
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
                
                // 检查属性变化（可能影响样式或内容）
                if (mutation.type === 'attributes') {
                    const attrName = mutation.attributeName;
                    if (attrName === 'style' || attrName === 'src' || attrName === 'class') {
                        shouldCheck = true;
                    }
                }
            });
            
            if (shouldCheck) {
                debouncedDetect();
            }
        });

        // 配置观察选项
        const config = {
            childList: true,      // 监听子节点的添加和删除
            subtree: true,         // 监听所有后代节点
            attributes: true,     // 监听属性变化
            attributeFilter: ['style', 'src', 'class', 'background-image'] // 只监听特定属性
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
        // 拦截 CanvasRenderingContext2D 的绘制方法
        const originalFillText = CanvasRenderingContext2D.prototype.fillText;
        const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
        const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
        
        CanvasRenderingContext2D.prototype.fillText = function(...args) {
            const text = args[0];
            if (text && containsWatermark(String(text))) {
                return; // 不绘制包含水印的文本
            }
            return originalFillText.apply(this, args);
        };
        
        CanvasRenderingContext2D.prototype.strokeText = function(...args) {
            const text = args[0];
            if (text && containsWatermark(String(text))) {
                return; // 不绘制包含水印的文本
            }
            return originalStrokeText.apply(this, args);
        };
        
        CanvasRenderingContext2D.prototype.drawImage = function(...args) {
            // 检查图片源是否包含水印
            const image = args[0];
            if (image && image.src && containsWatermark(image.src)) {
                return; // 不绘制包含水印的图片
            }
            return originalDrawImage.apply(this, args);
        };
    }

    // 拦截 CSS 样式（检查伪元素）
    function interceptStyles() {
        // 拦截 styleSheet 的插入
        const originalInsertRule = CSSStyleSheet.prototype.insertRule;
        CSSStyleSheet.prototype.insertRule = function(rule, index) {
            if (rule && WATERMARK_TEXT && containsWatermark(rule)) {
                return -1; // 不插入包含水印的规则
            }
            return originalInsertRule.call(this, rule, index);
        };
        
        // 拦截 style 元素的文本内容
        const originalAppendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function(child) {
            if (child && child.tagName === 'STYLE' && WATERMARK_TEXT) {
                if (child.textContent && containsWatermark(child.textContent)) {
                    // 移除水印内容
                    child.textContent = child.textContent.replace(new RegExp(WATERMARK_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
                }
            }
            return originalAppendChild.call(this, child);
        };
    }

    // 从 API 获取用户信息和水印内容
    async function fetchWatermark() {
        try {
            logger.log('开始获取水印内容...');
            const response = await fetch(USER_API_URL, {
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
                    'x-timezone': 'Asia/Shanghai'
                },
                credentials: 'include' // 包含 cookies
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            logger.log('API 响应:', result);
            
            if (result.code === 0 && result.data && result.data.watermark) {
                WATERMARK_TEXT = result.data.watermark;
                logger.log('成功获取水印内容:', WATERMARK_TEXT);
                return true;
            } else {
                logger.warn('API 响应中未找到水印内容:', result);
                return false;
            }
        } catch (error) {
            logger.error('获取水印内容失败:', error);
            return false;
        }
    }

    // 从页面中检测水印（备选方案）
    function detectWatermarkFromPage() {
        if (WATERMARK_TEXT) return true; // 如果已经有水印，不需要检测
        
        logger.log('尝试从页面中检测水印...');
        
        // 检查常见的 base64 编码字符串模式（水印通常是 base64）
        const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
        const allText = document.body ? document.body.innerText : '';
        const matches = allText.match(base64Pattern);
        
        if (matches && matches.length > 0) {
            // 查找最可能的水印（通常是较短的 base64 字符串）
            for (let match of matches) {
                // 检查是否是合理的水印长度（通常在 20-30 个字符左右）
                if (match.length >= 20 && match.length <= 50) {
                    // 检查是否在页面的可见位置
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null
                    );
                    
                    let node;
                    while (node = walker.nextNode()) {
                        if (node.textContent && node.textContent.includes(match)) {
                            WATERMARK_TEXT = match;
                            logger.log('从页面检测到水印:', WATERMARK_TEXT);
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
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
        
        // 拦截 Canvas 和样式
        interceptCanvas();
        interceptStyles();
        
        // 初始化检测
        init();
        
        // 设置观察器
        setupObserver();
        
        // 定期检测（作为备用方案）
        setInterval(() => {
            if (WATERMARK_TEXT) {
                debouncedDetect();
            }
        }, 2000);
        
        return true;
    }

    // 主函数
    async function main() {
        logger.log('脚本开始运行...');
        
        // 首先尝试获取水印内容（带重试）
        const watermarkFetched = await fetchWatermarkWithRetry(5, 1000);
        
        // 如果成功获取水印，启动移除功能
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
    }

    // 运行主函数
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();

