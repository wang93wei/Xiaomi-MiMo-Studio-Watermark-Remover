# Xiaomi MiMo Studio 去水印脚本 - 时序图文档

**版本**: v1.3.6 | **更新日期**: 2026-01-04

本文档包含项目的时序图，展示脚本各组件之间的时间交互关系。

## 文档更新说明

### v1.3.6 更新内容
- 重构覆盖层检测时序图，展示函数拆分后的辅助函数调用流程
- 更新 DOM 监听时序图，包含 Shadow Root 样式缓存清理逻辑
- 更新水印获取时序图，简化 API 请求 headers
- 更新完整交互时序图，添加配置开关控制流程
- 更新性能优化时序图，展示预过滤优化
- 更新水印移除时序图，改进超时检查逻辑
- 添加配置开关时序图，展示原型链拦截的启用/禁用控制

### v1.3.5 更新内容
- 添加配置系统 (CONFIG) 相关时序图
- 添加样式缓存 (WeakMap) 相关时序图
- 添加清理机制 (cleanup) 时序图
- 添加安全验证时序图
- 更新水印检测时序图，展示迭代遍历
- 更新性能优化时序图，展示缓存机制
- 更新完整交互时序图，包含所有新组件
- 修正清理机制时序图，反映实际实现（仅清除定时器和事件监听器）
- 修正覆盖层检测时序图，包含MAIN和ASIDE标签类型
- 移除整体架构和完整交互时序图中的页面卸载cleanup调用说明

## 1. 整体架构时序图

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Script as Tampermonkey 脚本
    participant Config as 配置系统
    participant Cache as 样式缓存
    participant API as MiMo API
    participant DOM as DOM 树
    participant Observer as MutationObserver
    participant Canvas as Canvas API

    User->>Script: 加载页面
    Script->>Config: 初始化配置 (CONFIG, ENABLE_LOG, 拦截开关)
    Config-->>Script: 配置参数
    Script->>Cache: 初始化样式缓存 (WeakMap)
    Script->>API: 获取用户水印内容
    API-->>Script: 返回水印文本
    Script->>Script: 验证水印文本安全性
    Script->>Script: 预过滤候选列表（仅包含有效字符串）
    Script->>candidateCache: 缓存预过滤后的候选列表

    alt DOM 已加载
        Script->>DOM: 首次全量扫描
        DOM-->>Script: 返回扫描结果
    else DOM 未加载
        Script->>DOM: 等待 DOMContentLoaded
        DOM-->>Script: DOM 就绪
        Script->>DOM: 首次全量扫描
        DOM-->>Script: 返回扫描结果
    end

    Script->>Observer: 设置 MutationObserver

    alt ENABLE_CANVAS_INTERCEPT 为 true
        Script->>Canvas: 拦截 Canvas API
    end

    Script->>Script: 进入监控状态

    loop 持续监控
        DOM->>Observer: DOM 变化事件
        Observer->>Cache: 清除相关元素样式缓存（含 Shadow Root）
        Observer->>Script: 通知变化
        Script->>Cache: 获取缓存的样式
        Cache-->>Script: 样式数据
        Script->>candidateCache: 使用预过滤的候选列表检查水印
        candidateCache-->>Script: 匹配结果
        Script->>DOM: 局部扫描
        DOM-->>Script: 扫描结果
        Script->>DOM: 检测并移除水印
        DOM-->>Script: 移除完成
    end
