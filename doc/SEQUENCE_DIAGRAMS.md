# Xiaomi MiMo Studio 去水印脚本 - 时序图文档

**版本**: v1.4.0 | **更新日期**: 2026-01-20

本文档包含项目的时序图，展示脚本各组件之间的时间交互关系。

## 文档更新说明

### v1.4.0 更新内容
- 完全重写时序图，专注于Canvas水印拦截和清理
- 移除所有DOM遍历、CSS拦截、MutationObserver等已废弃功能的时序图
- 新增Canvas拦截时序图，展示fillText、strokeText、drawImage的拦截流程
- 新增Canvas清理时序图，展示可疑Canvas的检测和清理流程
- 新增水印获取时序图，展示API请求和页面检测备选方案
- 新增动态监听时序图，展示轮询和resize监听机制
- 新增完整交互时序图，展示从脚本启动到水印移除的完整流程

## 1. 整体架构时序图

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Script as Tampermonkey 脚本
    participant Config as 配置系统
    participant State as 状态管理
    participant API as MiMo API
    participant Canvas as Canvas API
    participant DOM as DOM 树

    User->>Script: 加载页面
    Script->>Config: 初始化配置 (CONFIG)
    Config-->>Script: 配置参数
    Script->>State: 初始化状态 (watermarkText, processedElements, etc.)
    State-->>Script: 状态对象
    Script->>API: 获取用户水印内容
    API-->>Script: 返回水印文本
    Script->>State: 更新水印文本
    Script->>State: 重建水印候选列表

    alt ENABLE_CANVAS_INTERCEPT 为 true
        Script->>Canvas: 拦截 Canvas API
        Canvas-->>Script: 拦截成功
    end

    Script->>Script: 进入监控状态
    Script->>DOM: 初始 Canvas 清理
    DOM-->>Script: 清理结果

    loop 持续监控
        Script->>Script: 轮询检测 Canvas
        Script->>DOM: 检测并清理可疑 Canvas
        DOM-->>Script: 清理结果
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
    participant State as 状态管理

    Script->>Config: 获取配置参数
    Config-->>Script: API_URL, FETCH_TIMEOUT, MAX_RETRIES, etc.

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
                    Script->>State: 添加所有候选
                else UTF-8 解码失败
                    Script->>State: 使用 Base64 结果
                end
            else Base64 解码失败
                Script->>State: 使用原始文本
            end

            Script->>Validator: 验证水印文本安全性
            Validator-->>Script: 安全检查通过

            Script->>State: 重建水印候选列表
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

## 3. Canvas 拦截时序图

```mermaid
sequenceDiagram
    participant Page as 页面应用
    participant CanvasCtx as CanvasContext
    participant Interceptor as 拦截器
    participant Watermark as 水印检测
    participant State as 状态管理

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
        Watermark->>State: 使用水印候选列表

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
        Watermark->>State: 使用水印候选列表

        alt 包含水印
            Interceptor->>CanvasCtx: 直接返回 (阻止绘制)
        else 不包含水印
            CanvasCtx->>CanvasCtx: 调用原始 strokeText
            CanvasCtx-->>Page: 绘制描边文本
        end

        Page->>CanvasCtx: 调用 drawImage(image, ...)
        CanvasCtx->>Interceptor: 检查图片源
        Interceptor->>Watermark: 匹配水印
        Watermark->>State: 使用水印候选列表

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

## 4. Canvas 清理时序图

```mermaid
sequenceDiagram
    participant Script as 脚本
    participant DOM as DOM 树
    participant Canvas as Canvas 元素
    participant Config as 配置系统
    participant State as 状态管理

    Script->>DOM: querySelectorAll('canvas')
    DOM-->>Script: Canvas 元素列表

    loop 遍历 Canvas 元素
        Script->>State: 检查是否已处理
        State-->>Script: 处理状态

        alt 已处理
            Script->>Script: 跳过此 Canvas
        else 未处理
            Script->>Canvas: getComputedStyle()
            Canvas-->>Script: 样式对象

            Script->>Config: 获取检测配置
            Config-->>Script: VIEWPORT_COVERAGE_THRESHOLD

            alt 检测条件满足
                Note over Script: 覆盖大部分视口 + (fixed/absolute 或 pointer-events: none)

                Script->>Canvas: getContext('2d')
                Canvas-->>Script: 2D 上下文

                Script->>Canvas: clearRect(0, 0, width, height)
                Script->>Canvas: 设置样式隐藏
                Canvas-->>Script: display: none, etc.

                Script->>State: 标记为已处理
                State-->>Script: 标记完成
            else 检测条件不满足
                Script->>Script: 保留 Canvas
            end
        end
    end
