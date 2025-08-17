# 缓存工具使用说明

## 概述

本项目实现了一个通用的localStorage缓存工具组件，支持自定义缓存过期时间，用于优化数据加载性能。

## 文件结构

```
utils/
├── storage.js      # 缓存工具核心组件
├── cache-test.js   # 缓存功能测试工具
└── README.md       # 使用说明文档
```

## 核心功能

### StorageUtil 类

提供以下静态方法：

- `set(key, value, expireTime)` - 设置缓存数据
- `get(key)` - 获取缓存数据
- `remove(key)` - 删除缓存数据
- `clear()` - 清空所有缓存
- `has(key)` - 检查缓存是否存在且未过期
- `getRemainTime(key)` - 获取缓存剩余有效时间

### 预定义常量

#### 缓存时间常量 (CACHE_TIME)

```javascript
CACHE_TIME = {
  HOUR: 60 * 60 * 1000,           // 1小时
  THREE_HOURS: 3 * 60 * 60 * 1000, // 3小时
  DAY: 24 * 60 * 60 * 1000,       // 1天
  WEEK: 7 * 24 * 60 * 60 * 1000,  // 1周
  MONTH: 30 * 24 * 60 * 60 * 1000 // 30天
}
```

#### 缓存键名常量 (CACHE_KEYS)

```javascript
CACHE_KEYS = {
  SITE_INFO: 'site_info',    // 站点信息
  CATEGORIES: 'categories',  // 分类列表
  TAGS: 'tags'              // 标签列表
}
```

## 使用方法

### 1. 引入缓存工具

```javascript
const { StorageUtil, CACHE_TIME, CACHE_KEYS } = require('./utils/storage.js');
```

### 2. 基本使用示例

```javascript
// 设置缓存（缓存1小时）
StorageUtil.set('user_data', { name: '张三', age: 25 }, CACHE_TIME.HOUR);

// 获取缓存
const userData = StorageUtil.get('user_data');
if (userData) {
  console.log('从缓存获取:', userData);
} else {
  console.log('缓存不存在或已过期');
}

// 检查缓存是否存在
if (StorageUtil.has('user_data')) {
  console.log('缓存存在且有效');
}

// 获取剩余时间
const remainTime = StorageUtil.getRemainTime('user_data');
console.log('剩余时间(分钟):', Math.round(remainTime / 1000 / 60));
```

### 3. 在数据加载中使用缓存

```javascript
async function loadData() {
  // 先尝试从缓存获取
  const cachedData = StorageUtil.get(CACHE_KEYS.SITE_INFO);
  if (cachedData) {
    console.log('从缓存加载数据');
    return cachedData;
  }
  
  // 缓存不存在，从网络获取
  try {
    const response = await wx.request({ url: '/api/data' });
    if (response.data.success) {
      // 缓存数据（缓存3小时）
      StorageUtil.set(CACHE_KEYS.SITE_INFO, response.data.data, CACHE_TIME.THREE_HOURS);
      console.log('从网络加载数据并缓存');
      return response.data.data;
    }
  } catch (error) {
    console.error('数据加载失败:', error);
  }
}
```

## 项目中的缓存策略

### 1. 站点信息缓存

- **缓存时间**: 3小时
- **缓存位置**: `app.js` 的 `loadSiteInfo()` 方法
- **缓存键名**: `CACHE_KEYS.SITE_INFO`

### 2. 分类列表缓存

- **缓存时间**: 30天
- **缓存位置**: `pages/posts/index.js` 的 `loadCategories()` 方法
- **缓存键名**: `CACHE_KEYS.CATEGORIES`

### 3. 标签列表缓存

- **缓存时间**: 7天
- **缓存位置**: `pages/posts/index.js` 的 `loadTags()` 方法
- **缓存键名**: `CACHE_KEYS.TAGS`

## 缓存刷新机制

在 `pages/posts/index.js` 的 `refreshData()` 方法中，下拉刷新时会：

1. 清除分类和标签缓存
2. 重新从网络加载最新数据
3. 更新缓存

```javascript
// 清除缓存，确保获取最新数据
StorageUtil.remove(CACHE_KEYS.CATEGORIES);
StorageUtil.remove(CACHE_KEYS.TAGS);
```

## 测试工具

使用 `cache-test.js` 进行缓存功能测试：

```javascript
const CacheTest = require('./utils/cache-test.js');

// 运行所有测试
CacheTest.runAllTests();

// 清理测试数据
CacheTest.cleanup();
```

## 注意事项

1. **存储限制**: 微信小程序localStorage有10MB存储限制
2. **数据格式**: 缓存数据会自动序列化为JSON格式
3. **过期检查**: 每次获取数据时会自动检查是否过期
4. **错误处理**: 所有操作都包含try-catch错误处理
5. **性能优化**: 避免频繁的网络请求，提升用户体验

## 扩展建议

1. **压缩存储**: 对于大数据可考虑压缩后存储
2. **版本控制**: 可添加数据版本号，便于缓存更新
3. **统计功能**: 可添加缓存命中率统计
4. **批量操作**: 可添加批量设置和获取方法