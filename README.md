# NotionNext 微信小程序

基于 NotionNext 博客系统的微信小程序版本，提供移动端的博客阅读体验。

## 功能特性

### 📱 核心功能
- **文章列表**：展示所有博客文章，支持分页加载
- **分类筛选**：按文章分类进行筛选浏览
- **标签筛选**：按文章标签进行筛选浏览
- **搜索功能**：支持关键词搜索文章标题和内容
- **文章详情**：完整的文章内容展示
- **关于我**：展示博主信息、统计数据和联系方式

### 🎨 用户体验
- **响应式设计**：适配不同屏幕尺寸
- **下拉刷新**：支持下拉刷新数据
- **上拉加载**：支持上拉加载更多内容
- **收藏功能**：支持收藏喜欢的文章
- **分享功能**：支持分享文章到微信好友和朋友圈
- **联系客服**：集成微信客服功能
- **深色模式**：支持系统深色模式

### ⚡ 性能优化
- **数据缓存**：API 数据缓存机制，提升加载速度
- **图片懒加载**：优化图片加载性能
- **分页加载**：避免一次性加载大量数据
- **搜索防抖**：优化搜索体验

## 技术架构

### 后端 API
- 基于 NotionNext 现有架构
- 新增微信小程序专用 API 接口
- 支持数据缓存和性能优化

### 前端小程序
- 原生微信小程序开发
- 模块化页面结构
- 统一的样式规范
- 完善的错误处理机制

## 项目结构

```
Notion-Wechat-Blog/
├── pages/                    # 页面文件
│   ├── index/               # 首页
│   ├── post/                # 文章详情页
│   ├── category/            # 分类页
│   └── tag/                 # 标签页
├── components/              # 组件
├── utils/                   # 工具函数
├── app.js                   # 小程序入口文件
├── app.json                 # 小程序配置文件
├── app.wxss                 # 全局样式文件
├── package.json             # 项目依赖配置
├── .eslintrc.js            # ESLint 配置
├── .prettierrc             # Prettier 配置
├── .gitignore              # Git 忽略文件
├── project.config.json.template  # 微信开发者工具配置模板
├── sitemap.json.template   # 小程序 sitemap 配置模板
└── README.md               # 项目说明
```

## 目录结构详细说明

```
miniprogram/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置文件
├── app.wxss              # 全局样式文件
├── README.md             # 项目说明文档
└── pages/                # 页面目录
    ├── posts/            # 文章列表页
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    ├── about/            # 关于我页面
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    ├── post-detail/      # 文章详情页
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    └── search/           # 搜索页面
        ├── index.js
        ├── index.json
        ├── index.wxml
        └── index.wxss
```

## API 接口

### 文章相关
- `GET /api/miniprogram/posts` - 获取文章列表
- `GET /api/miniprogram/post/[slug]` - 获取文章详情
- `GET /api/miniprogram/categories` - 获取分类列表
- `GET /api/miniprogram/tags` - 获取标签列表

### 站点信息
- `GET /api/miniprogram/site-info` - 获取站点信息

### 请求参数

#### 文章列表 API
```javascript
{
  page: 1,           // 页码，默认 1
  pageSize: 10,      // 每页数量，默认 10，最大 50
  category: '',      // 分类筛选
  tag: '',          // 标签筛选
  search: ''        // 搜索关键词
}
```

## 部署说明

### 1. 后端部署
确保 NotionNext 项目正常运行，微信小程序专用的 API 接口已经集成并优化：
- 复用了 NotionNext 的核心数据获取逻辑
- 移除了重复的缓存管理代码
- 统一使用 `getGlobalData` 的内置缓存机制
- API 接口位于 `/pages/api/miniprogram/` 目录下

### 2. 小程序配置
1. 在微信公众平台注册小程序
2. 获取小程序 AppID
3. 配置服务器域名（request 合法域名）
4. 修改 `app.js` 中的 `apiBaseUrl` 为你的服务器地址
   - 开发环境：`http://localhost:3000/api/miniprogram`
   - 生产环境：`https://your-domain.com/api/miniprogram`

### 3. 开发工具
1. 下载微信开发者工具
2. 导入 `miniprogram` 目录
3. 填入小程序 AppID
4. 开始开发或预览

## 开发环境配置

### 1. 安装依赖（可选）

```bash
npm install
```

### 2. 配置微信开发者工具

1. 复制配置文件模板：
   ```bash
   cp project.config.json.template project.config.json
   cp sitemap.json.template sitemap.json
   ```

2. 在微信开发者工具中导入项目
3. 在 `project.config.json` 中设置您的小程序 AppID

## 配置说明

### API 基础地址
在 `app.js` 中修改 `apiBaseUrl`：

```javascript
globalData: {
  apiBaseUrl: 'https://your-domain.com/api/miniprogram'
}
```

### 缓存配置
重构后的 API 接口统一使用 NotionNext 的内置缓存机制：
- 所有接口复用 `getGlobalData` 的缓存策略
- 缓存时间由 NotionNext 的配置统一管理
- 避免了重复的缓存逻辑，提高了代码维护性
- 缓存键基于数据版本和请求参数自动生成

## 开发指南

### 添加新页面
1. 在 `pages` 目录下创建新页面文件夹
2. 创建 `.js`、`.json`、`.wxml`、`.wxss` 四个文件
3. 在 `app.json` 中注册新页面路径

### 样式规范
- 使用 `rpx` 单位适配不同屏幕
- 遵循现有的颜色和间距规范
- 支持深色模式适配

### 错误处理
使用全局的错误处理方法：
```javascript
app.showError('错误信息')
app.showSuccess('成功信息')
```

## 注意事项

1. **域名配置**：确保在微信公众平台配置了正确的服务器域名
2. **HTTPS 要求**：小程序要求使用 HTTPS 协议
3. **图片域名**：如果使用外部图片，需要配置 downloadFile 合法域名
4. **缓存策略**：合理使用缓存，避免频繁请求
5. **性能优化**：注意图片大小和加载性能

## 更新日志

### v1.0.0
- 初始版本发布
- 实现基础的文章浏览功能
- 支持分类、标签筛选
- 集成搜索功能
- 添加关于我页面
- 支持文章收藏和分享

## 许可证

本项目基于 MIT 许可证开源。