```

## 2. 水印获取时序图

```mermaid
sequenceDiagram
    participant Script as 脚本
    participant Config as 配置系统
    participant API as MiMo User API
    participant Validator as 验证器
    participant Utils as 解码工具

    Script->>Config: 获取配置参数
    Config-->>Script: MAX_RETRIES, RETRY_DELAY, FETCH_TIMEOUT

    loop 重试机制
        Script->>API: GET /open-apis/user/mi/get

        Note over Script,API: Headers: accept, content-type, x-timezone

        API-->>Script: 响应数据

        alt 请求成功
            Script->>Validator: 验证响应结构
            Validator-->>Script: 验证通过

            Script->>Validator: 验证水印文本
            Validator-->>Script: 文本有效

            Script->>Utils: 解析 JSON
            Utils-->>Script: 水印文本
            Script->>Utils: Base64 解码
            Utils-->>Script: 解码结果

            alt Base64 解码成功
                Script->>Utils: UTF-8 解码尝试
                Utils-->>Script: UTF-8 解码结果

                alt UTF-8 解码成功
                    Script->>Script: 添加所有候选
                else UTF-8 解码失败
                    Script->>Script: 使用 Base64 结果
                end
            else Base64 解码失败
                Script->>Script: 使用原始文本
            end

            Script->>Validator: 验证水印文本安全性
            Validator-->>Script: 安全检查通过

            Script->>Script: 预过滤候选列表
            Script->>Script: 构建水印候选列表（仅包含有效字符串）
            Script-->>Script: 获取成功
        else 请求失败
            Script->>Script: 记录错误
            Script->>Script: 等待重试 (指数退避)
        end
    end

    alt 所有重试失败
        Script->>DOM: 尝试从页面检测水印
        DOM-->>Script: 检测结果
    end
```

## 3. 水印检测时序图

```mermaid
sequenceDiagram
    participant DOM as DOM 树
    participant Scanner as 检测器
    participant Config as 配置系统
    participant ProcessedCache as 已处理缓存
    participant StyleCache as 样式缓存
    participant Validator as 输入验证器
    participant Remover as 移除器

    Scanner->>Config: 获取遍历配置
    Config-->>Scanner: MAX_DEPTH, MAX_NODES

    Scanner->>DOM: 初始化遍历
    Scanner->>Scanner: 创建处理栈
    Scanner->>DOM: 将根节点压入栈

    loop 迭代遍历
        alt 栈不为空 & 未达节点限制
            Scanner->>Scanner: 从栈中弹出节点

            alt 节点有效 & 深度 <= MAX_DEPTH
                alt 元素节点
                    Scanner->>ProcessedCache: 检查是否已处理
                    ProcessedCache-->>Scanner: 处理状态

                    alt 已处理
                        Scanner->>DOM: 跳过此节点
                    else 未处理
                        Scanner->>StyleCache: 获取缓存的样式
                        StyleCache-->>Scanner: 样式数据

                        Scanner->>Validator: 验证节点输入
                        Validator-->>Scanner: 验证通过

                        Scanner->>Scanner: 检查覆盖层特征

                        alt 是覆盖层
                            Scanner->>Remover: 隐藏覆盖层
                            Remover->>ProcessedCache: 标记为已处理
                        else 非覆盖层
                            Scanner->>Scanner: 检查文本内容

                            alt 包含水印文本
                                Scanner->>Remover: 移除水印元素
                                Remover->>ProcessedCache: 标记为已处理
                            else 不包含水印
                                Scanner->>Scanner: 检查图片

                                alt 包含水印图片
                                    Scanner->>Remover: 处理图片水印
                                    Remover->>ProcessedCache: 标记为已处理
                                else 不包含图片
                                    Scanner->>DOM: 将子节点压入栈
                                    DOM-->>Scanner: 子节点列表
                                end
                            end
                        end
                    end
                else 文本节点
                    Scanner->>Validator: 验证文本输入
                    Validator-->>Scanner: 验证通过

                    Scanner->>Scanner: 检查文本内容

                    alt 包含水印
                        Scanner->>Remover: 移除文本节点
                    else 不包含水印
                        Scanner->>DOM: 继续下一个节点
                    end
                else 其他节点
                    Scanner->>DOM: 跳过
                end

                alt 存在 Shadow Root
                    Scanner->>DOM: 检查 Shadow DOM
                    DOM-->>Scanner: Shadow Root
                    Scanner->>DOM: 将 Shadow Root 压入栈
                end
            else 节点无效或超深
                Scanner->>DOM: 跳过此节点
            end
        else 达到节点限制
            Scanner->>Scanner: 停止遍历
            Scanner->>Scanner: 记录警告
        end
    end
