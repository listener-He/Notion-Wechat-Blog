# 墨语·Light & Ink 设计系统使用指南

## 概述

墨语·Light & Ink 设计系统是一套完整的视觉设计语言，专为微信小程序博客应用设计。它包含了色彩、字体、图标、组件等完整的设计规范，旨在提供一致、优雅的用户体验。

## 设计理念

- **素墨之美**：以深墨蓝为主色调，体现文字的力量与深度
- **阅读优先**：针对中文阅读体验优化的字体排版系统
- **情感化设计**：通过节日主题和细腻的交互反馈传达温度
- **现代简约**：简洁而不简单的视觉语言

## 文件结构

```
styles/
├── design-system.wxss    # 主入口文件，整合所有设计系统
├── colors.wxss          # 色彩系统
├── typography.wxss      # 字体系统
├── icons.wxss           # 图标系统
└── components.wxss      # 组件系统
```

## 快速开始

### 1. 导入设计系统

在 `app.wxss` 中导入设计系统：

```css
@import "./styles/design-system.wxss";
```

### 2. 使用 CSS 变量

设计系统提供了丰富的 CSS 变量，可以直接在样式中使用：

```css
.my-component {
  background-color: var(--theme-primary);
  color: var(--theme-text-white);
  font-size: var(--font-size-base);
  border-radius: 12rpx;
}
```

### 3. 使用预定义类名

设计系统提供了大量的工具类，可以快速构建界面：

```html
<view class="card p-3 mb-4">
  <text class="heading-2 text-primary mb-2">标题</text>
  <text class="paragraph text-secondary">内容描述</text>
  <button class="btn-primary btn-small">操作按钮</button>
</view>
```

## 色彩系统

### 主色调

- `--theme-primary`: #2c3e50 (深墨蓝)
- `--theme-accent`: #e74c3c (朱砂红)
- `--theme-secondary`: #95a5a6 (银灰)

### 语义化颜色

- `--theme-success`: #27ae60 (成功绿)
- `--theme-warning`: #f39c12 (警告橙)
- `--theme-error`: #e74c3c (错误红)
- `--theme-info`: #3498db (信息蓝)

### 使用示例

```css
/* 背景色 */
.bg-primary { background-color: var(--theme-primary); }
.bg-success { background-color: var(--theme-success); }

/* 文字色 */
.text-primary { color: var(--theme-primary); }
.text-error { color: var(--theme-error); }

/* 边框色 */
.border-primary { border-color: var(--theme-primary); }
```

### 节日主题

设计系统支持多种节日主题，通过添加对应的类名激活：

```html
<!-- 春节主题 -->
<view class="theme-spring-festival">
  <!-- 内容 -->
</view>

<!-- 圣诞节主题 -->
<view class="theme-christmas">
  <!-- 内容 -->
</view>
```

## 字体系统

### 字体族

- `--font-family-primary`: 主字体族，用于正文
- `--font-family-heading`: 标题字体族
- `--font-family-mono`: 等宽字体族，用于代码
- `--font-family-decorative`: 装饰字体族，用于特殊场景

### 字体大小

```css
--font-size-xs: 20rpx;      /* 极小 */
--font-size-sm: 24rpx;      /* 小 */
--font-size-base: 28rpx;    /* 基础 */
--font-size-md: 32rpx;      /* 中等 */
--font-size-lg: 36rpx;      /* 大 */
--font-size-xl: 44rpx;      /* 特大 */
--font-size-2xl: 52rpx;     /* 超大 */
--font-size-3xl: 64rpx;     /* 巨大 */
```

### 标题层级

```html
<text class="heading-1">一级标题</text>
<text class="heading-2">二级标题</text>
<text class="heading-3">三级标题</text>
<text class="heading-4">四级标题</text>
<text class="heading-5">五级标题</text>
<text class="heading-6">六级标题</text>
```

### 正文样式

```html
<text class="paragraph">标准段落</text>
<text class="paragraph-large">大段落</text>
<text class="paragraph-small">小段落</text>
```

### 特殊文本

```html
<text class="text-emphasis">强调文本</text>
<text class="text-strong">粗体文本</text>
<text class="text-italic">斜体文本</text>
<text class="code-inline">行内代码</text>
```

## 图标系统

### 基础用法

```html
<text class="icon icon-home icon-md icon-primary"></text>
<text class="icon icon-search icon-lg icon-accent"></text>
```

### 图标大小

