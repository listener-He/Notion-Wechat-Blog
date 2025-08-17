/**
 * 一言API工具类
 * 用于获取随机哲思短句，支持本地缓存
 */

class HitokotoManager {
  constructor() {
    this.cacheKey = 'hitokoto_cache'
    this.cacheExpiry = 30 * 60 * 1000 // 30分钟缓存
    this.apiUrl = 'https://v1.hitokoto.cn/'
    this.fallbackQuotes = this.getFallbackQuotes()
  }

  // 获取一言
  async getHitokoto(type = null) {
    try {
      // 随机boolean值 减轻一言API请求压力
      const randomBoolean = Math.random() < 0.5
      if (randomBoolean) {
        return this.getRandomFallback()
      }
      // 先尝试从缓存获取
      const cached = this.getCachedHitokoto(type)
      if (cached) {
        return cached
      }

      // 从API获取
      const quote = await this.fetchFromAPI(type)
      if (quote) {
        this.cacheHitokoto(quote, type)
        return quote
      }

      // 使用本地备用句子
      return this.getRandomFallback()
    } catch (error) {
      console.error('获取一言失败:', error)
      return this.getRandomFallback()
    }
  }

  // 从API获取一言
  async fetchFromAPI(type) {
    return new Promise((resolve) => {
      let url = this.apiUrl
      if (type) {
        url += `?c=${type}`
      }

      wx.request({
        url,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            const quote = {
              content: res.data.hitokoto,
              author: res.data.from_who || '佚名',
              source: res.data.from || '未知',
              type: res.data.type,
              id: res.data.id,
              timestamp: Date.now()
            }
            resolve(quote)
          } else {
            resolve(null)
          }
        },
        fail: () => {
          resolve(null)
        }
      })
    })
  }

  // 获取缓存的一言
  getCachedHitokoto(type = null) {
    try {
      const tyueCacheKey = type ? `${this.cacheKey}_${type}` : this.cacheKey
      const cachedArray = wx.getStorageSync(tyueCacheKey)
      let cached = null
      let index = null
      if (cachedArray && cachedArray.length >= 5) {
        index = Math.floor(Math.random() * cachedArray.length)
        cached = cachedArray[index]
      }
      if (cached && cached.timestamp) {
        const now = Date.now()
        if (now - cached.timestamp < this.cacheExpiry) {
          return cached
        } else {
          cachedArray.splice(index, 1)
          wx.setStorageSync(tyueCacheKey, cachedArray)
          return null
        }
      }
    } catch (error) {
      console.error('读取一言缓存失败:', error)
    }
    return null
  }

  // 缓存一言
  cacheHitokoto(quote, type = null) {
    try {
      const tyueCacheKey = type ? `${this.cacheKey}_${type}` : this.cacheKey
      let cachedArray = wx.getStorageSync(tyueCacheKey)
      if (!cachedArray) {
        cachedArray = []
      }
      cachedArray.push(quote)
      wx.setStorageSync(tyueCacheKey, cachedArray)
    } catch (error) {
      console.error('缓存一言失败:', error)
    }
  }

  // 获取随机备用句子
  getRandomFallback() {
    const quotes = this.fallbackQuotes
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return Object.assign({}, quotes[randomIndex], {
      timestamp: Date.now(),
      isFallback: true
    })
  }

  // 备用哲思句子库
  getFallbackQuotes() {
    return [
      {
        content: '夜深了，但思想还在发光',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '文字是思想的影子，而思想是灵魂的光',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '每一次阅读，都是与另一个灵魂的对话',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '在文字的世界里，时间变得温柔',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '真正的智慧，是在平凡中发现不凡',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '月光如墨，落笔成诗',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '生活是一本书，每个人都在写着自己的故事',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '静下心来，听听内心的声音',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '最好的时光，是与文字相伴的时光',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '每一个深夜的思考，都是对白天的升华',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '文字有温度，思想有重量',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '在这个喧嚣的世界里，保持内心的宁静',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '阅读是心灵的旅行，写作是灵魂的归宿',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '时间会过去，但美好的文字会永远留下',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      },
      {
        content: '每一次相遇，都是久别重逢',
        author: '墨语',
        source: 'Light & Ink',
        type: 'original'
      }
    ]
  }

  // 根据时间场景获取特定句子
  getTimeBasedQuote() {
    const now = new Date()
    const hour = now.getHours()

    if (hour >= 0 && hour < 6) {
      // 深夜时段
      const nightQuotes = [
        {
          content: '夜深了，但思想还在发光',
          author: '墨语',
          source: 'Light & Ink',
          type: 'night'
        },
        {
          content: '在这静谧的夜里，与文字相伴',
          author: '墨语',
          source: 'Light & Ink',
          type: 'night'
        },
        {
          content: '深夜的思考，是白天的升华',
          author: '墨语',
          source: 'Light & Ink',
          type: 'night'
        }
      ]
      const randomIndex = Math.floor(Math.random() * nightQuotes.length)
      return Object.assign({}, nightQuotes[randomIndex], {
        timestamp: Date.now(),
        isTimeBased: true
      })
    } else if (hour >= 6 && hour < 12) {
      // 早晨时段
      const morningQuotes = [
        {
          content: '新的一天，新的开始',
          author: '墨语',
          source: 'Light & Ink',
          type: 'morning'
        },
        {
          content: '晨光微熹，思绪清明',
          author: '墨语',
          source: 'Light & Ink',
          type: 'morning'
        }
      ]
      const randomIndex = Math.floor(Math.random() * morningQuotes.length)
      return Object.assign({}, morningQuotes[randomIndex], {
        timestamp: Date.now(),
        isTimeBased: true
      })
    }

    // 其他时段返回随机句子
    return this.getRandomFallback()
  }

  // 刷新一言（清除缓存后重新获取）
  async refreshHitokoto(type = null) {
    try {
      // 清除缓存
      this.clearCache(type)

      // 重新获取
      return await this.getHitokoto(type)
    } catch (error) {
      console.error('刷新一言失败:', error)
      return this.getRandomFallback()
    }
  }

  // 清除缓存
  clearCache(type = null) {
    try {
      const tyueCacheKey = type ? `${this.cacheKey}_${type}` : this.cacheKey
      wx.removeStorageSync(tyueCacheKey)
    } catch (error) {
      console.error('清除一言缓存失败:', error)
    }
  }
}

// 创建全局实例
const hitokotoManager = new HitokotoManager()

module.exports = {
  HitokotoManager,
  hitokotoManager
}