```

## 4. 水印移除时序图

```mermaid
sequenceDiagram
    participant Detector as 检测器
    participant Config as 配置系统
    participant Validator as 验证器
    participant Remover as 移除器
    participant Element as DOM 元素
    participant ProcessedCache as 已处理缓存

    Detector->>Remover: 调用移除函数
    Remover->>Validator: 验证元素输入
    Validator-->>Remover: 验证通过
    Remover->>ProcessedCache: 标记元素为已处理
    ProcessedCache-->>Remover: 标记完成

    alt 图片水印
        Remover->>Element: 清除背景图片
        Remover->>Element: 清除内联样式

        alt 是 img 标签
            Element->>Element: 设置 display: none
            Element->>Element: 移除元素
        else 其他元素
            Remover->>Element: 设置样式隐藏
        end

    else 文本水印
        Remover->>Remover: 检查元素内容

        alt 只包含水印文本
            Element->>Element: 移除整个元素
        else 包含其他内容
            Remover->>Validator: 验证水印文本安全性
            Validator-->>Remover: 安全检查通过

            Remover->>Config: 获取正则超时配置
            Config-->>Remover: REGEX_TIMEOUT

            Remover->>Remover: 记录开始时间

            alt 使用正则替换
                Remover->>Remover: 检查初始超时

                alt 初始超时
                    Remover->>Remover: 记录警告，跳过
                else 未超时
                    Remover->>Element: 替换 textContent
                    Remover->>Element: 替换 innerText
                    Remover->>Element: 替换 innerHTML

                    Remover->>Remover: 检查最终超时

                    alt 最终超时
                        Remover->>Remover: 记录警告，部分替换可能未完成
                    else 未超时
                        Remover->>Remover: 替换完成
                    end
                end
            end

            alt 元素变为空
                Element->>Element: 移除元素
            else 元素仍有内容
                Remover->>Element: 保留元素
            end
        end

    else 覆盖层
        Element->>Element: backgroundImage = none
        Element->>Element: background = none
        Element->>Element: opacity = 0
        Element->>Element: visibility = hidden
        Element->>Element: display = none
    end

    Remover-->>Detector: 移除完成
```

## 5. DOM 监听时序图

```mermaid
sequenceDiagram
    participant DOM as DOM 树
    participant Config as 配置系统
    participant Observer as MutationObserver
    participant StyleCache as 样式缓存
    participant Debounce as 防抖函数
    participant Scanner as 检测器

    DOM->>Observer: 注册监听
    Observer->>Config: 获取防抖配置
    Config-->>Observer: OBSERVER_DEBOUNCE
    Observer->>DOM: 配置观察选项
    Observer->>DOM: 观察属性变化 (style, src, class)
    Observer->>DOM: 观察子节点变化
    Observer->>DOM: 观察后代节点

    loop 持续监听
        DOM->>Observer: 触发 MutationEvent

        alt 有新节点添加
            Observer->>Observer: 收集新增节点
        else 属性变化
            Observer->>Observer: 收集变化目标
        end

        Observer->>Debounce: 触发防抖

        alt 防抖超时
            par 清除相关样式缓存
                Debounce->>StyleCache: 清除元素样式缓存
                StyleCache-->>Debounce: 缓存已清除
            and
                Debounce->>DOM: 查找所有子元素
                DOM-->>Debounce: 子元素列表
                Debounce->>StyleCache: 清除子元素样式缓存
                StyleCache-->>Debounce: 缓存已清除
            end

            alt 节点有 Shadow Root
                Debounce->>DOM: 检查 Shadow Root
                DOM-->>Debounce: Shadow Root 存在

                par 清除 Shadow Root 缓存
                    Debounce->>DOM: 查询 Shadow Root 中所有元素
                    DOM-->>Debounce: Shadow 元素列表
                    Debounce->>StyleCache: 清除 Shadow 元素样式缓存
                    StyleCache-->>Debounce: 缓存已清除
                end
            end

            Debounce->>Scanner: 执行扫描
            Scanner->>StyleCache: 获取缓存的样式
            StyleCache-->>Scanner: 样式数据
            Scanner->>DOM: 检测覆盖层
            DOM-->>Scanner: 检测结果
            Scanner->>DOM: 移除水印
            DOM-->>Scanner: 移除完成
        else 新变化到来
            Debounce->>Debounce: 重置计时器
        end
    end
