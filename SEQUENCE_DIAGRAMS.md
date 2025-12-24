# Xiaomi MiMo Studio 去水印脚本 - 时序图文档

本文档包含项目的时序图，展示脚本各组件之间的时间交互关系。

## 1. 整体架构时序图

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Script as Tampermonkey 脚本
    participant API as MiMo API
    participant DOM as DOM 树
    participant Observer as MutationObserver
    participant Canvas as Canvas API

    User->>Script: 加载页面
    Script->>Script: 初始化配置 (ENABLE_LOG)
    Script->>API: 获取用户水印内容
    API-->>Script: 返回水印文本
    Script->>Script: 重建水印候选列表
    
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
    Script->>Canvas: 拦截 Canvas API
    Script->>Script: 进入监控状态
    
    loop 持续监控
        DOM->>Observer: DOM 变化事件
        Observer->>Script: 通知变化
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
    participant API as MiMo User API
    participant Utils as 解码工具

    Script->>API: GET /open-apis/user/mi/get
    API-->>Script: 响应数据
    
    alt 请求成功
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
        
        Script->>Script: 构建水印候选列表
    else 请求失败
        Script->>Script: 记录错误
    end
```

## 3. 水印检测时序图

```mermaid
sequenceDiagram
    participant DOM as DOM 树
    participant Scanner as 检测器
    participant Cache as 已处理缓存
    participant Remover as 移除器

    Scanner->>DOM: 开始遍历 DOM
    DOM-->>Scanner: 返回节点
    
    loop 遍历每个节点
        alt 元素节点
            Scanner->>Cache: 检查是否已处理
            Cache-->>Scanner: 缓存结果
            
            alt 已处理
                Scanner->>DOM: 跳过此节点
            else 未处理
                Scanner->>Scanner: 检查覆盖层特征
                
                alt 是覆盖层
                    Scanner->>Remover: 隐藏覆盖层
                    Remover->>Cache: 标记为已处理
                else 非覆盖层
                    Scanner->>Scanner: 检查文本内容
                    
                    alt 包含水印文本
                        Scanner->>Remover: 移除水印元素
                        Remover->>Cache: 标记为已处理
                    else 不包含水印
                        Scanner->>Scanner: 检查图片
                        
                        alt 包含水印图片
                            Scanner->>Remover: 处理图片水印
                            Remover->>Cache: 标记为已处理
                        else 不包含图片
                            Scanner->>DOM: 递归遍历子节点
                            DOM-->>Scanner: 子节点列表
                        end
                    end
                end
            end
        else 文本节点
            Scanner->>Scanner: 检查文本内容
            
            alt 包含水印
                Scanner->>Remover: 移除文本节点
            else 不包含水印
                Scanner->>DOM: 继续下一个节点
            end
        else 其他节点
            Scanner->>DOM: 跳过
        end
        
        alt 达到最大深度
            Scanner->>DOM: 检查 Shadow DOM
            DOM-->>Scanner: Shadow Root
        end
    end
```

## 4. 水印移除时序图

```mermaid
sequenceDiagram
    participant Detector as 检测器
    participant Remover as 移除器
    participant Element as DOM 元素
    participant Cache as 缓存

    Detector->>Remover: 调用移除函数
    Remover->>Cache: 标记元素为已处理
    Cache-->>Remover: 标记完成
    
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
            Remover->>Element: 替换水印文本为空
            
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
    participant Observer as MutationObserver
    participant Debounce as 防抖函数
    participant Scanner as 检测器

    DOM->>Observer: 注册监听
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
        
        Observer->>Debounce: 触发防抖 (50ms)
        
        alt 防抖超时
            Debounce->>Scanner: 执行扫描
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
    participant Checker as 覆盖层检测器
    participant Style as 计算样式
    participant DOMRect as 元素尺寸

    Checker->>Element: 检查元素
    Element->>Style: 获取计算样式
    Style-->>Element: 样式属性
    
    Checker->>Style: 检查 pointer-events
    Style-->>Checker: pointer-events: none?
    
    alt 不是 none
        Checker-->>Detector: 返回 false
    else 是 none
        Checker->>Style: 检查 position
        Style-->>Checker: fixed/absolute?
        
        Checker->>Style: 检查 z-index
        Style-->>Checker: z-index 值
        
        Checker->>Style: 检查 opacity
        Style-->>Checker: opacity 值
        
        Checker->>Style: 检查 backgroundImage
        Style-->>Checker: 背景图片
        
        Checker->>Element: 检查标签类型
        Element-->>Checker: DIV/CANVAS/SECTION
        
        Checker->>DOMRect: 获取元素尺寸
        DOMRect-->>Checker: width, height
        
        Checker->>Checker: 获取视口尺寸
        
        Checker->>Checker: 计算覆盖率
        Checker-->>Detector: 覆盖 >= 90%?
    end
    
    alt 所有条件满足
        Checker-->>Detector: 返回 true (是覆盖层)
    else 任一条件不满足
        Checker-->>Detector: 返回 false (非覆盖层)
    end
```

## 8. 性能优化时序图

```mermaid
sequenceDiagram
    participant Trigger as 触发源
    participant Debounce as 防抖器
    participant Cache as WeakSet 缓存
    participant Scanner as 扫描器
    participant DOM as DOM 树

    loop 频繁触发事件
        Trigger->>Debounce: 触发操作
        
        alt 首次触发
            Debounce->>Debounce: 设置定时器 (50ms)
            Debounce-->>Trigger: 等待中
        else 再次触发
            Debounce->>Debounce: 重置定时器
            Debounce-->>Trigger: 等待中
        end
    end
    
    Debounce->>Scanner: 执行扫描
    Scanner->>Cache: 检查元素是否已处理
    Cache-->>Scanner: 处理状态
    
    alt 已处理
        Scanner->>Scanner: 跳过此元素
        Scanner-->>Trigger: 扫描完成 (快速)
    else 未处理
        Scanner->>DOM: 遍历 DOM
        
        Note over Scanner,DOM: 最大深度限制 10-12 层
        
        Scanner->>DOM: 检查子节点
        DOM-->>Scanner: 子节点列表
        
        Scanner->>Cache: 标记为已处理
        Scanner-->>Trigger: 扫描完成
    end
    
    loop 后续触发
        Trigger->>Cache: 检查元素
        Cache-->>Trigger: 已处理
        Trigger->>Scanner: 快速跳过
    end
```

## 9. 完整交互时序图

```mermaid
sequenceDiagram
    participant Browser as 浏览器
    participant Script as 脚本
    participant API as MiMo API
    participant DOM as DOM 树
    participant Observer as MutationObserver
    participant Canvas as Canvas

    Browser->>Script: 加载脚本
    
    par 初始化并行操作
        Script->>Script: 读取配置
        Script->>API: 获取水印内容
        API-->>Script: 水印文本
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
        Script->>Canvas: 拦截 API
    end
    
    loop 运行时监控
        DOM->>Observer: DOM 变化
        Observer->>Script: 通知变化
        Script->>DOM: 局部扫描
        
        alt 发现新水印
            DOM-->>Script: 返回新元素
            Script->>DOM: 移除水印
            DOM-->>Script: 移除完成
        else 无新水印
            DOM-->>Script: 无变化
        end
    end
    
    Canvas->>Script: fillText 调用
    Script->>Script: 检查文本
    alt 包含水印
        Script->>Canvas: 阻止绘制
    else 不包含水印
        Canvas->>Canvas: 正常绘制
    end
```

这些时序图全面展示了 Xiaomi MiMo Studio 去水印脚本的组件交互和执行流程。
