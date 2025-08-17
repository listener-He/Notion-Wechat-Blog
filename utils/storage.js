/**
 * 通用localStorage工具组件
 * 支持自定义缓存过期时间
 */
class StorageUtil {
  /**
   * 设置缓存数据
   * @param {string} key 缓存键名
   * @param {any} value 缓存值
   * @param {number} expireTime 过期时间（毫秒），默认24小时
   */
  static set(key, value, expireTime = 24 * 60 * 60 * 1000) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expireTime
      }
      wx.setStorageSync(key, JSON.stringify(data))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  }

  /**
   * 获取缓存数据
   * @param {string} key 缓存键名
   * @returns {any|null} 缓存值，如果过期或不存在则返回null
   */
  static get(key) {
    try {
      const dataStr = wx.getStorageSync(key)
      if (!dataStr) {
        return null
      }

      const data = JSON.parse(dataStr)
      const now = Date.now()

      // 检查是否过期
      if (now - data.timestamp > data.expireTime) {
        // 过期则删除缓存
        this.remove(key)
        return null
      }

      return data.value
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  }

  /**
   * 删除缓存数据
   * @param {string} key 缓存键名
   */
  static remove(key) {
    try {
      wx.removeStorageSync(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  static clear() {
    try {
      wx.clearStorageSync()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key 缓存键名
   * @returns {boolean} 是否存在有效缓存
   */
  static has(key) {
    return this.get(key) !== null
  }

  /**
   * 获取缓存剩余有效时间
   * @param {string} key 缓存键名
   * @returns {number} 剩余时间（毫秒），如果不存在或已过期返回0
   */
  static getRemainTime(key) {
    try {
      const dataStr = wx.getStorageSync(key)
      if (!dataStr) {
        return 0
      }

      const data = JSON.parse(dataStr)
      const now = Date.now()
      const remainTime = data.expireTime - (now - data.timestamp)

      return remainTime > 0 ? remainTime : 0
    } catch (error) {
      console.error('Storage getRemainTime error:', error)
      return 0
    }
  }
}

// 预定义的缓存时间常量
const CACHE_TIME = {
  HOUR: 60 * 60 * 1000, // 1小时
  THREE_HOURS: 3 * 60 * 60 * 1000, // 3小时
  DAY: 24 * 60 * 60 * 1000, // 1天
  WEEK: 7 * 24 * 60 * 60 * 1000, // 1周
  MONTH: 30 * 24 * 60 * 60 * 1000 // 30天
}

// 预定义的缓存键名
const CACHE_KEYS = {
  SITE_INFO: 'site_info',
  CATEGORIES: 'categories',
  TAGS: 'tags'
}

module.exports = {
  StorageUtil,
  CACHE_TIME,
  CACHE_KEYS
}