- `icon-xs`: 24rpx
- `icon-sm`: 28rpx
- `icon-base`: 32rpx
- `icon-md`: 36rpx
- `icon-lg`: 44rpx
- `icon-xl`: 52rpx
- `icon-2xl`: 64rpx
- `icon-3xl`: 80rpx

### 图标动画

```html
<text class="icon icon-loading icon-spin">加载中</text>
<text class="icon icon-heart icon-pulse">心跳</text>
<text class="icon icon-star icon-bounce">弹跳</text>
```

### 图标按钮

```html
<button class="icon-button" aria-label="设置">
  <text class="icon icon-settings"></text>
</button>
```

## 组件系统

### 按钮组件

```html
<!-- 主要按钮 -->
<button class="btn-primary">主要操作</button>

<!-- 次要按钮 -->
<button class="btn-secondary">次要操作</button>

<!-- 文本按钮 -->
<button class="btn-text">文本操作</button>

<!-- 小尺寸按钮 -->
<button class="btn-primary btn-small">小按钮</button>

<!-- 圆形按钮 -->
<button class="btn-primary btn-round">圆形</button>
```

### 卡片组件

```html
<view class="card">
  <view class="card-header">
    <text class="card-title">卡片标题</text>
  </view>
  <view class="card-body">
    <text class="card-description">卡片内容描述</text>
  </view>
  <view class="card-footer">
    <button class="btn-primary btn-small">操作</button>
  </view>
</view>
```

### 标签组件

```html
<text class="tag">默认标签</text>
<text class="tag tag-primary">主要标签</text>
<text class="tag tag-success">成功标签</text>
<text class="tag tag-warning">警告标签</text>
<text class="tag tag-danger">危险标签</text>
```

### 输入框组件

```html
<view class="input-group">
  <text class="input-label">标签</text>
  <input class="input-field" placeholder="请输入内容" />
</view>

<!-- 搜索框 -->
<view class="search-box">
  <input class="search-input" placeholder="搜索..." />
  <text class="search-icon icon icon-search"></text>
</view>
```

### 加载组件

```html
<!-- 加载容器 -->
<view class="loading-container">
  <view class="loading-spinner"></view>
  <text class="loading-text">加载中...</text>
</view>

<!-- 脉冲加载 -->
<view class="loading-pulse">
  <view class="pulse-dot"></view>
  <view class="pulse-dot"></view>
  <view class="pulse-dot"></view>
</view>
```

### 空状态组件

```html
<view class="empty-state">
  <text class="empty-icon icon icon-file"></text>
  <text class="empty-title">暂无内容</text>
  <text class="empty-text">还没有任何内容，快去创建吧</text>
  <button class="btn-primary">创建内容</button>
</view>
```

## 布局系统

### 容器

```html
<view class="container">标准容器</view>
<view class="container-fluid">流体容器</view>
<view class="container-narrow">窄容器</view>
```

### 网格系统

```html
<view class="row">
  <view class="col-6">左侧</view>
  <view class="col-6">右侧</view>
</view>

<view class="row">
  <view class="col-4">1/3</view>
  <view class="col-4">1/3</view>
  <view class="col-4">1/3</view>
</view>
```

### 间距系统

```html
<!-- 垂直间距 -->
<view class="space-y-4">
  <view>项目1</view>
  <view>项目2</view>
  <view>项目3</view>
</view>

<!-- 水平间距 -->
<view class="flex space-x-3">
  <view>项目1</view>
  <view>项目2</view>
  <view>项目3</view>
</view>
```

## 工具类

### 间距工具类

```html
<view class="m-4 p-3">外边距40rpx，内边距30rpx</view>
<view class="mt-2 mb-4">上边距20rpx，下边距40rpx</view>
```

### 文本工具类

```html
<text class="text-center text-lg font-bold">居中大号粗体</text>
<text class="text-primary text-sm">主色小号文字</text>
```

### 布局工具类

```html
<view class="flex items-center justify-between">
  <text>左侧</text>
  <text>右侧</text>
</view>

<view class="flex flex-col items-center">
  <text>上方</text>
  <text>下方</text>
</view>
```

### 显示/隐藏工具类

```html
<view class="hidden">隐藏元素</view>
<view class="hide-mobile">移动端隐藏</view>
<view class="show-desktop">桌面端显示</view>
```

## 响应式设计

设计系统提供了三个断点：