```

## 6. Canvas 拦截时序图

```mermaid
sequenceDiagram
    participant Page as 页面应用
    participant CanvasCtx as CanvasContext
    participant Interceptor as 拦截器
    participant Watermark as 水印检测

    Page->>CanvasCtx: 获取 2D 上下文
    CanvasCtx-->>Page: CanvasRenderingContext2D
    
    Interceptor->>CanvasCtx: 保存原始方法
    CanvasCtx-->>Interceptor: 原始 fillText
    CanvasCtx-->>Interceptor: 原始 strokeText
    CanvasCtx-->>Interceptor: 原始 drawImage
    
    Interceptor->>CanvasCtx: 重写方法
    
    loop 应用调用 Canvas
        Page->>CanvasCtx: 调用 fillText(text, x, y)
        CanvasCtx->>Interceptor: 检查文本内容
        Interceptor->>Watermark: 匹配水印
        
        alt 包含水印
            Interceptor->>CanvasCtx: 直接返回 (阻止绘制)
            CanvasCtx-->>Page: 无绘制
        else 不包含水印
            CanvasCtx->>CanvasCtx: 调用原始 fillText
            CanvasCtx-->>Page: 绘制文本
        end
        
        Page->>CanvasCtx: 调用 strokeText(text, x, y)
        CanvasCtx->>Interceptor: 检查文本内容
        Interceptor->>Watermark: 匹配水印
        
        alt 包含水印
            Interceptor->>CanvasCtx: 直接返回 (阻止绘制)
        else 不包含水印
            CanvasCtx->>CanvasCtx: 调用原始 strokeText
            CanvasCtx-->>Page: 绘制描边文本
        end
        
        Page->>CanvasCtx: 调用 drawImage(image, ...)
        CanvasCtx->>Interceptor: 检查图片源
        Interceptor->>Watermark: 匹配水印
        
        alt 包含水印
            Interceptor->>CanvasCtx: 直接返回 (阻止绘制)
        else 不包含水印
            CanvasCtx->>CanvasCtx: 调用原始 drawImage
            CanvasCtx-->>Page: 绘制图片
        end
    end
    
    alt 支持 OffscreenCanvas
        Interceptor->>OffscreenCanvas: 同样拦截
    end
```

## 7. 覆盖层检测时序图

```mermaid
sequenceDiagram
    participant Element as DOM 元素
    participant MainChecker as 主检测器
    participant Validator as 元素验证器
    participant PointerChecker as pointer-events 检查器
    participant ZIndexChecker as z-index 检查器
    participant OpacityChecker as opacity 检查器
    participant PositionChecker as position 检查器
    participant BgImageChecker as 背景图片检查器
    participant ViewportChecker as 视口覆盖检查器
    participant StyleCache as 样式缓存

    MainChecker->>Element: 检查元素

    MainChecker->>Validator: 检查元素有效性
    Validator-->>MainChecker: 检查结果

    alt 元素无效
        MainChecker-->>Detector: 返回 false
    else 元素有效
        MainChecker->>PointerChecker: 检查 pointer-events
        PointerChecker->>Element: 检查内联样式
        Element-->>PointerChecker: pointerEvents 值

        alt 内联样式为 auto
            PointerChecker-->>MainChecker: 返回 false
        else 需要检查计算样式
            PointerChecker->>StyleCache: 获取缓存的样式
            StyleCache-->>PointerChecker: 样式数据
            PointerChecker-->>MainChecker: pointer-events: none?
        end

        alt 不是 none
            MainChecker-->>Detector: 返回 false
        else 是 none
            MainChecker->>BgImageChecker: 检查背景图片
            BgImageChecker->>StyleCache: 获取缓存的样式
            StyleCache-->>BgImageChecker: 样式数据
            BgImageChecker-->>MainChecker: 有背景图片?

            alt 无背景图片且非 Canvas
                MainChecker-->>Detector: 返回 false
            else 有背景图片或 Canvas
                MainChecker->>ViewportChecker: 检查视口覆盖
                ViewportChecker->>Element: 获取元素尺寸
                Element-->>ViewportChecker: width, height
                ViewportChecker->>ViewportChecker: 获取视口尺寸
                ViewportChecker->>ViewportChecker: 计算覆盖率
                ViewportChecker-->>MainChecker: 覆盖 >= 90%?

                alt 覆盖率不足
                    MainChecker-->>Detector: 返回 false
                else 覆盖率足够
                    par 并行检查样式特征
                        MainChecker->>ZIndexChecker: 检查 z-index
                        ZIndexChecker->>StyleCache: 获取缓存的样式
                        StyleCache-->>ZIndexChecker: 样式数据
                        ZIndexChecker-->>MainChecker: z-index >= 100?
                    and
                        MainChecker->>OpacityChecker: 检查 opacity
                        OpacityChecker->>StyleCache: 获取缓存的样式
                        StyleCache-->>OpacityChecker: 样式数据
                        OpacityChecker-->>MainChecker: opacity < 1?
                    and
                        MainChecker->>PositionChecker: 检查 position
                        PositionChecker->>StyleCache: 获取缓存的样式
                        StyleCache-->>PositionChecker: 样式数据
                        PositionChecker-->>MainChecker: fixed/absolute?
                    end

                    alt 至少满足一个样式特征
                        MainChecker-->>Detector: 返回 true (是覆盖层)
                    else 所有样式特征都不满足
                        MainChecker-->>Detector: 返回 false (非覆盖层)
                    end
                end
            end
        end
    end