```

## 5. 动态监听时序图

```mermaid
sequenceDiagram
    participant Script as 脚本
    participant Timer as 轮询定时器
    participant DOM as DOM 树
    participant Window as 浏览器窗口
    participant State as 状态管理

    Script->>Script: 启动水印移除功能
    Script->>State: 检查水印文本

    alt 水印文本存在
        Script->>Canvas: 拦截 Canvas API
        Canvas-->>Script: 拦截成功

        Script->>DOM: 初始 Canvas 清理
        DOM-->>Script: 清理结果

        par 创建资源
            Script->>Timer: 创建轮询定时器
            Timer-->>Script: pollTimer 引用

            Script->>Window: 添加 resize 监听器
            Window-->>Script: resizeHandler 引用
        end

        Note over Script,Timer: 脚本运行中...

        loop 轮询检测
            Timer->>Script: 触发轮询 (每500ms)
            Script->>State: pollCount++

            alt pollCount <= MAX_POLL_COUNT (20次)
                Script->>DOM: 检测并清理 Canvas
                DOM-->>Script: 清理结果
            else 达到最大轮询次数
                Script->>Timer: 清除定时器
                Timer-->>Script: pollTimer = null
                Note over Script: 轮询检测完成
            end
        end

        loop resize 监听
            Window->>Script: 触发 resize 事件
            Script->>DOM: 检测并清理 Canvas
            DOM-->>Script: 清理结果
        end
    else 水印文本为空
        Script->>Script: 记录警告
        Script->>Script: 无法启动移除功能
    end

    Note over Script: 轮询和resize监听确保动态生成的Canvas水印也能被移除
```

## 6. 完整交互时序图

```mermaid
sequenceDiagram
    participant Browser as 浏览器
    participant Script as 脚本
    participant Config as 配置系统
    participant State as 状态管理
    participant API as MiMo API
    participant Canvas as Canvas API
    participant DOM as DOM 树

    Browser->>Script: 加载脚本

    par 初始化并行操作
        Script->>Config: 初始化配置 (CONFIG)
        Config-->>Script: 配置参数（含拦截开关）
        Script->>State: 初始化状态
        State-->>Script: 状态对象已创建
        Script->>API: 获取水印内容
    and 等待 DOM
        alt DOM 已就绪
            Browser->>Script: DOMContentLoaded
        else 等待中
            Browser->>Script: 页面加载完成
        end
    end

    API-->>Script: 水印文本
    Script->>State: 更新水印文本
    Script->>State: 重建水印候选列表

    alt 水印获取成功
        Script->>Script: 启动水印移除功能

        par 启动监控
            Script->>Canvas: 拦截 Canvas API
            Canvas-->>Script: 拦截成功

            Script->>DOM: 初始 Canvas 清理
            DOM-->>Script: 清理结果

            Script->>Timer: 创建轮询定时器
            Timer-->>Script: pollTimer 引用

            Script->>Window: 添加 resize 监听器
            Window-->>Script: resizeHandler 引用
        end

        loop 运行时监控
            par 轮询检测
                Timer->>Script: 触发轮询
                Script->>DOM: 检测并清理 Canvas
                DOM-->>Script: 清理结果
            end

            par resize 监听
                Window->>Script: 触发 resize 事件
                Script->>DOM: 检测并清理 Canvas
                DOM-->>Script: 清理结果
            end

            par Canvas 拦截
                Browser->>Canvas: 调用 Canvas 方法
                Canvas->>Script: 检查水印
                Script->>State: 使用水印候选列表

                alt 包含水印
                    Script->>Canvas: 阻止绘制
                else 不包含水印
                    Canvas->>Canvas: 正常绘制
                end
            end
        end
    else 水印获取失败
        Script->>Script: 等待页面加载
        Browser->>Script: load 事件

        Script->>Script: 等待一段时间
        Script->>API: 重试获取水印
        API-->>Script: 水印文本

        alt 重试成功
            Script->>Script: 启动水印移除功能
        else 仍然失败
            Script->>DOM: 尝试从页面检测水印
            DOM-->>Script: 检测结果

            alt 页面检测成功
                Script->>Script: 启动水印移除功能
            end
        end
    end

    Note over Script: 脚本专注于Canvas水印的拦截和清理，使用现代JavaScript特性优化性能
```

这些时序图展示了 v1.4.0 版本的Canvas专用架构，专注于水印的拦截和清理功能。