- 小屏幕（手机）：max-width: 750rpx
- 中等屏幕（平板）：751rpx - 1199rpx
- 大屏幕（桌面）：min-width: 1200rpx

```css
/* 响应式字体 */
@media (max-width: 750rpx) {
  .heading-1 { font-size: var(--font-size-2xl); }
}

@media (min-width: 1200rpx) {
  .reading-content {
    font-size: var(--font-size-lg);
    max-width: 1000rpx;
    margin: 0 auto;
  }
}
```

## 主题切换

### 深色模式

```html
<view class="theme-dark">
  <!-- 深色主题内容 -->
</view>
```

### 节日主题

```javascript
// 在 JavaScript 中动态切换主题
const themeManager = {
  setTheme(themeName) {
    const body = document.body;
    body.className = body.className.replace(/theme-\w+/g, '');
    if (themeName !== 'default') {
      body.classList.add(`theme-${themeName}`);
    }
  }
};

// 使用示例
themeManager.setTheme('spring-festival'); // 春节主题
themeManager.setTheme('christmas');       // 圣诞主题
themeManager.setTheme('default');         // 默认主题
```

## 动画效果

### 基础动画

```html
<view class="theme-fade-in">淡入动画</view>
<button class="interactive">交互动画</button>
<button class="ripple">波纹效果</button>
```

### 自定义动画

```css
.my-animation {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## 无障碍支持

设计系统内置了无障碍支持：

```html
<!-- 屏幕阅读器专用文本 -->
<text class="sr-only">仅供屏幕阅读器</text>

<!-- 焦点可见性 -->
<button class="focus-visible">可聚焦按钮</button>

<!-- 图标按钮的标签 -->
<button class="icon-button" aria-label="关闭对话框">
  <text class="icon icon-close"></text>
</button>
```

## 性能优化

### GPU 加速

```html
<view class="gpu-accelerated">GPU加速元素</view>
```

### Will-change 优化

```html
<view class="will-change-transform">变换优化</view>
<view class="will-change-scroll">滚动优化</view>
```

## 调试工具

### 网格调试

```html
<view class="debug-grid">显示网格</view>
```

### 轮廓调试

```html
<view class="debug-outline">显示所有元素轮廓</view>
```

## 最佳实践

### 1. 保持一致性

- 始终使用设计系统提供的颜色变量
- 遵循字体层级规范
- 使用统一的间距系统

### 2. 语义化使用

```html
<!-- 好的做法 -->
<button class="btn-primary">确认</button>
<text class="text-error">错误信息</text>

<!-- 避免的做法 -->
<view style="background: #2c3e50; color: white;">确认</view>
<text style="color: red;">错误信息</text>
```

### 3. 响应式优先

```css
/* 移动端优先 */
.my-component {
  font-size: var(--font-size-base);
}

/* 大屏幕适配 */
@media (min-width: 1200rpx) {
  .my-component {
    font-size: var(--font-size-lg);
  }
}
```

### 4. 性能考虑

- 合理使用动画，避免过度动效
- 对频繁变化的元素使用 GPU 加速
- 避免不必要的重绘和重排

## 扩展指南

### 添加新颜色

在 `colors.wxss` 中添加新的颜色变量：

```css
:root {
  --theme-custom: #your-color;
  --theme-custom-light: #your-light-color;
}

.bg-custom { background-color: var(--theme-custom); }
.text-custom { color: var(--theme-custom); }
```

### 添加新组件

在 `components.wxss` 中添加新组件样式：

```css
.my-component {
  /* 基础样式 */
  display: flex;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--theme-bg-primary);
  border-radius: 12rpx;
  
  /* 状态样式 */
  transition: all 0.3s ease;
}

.my-component:hover {
  background: var(--theme-bg-light);
}

.my-component.active {
  background: var(--theme-primary);
  color: var(--theme-text-white);
}
```

## 更新日志

### v1.0.0 (2024年)

- 🎉 初始版本发布
- ✨ 完整的色彩系统
- ✨ 优雅的字体排版系统
- ✨ 丰富的图标系统
- ✨ 模块化的组件系统
- ✨ 响应式设计支持
- ✨ 无障碍功能支持
- ✨ 性能优化

## 贡献指南

欢迎为设计系统贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 支持

如果在使用过程中遇到问题，请：

1. 查看本文档
2. 检查代码示例
3. 提交 Issue

---

**墨语·Light & Ink 设计系统** - 让设计更简单，让体验更优雅。