```

## 8. 性能优化时序图

```mermaid
sequenceDiagram
    participant Trigger as 触发源
    participant Config as 配置系统
    participant Debounce as 防抖器
    participant ProcessedCache as WeakSet 缓存
    participant StyleCache as 样式缓存
    participant Scanner as 扫描器
    participant DOM as DOM 树

    Note over Trigger,candidateCache: 候选列表已在获取水印时预过滤

    loop 频繁触发事件
        Trigger->>Config: 获取防抖配置
        Config-->>Trigger: OBSERVER_DEBOUNCE

        Trigger->>Debounce: 触发操作

        alt 首次触发
            Debounce->>Debounce: 设置定时器
            Debounce-->>Trigger: 等待中
        else 再次触发
            Debounce->>Debounce: 重置计时器
            Debounce-->>Trigger: 等待中
        end
    end

    Debounce->>Scanner: 执行扫描
    Scanner->>Config: 获取遍历配置
    Config-->>Scanner: MAX_DEPTH, MAX_NODES

    Scanner->>ProcessedCache: 检查元素是否已处理
    ProcessedCache-->>Scanner: 处理状态

    alt 已处理
        Scanner->>Scanner: 跳过此元素
        Scanner-->>Trigger: 扫描完成 (快速)
    else 未处理
        Scanner->>StyleCache: 获取缓存的样式
        StyleCache-->>Scanner: 样式数据

        Scanner->>DOM: 迭代遍历 DOM

        Note over Scanner,DOM: 最大深度限制 12 层
        Note over Scanner,DOM: 最大节点数限制 10000

        Scanner->>DOM: 检查子节点
        DOM-->>Scanner: 子节点列表

        Scanner->>candidateCache: 检查水印（使用预过滤的候选列表）
        candidateCache-->>Scanner: 匹配结果（无需重复过滤）

        Scanner->>ProcessedCache: 标记为已处理
        Scanner-->>Trigger: 扫描完成
    end

    loop 后续触发
        Trigger->>ProcessedCache: 检查元素
        ProcessedCache-->>Trigger: 已处理
        Trigger->>Scanner: 快速跳过
    end
```

## 9. 完整交互时序图

```mermaid
sequenceDiagram
    participant Browser as 浏览器
    participant Script as 脚本
    participant Config as 配置系统
    participant StyleCache as 样式缓存
    participant API as MiMo API
    participant Validator as 验证器
    participant DOM as DOM 树
    participant Observer as MutationObserver
    participant Canvas as Canvas

    Browser->>Script: 加载脚本

    par 初始化并行操作
        Script->>Config: 初始化配置 (CONFIG)
        Config-->>Script: 配置参数（含拦截开关）
        Script->>StyleCache: 初始化样式缓存
        StyleCache-->>Script: WeakMap 已创建
        Script->>API: 获取水印内容
        API-->>Script: 水印文本
        Script->>Validator: 验证水印文本
        Validator-->>Script: 验证通过
        Script->>Script: 预过滤候选列表
        Script->>Script: 构建候选列表
    and 等待 DOM
        alt DOM 已就绪
            Script->>DOM: 初始扫描
        else 等待中
            Browser->>Script: DOMContentLoaded
            Script->>DOM: 初始扫描
        end
    end

    DOM-->>Script: 扫描结果
    Script->>Script: 记录检测到的水印

    par 启动监控
        Script->>Observer: 创建 MutationObserver
        Observer->>DOM: 监听变化
        Script->>Script: 启动轮询检测
    end

    par Canvas 拦截（受配置控制）
        Script->>Config: 检查 ENABLE_CANVAS_INTERCEPT
        Config-->>Script: 配置状态

        alt 启用 Canvas 拦截
            Script->>Canvas: 拦截 API
        else 禁用 Canvas 拦截
            Script->>Script: 跳过 Canvas 拦截
        end
    end

    par CSS 拦截（受配置控制）
        Script->>Config: 检查 ENABLE_CSS_INTERCEPT
        Config-->>Script: 配置状态

        alt 启用 CSS 拦截
            Script->>Script: 拦截 CSSStyleSheet.insertRule
        else 禁用 CSS 拦截
            Script->>Script: 跳过 CSS 拦截
        end
    end

    par appendChild 拦截（受配置控制）
        Script->>Config: 检查 ENABLE_APPEND_CHILD_INTERCEPT
        Config-->>Script: 配置状态

        alt 启用 appendChild 拦截
            Script->>Script: 拦截 Node.appendChild
        else 禁用 appendChild 拦截
            Script->>Script: 跳过 appendChild 拦截
        end
    end

    loop 运行时监控
        DOM->>Observer: DOM 变化
        Observer->>StyleCache: 清除相关元素缓存（含 Shadow Root）
        StyleCache-->>Observer: 缓存已清除
        Observer->>Script: 通知变化
        Script->>StyleCache: 获取缓存的样式
        StyleCache-->>Script: 样式数据
        Script->>DOM: 局部扫描

        alt 发现新水印
            DOM-->>Script: 返回新元素
            Script->>Validator: 验证输入
            Validator-->>Script: 验证通过
            Script->>DOM: 移除水印
            DOM-->>Script: 移除完成
        else 无新水印
            DOM-->>Script: 无变化
        end
    end

    alt Canvas 拦截已启用
        Canvas->>Script: fillText 调用
        Script->>Validator: 验证文本输入
        Validator-->>Script: 验证通过
        Script->>Script: 检查文本（使用预过滤的候选列表）

        alt 包含水印
            Script->>Canvas: 阻止绘制
        else 不包含水印
            Canvas->>Canvas: 正常绘制
        end
    end
```

## 10. 清理机制时序图

```mermaid
sequenceDiagram
    participant Script as 脚本
    participant Timer as 定时器
    participant EventListener as 事件监听器
    participant Observer as MutationObserver
    participant StyleCache as 样式缓存
    participant ProcessedCache as 已处理缓存

    Script->>Script: 启动水印移除功能

    par 创建资源
        Script->>Timer: 创建轮询定时器
        Timer-->>Script: pollTimer 引用
        Script->>EventListener: 添加 resize 监听器
        EventListener-->>Script: resizeHandler 引用
        Script->>Observer: 创建 MutationObserver
        Observer-->>Script: observer 引用
    end

    Note over Script,Timer: 脚本运行中...

    alt 重新启动水印移除
        Script->>Script: 调用 cleanup()

        Script->>Timer: 清除轮询定时器
        Timer-->>Script: pollTimer = null

        Script->>EventListener: 移除 resize 监听器
        EventListener-->>Script: resizeHandler = null

        Script->>Script: 清理完成
    end

    Script->>Script: 重新创建资源

    par 创建新资源
        Script->>Timer: 创建新的轮询定时器
        Timer-->>Script: 新 pollTimer 引用
        Script->>EventListener: 添加新的 resize 监听器
        EventListener-->>Script: 新 resizeHandler 引用

        Script->>Observer: 创建新的 MutationObserver
        Observer-->>Script: 新 observer 引用
    end

    Note over Script,Timer: 脚本继续运行...

    Note over Script,Timer: 注意：当前实现中 cleanup() 函数仅清除定时器和事件监听器，未实现断开 MutationObserver 和清空缓存的逻辑
```

## 11. 安全验证时序图

```mermaid
sequenceDiagram
    participant Input as 输入数据
    participant Validator as 验证器
    participant Config as 配置系统
    participant Security as 安全检查
    participant Output as 输出结果

    Input->>Validator: 接收输入数据
    Validator->>Config: 获取验证配置
    Config-->>Validator: 验证规则

    Validator->>Validator: 类型检查

    alt 类型无效
        Validator-->>Output: 返回 false
    else 类型有效
        Validator->>Validator: 空值检查

        alt 空值
            Validator-->>Output: 返回 false
        else 非空
            Validator->>Validator: 长度检查

            alt 长度超限
                Validator-->>Output: 返回 false
            else 长度合法
                Validator->>Security: 安全模式检查

                alt 检测到危险模式
                    Security-->>Validator: 发现危险
                    Validator-->>Output: 返回 false
                else 安全检查通过
                    Validator->>Validator: 格式验证

                    alt 格式无效
                        Validator-->>Output: 返回 false
                    else 格式有效
                        Validator-->>Output: 返回 true
                    end
                end
            end
        end
    end

    Note over Input,Output: 所有验证失败都会记录错误日志
```

## 12. 配置开关时序图

```mermaid
sequenceDiagram
    participant Script as 脚本
    participant Config as 配置系统
    participant CanvasInterceptor as Canvas 拦截器
    participant CSSInterceptor as CSS 拦截器
    participant AppendChildInterceptor as appendChild 拦截器
    participant Logger as 日志系统

    Script->>Config: 初始化配置
    Config-->>Script: 配置参数（含拦截开关）

    Script->>Script: 启动水印移除功能
    Script->>CanvasInterceptor: 调用 interceptCanvas()

    CanvasInterceptor->>Config: 检查 ENABLE_CANVAS_INTERCEPT
    Config-->>CanvasInterceptor: 配置值

    alt Canvas 拦截已启用
        CanvasInterceptor->>CanvasInterceptor: 检查是否已拦截

        alt 未拦截
            CanvasInterceptor->>CanvasInterceptor: 保存原始方法
            CanvasInterceptor->>CanvasInterceptor: 重写 Prototype 方法
            CanvasInterceptor->>Logger: 记录拦截已安装
            CanvasInterceptor-->>Script: Canvas 拦截成功
        else 已拦截
            CanvasInterceptor->>Logger: 记录跳过重复安装
            CanvasInterceptor-->>Script: Canvas 拦截已存在
        end
    else Canvas 拦截已禁用
        CanvasInterceptor->>Logger: 记录 Canvas 拦截已禁用
        CanvasInterceptor-->>Script: 跳过 Canvas 拦截
    end

    Script->>CSSInterceptor: 调用 interceptStyles()

    CSSInterceptor->>Config: 检查 ENABLE_CSS_INTERCEPT 和 ENABLE_APPEND_CHILD_INTERCEPT
    Config-->>CSSInterceptor: 配置值

    alt 至少启用一个拦截
        CSSInterceptor->>CSSInterceptor: 检查是否已拦截

        alt 未拦截
            alt ENABLE_CSS_INTERCEPT 为 true
                CSSInterceptor->>CSSInterceptor: 拦截 CSSStyleSheet.insertRule
                CSSInterceptor->>Logger: 记录 CSS 拦截已安装
            end

            alt ENABLE_APPEND_CHILD_INTERCEPT 为 true
                CSSInterceptor->>CSSInterceptor: 拦截 Node.appendChild
                CSSInterceptor->>Logger: 记录 appendChild 拦截已安装
            end

            CSSInterceptor->>CSSInterceptor: 标记为已拦截
            CSSInterceptor-->>Script: CSS 拦截成功
        else 已拦截
            CSSInterceptor->>Logger: 记录跳过重复安装
            CSSInterceptor-->>Script: CSS 拦截已存在
        end
    else 所有拦截已禁用
        CSSInterceptor->>Logger: 记录 CSS 拦截已禁用
        CSSInterceptor-->>Script: 跳过 CSS 拦截
    end

    Note over Script,Logger: 配置开关允许用户控制激进的原型链修改，减少对页面功能的影响
```



这些时序图全面展示了 Xiaomi MiMo Studio 去水印脚本的组件交互和执行流程。
