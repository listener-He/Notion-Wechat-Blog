// pages/about/index.js
const app = getApp()
const { animationManager } = require('../../utils/animation.js')
const { localStorageManager } = require('../../utils/local-storage.js')

Page({
  data: {
    siteInfo: {},
    statistics: {},
    socialLinks: {},
    socialLinksArray: [],
    latestPosts: [],
    loading: true,
    error: '',
    // 本地存储统计
    readingStats: {
      totalReadingTime: 0,
      totalArticles: 0,
      favoriteCount: 0,
      averageReadingTime: 0,
      longestReadingTime: 0,
      mostReadCategory: '',
      recentReadingDays: 0
    }
  },

  onLoad() {
    console.log('关于我页面加载')
    this.loadSiteInfo()
  },

  onShow() {
    // 页面显示时检查是否需要刷新数据
    if (!this.data.siteInfo.title) {
      this.loadSiteInfo()
    }
    // 加载阅读统计数据
    this.loadReadingStats()
  },

  onPullDownRefresh() {
    console.log('下拉刷新')
    this.loadSiteInfo(true)
  },

  // 加载站点信息
  async loadSiteInfo(isRefresh = false) {
    try {
      this.setData({
        loading: true,
        error: ''
      })

      // 检查缓存（3小时有效期）
      const cacheKey = 'about_page_cache'
      const cacheData = wx.getStorageSync(cacheKey)
      const now = Date.now()
      const cacheExpiry = 3 * 60 * 60 * 1000 // 3小时

      if (cacheData && !isRefresh && (now - cacheData.timestamp < cacheExpiry)) {
        console.log('使用缓存数据')
        this.processSiteInfo(cacheData.data)
        this.setData({ loading: false })
        return
      }

      // 先尝试从全局数据获取
      if (app.globalData.siteInfo && !isRefresh) {
        this.processSiteInfo(app.globalData.siteInfo)
        this.setData({ loading: false })
        return
      }

      // 从API获取数据
      const result = await app.request({
        url: '/site-info'
      })

      if (result.success) {
        // 缓存到全局数据
        app.globalData.siteInfo = result.data

        // 保存到本地缓存
        wx.setStorageSync(cacheKey, {
          data: result.data,
          timestamp: now
        })

        this.processSiteInfo(result.data)

        // 加载阅读统计数据
        this.loadReadingStats()

        if (isRefresh) {
          app.showSuccess('刷新成功')
        }
      } else {
        throw new Error(result.message || '获取站点信息失败')
      }
    } catch (error) {
      console.error('加载站点信息失败:', error)
      this.setData({
        error: error.message || '加载失败，请重试'
      })

      if (isRefresh) {
        app.showError('刷新失败')
      }
    } finally {
      this.setData({ loading: false })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }
    }
  },

  // 处理站点信息数据
  processSiteInfo(data) {
    const siteInfo = data.siteInfo
    const statistics = data.statistics
    const socialLinks = data.socialLinks
    const latestPosts = data.latestPosts

    // 处理社交链接数据
    const socialLinksArray = this.processSocialLinks(socialLinks)

    // 格式化时间数据
    const formattedStatistics = this.formatStatistics(statistics || {})
    const formattedLatestPosts = this.formatLatestPosts(latestPosts || [])
    const formattedSiteDays = this.formatSiteDays(statistics?.siteDays || 0)

    this.setData({
      siteInfo: siteInfo || {},
      statistics: formattedStatistics,
      socialLinks: socialLinks || {},
      socialLinksArray,
      latestPosts: formattedLatestPosts,
      formattedSiteDays
    })
  },

  // 格式化统计数据
  formatStatistics(statistics) {
    const formatted = Object.assign({}, statistics)

    // 格式化建站时间
    if (statistics.firstPostDate) {
      formatted.formattedFirstPostDate = this.formatDate(statistics.firstPostDate)
    }

    // 格式化最后更新时间
    if (statistics.latestPostDate) {
      formatted.formattedLatestPostDate = this.formatDate(statistics.latestPostDate)
    }

    return formatted
  },

  // 格式化最新文章列表
  formatLatestPosts(latestPosts) {
    return latestPosts.map(post => Object.assign({}, post, {
      formattedDate: this.formatDate(post.publishDate)
    }))
  },

  // 格式化建站天数为年+天
  formatSiteDays(days) {
    if (!days || days <= 0) return '0天'

    const years = Math.floor(days / 365)
    const remainingDays = days % 365

    if (years > 0) {
      return remainingDays > 0 ? `${years}年${remainingDays}天` : `${years}年`
    }
    return `${days}天`
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''

    try {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (error) {
      console.error('日期格式化错误:', error)
      return dateStr
    }
  },

  // 处理社交链接
  processSocialLinks(socialLinks) {
    if (!socialLinks || typeof socialLinks !== 'object') {
      return []
    }

    const socialConfig = {
      email: { icon: '📧', label: '邮箱' },
      github: { icon: '🐙', label: 'GitHub' },
      twitter: { icon: '🐦', label: 'Twitter' },
      telegram: { icon: '✈️', label: 'Telegram' },
      linkedin: { icon: '💼', label: 'LinkedIn' },
      instagram: { icon: '📷', label: 'Instagram' },
      youtube: { icon: '📺', label: 'YouTube' },
      wechat: { icon: '💬', label: '微信' },
      wechat_mp: { icon: '📱', label: '微信公众号' },
      weibo: { icon: '🔴', label: '微博' },
      qq: { icon: '🐧', label: 'QQ' },
      zhihu: { icon: '🔵', label: '知乎' },
      juejin: { icon: '💎', label: '掘金' },
      csdn: { icon: '📝', label: 'CSDN' },
      bilibili: { icon: '📺', label: 'B站' }
    }

    return Object.entries(socialLinks)
      .filter(([key, value]) => value && value.trim() !== '')
      .map(([key, value]) => ({
        type: key,
        value,
        icon: socialConfig[key]?.icon || '🔗',
        label: socialConfig[key]?.label || key.toUpperCase()
      }))
  },

  // 点击文章
  onPostTap(e) {
    const slug = e.currentTarget.dataset.slug
    const id = e.currentTarget.dataset.id
    console.log('点击文章:', slug, id)

    // 添加页面切换动画
    animationManager.pageTransition('slideLeft', () => {
      if (id) {
        // 如果slug为空但有ID，使用ID作为fallback
        wx.navigateTo({
          url: `/pages/post-detail/index?id=${id}`
        })
      } else {
        app.showError('文章信息不完整，无法访问')
      }
    })
  },

  // 点击社交链接
  onSocialTap(e) {
    const type = e.currentTarget.dataset.type
    const value = e.currentTarget.dataset.value
    console.log('点击社交链接:', type, value)

    if (!value) return

    switch (type) {
      case 'email':
        // 复制邮箱地址
        wx.setClipboardData({
          data: value,
          success: () => {
            app.showSuccess('邮箱地址已复制')
          }
        })
        break

      case 'github':
        // GitHub链接
        wx.setClipboardData({
          data: value.startsWith('http') ? value : `https://github.com/${value}`,
          success: () => {
            app.showSuccess('GitHub链接已复制')
          }
        })
        break

      case 'wechat':
        // 复制微信号
        wx.setClipboardData({
          data: value,
          success: () => {
            app.showSuccess('微信号已复制')
          }
        })
        break

      case 'wechat_mp':
        // 微信公众号
        wx.setClipboardData({
          data: value,
          success: () => {
            app.showSuccess('微信公众号已复制，可在微信中搜索关注')
          }
        })
        break

      case 'qq':
        // 复制QQ号
        wx.setClipboardData({
          data: value,
          success: () => {
            app.showSuccess('QQ号已复制')
          }
        })
        break

      case 'zhihu':
      case 'juejin':
      case 'csdn':
      case 'bilibili':
        // 其他平台链接
        wx.setClipboardData({
          data: value.startsWith('http') ? value : `https://${value}`,
          success: () => {
            app.showSuccess('链接已复制')
          }
        })
        break

      default:
        // 其他链接复制到剪贴板
        wx.setClipboardData({
          data: value,
          success: () => {
            app.showSuccess('链接已复制')
          }
        })
        break
    }
  },

  // 点击链接
  onLinkTap(e) {
    const url = e.currentTarget.dataset.url
    console.log('点击链接:', url)

    if (url) {
      wx.setClipboardData({
        data: url,
        success: () => {
          app.showSuccess('链接已复制')
        }
      })
    }
  },

  // 联系客服
  onContactTap(e) {
    console.log('联系客服:', e.detail)

    // 可以在这里处理客服会话的相关逻辑
    if (e.detail.errMsg === 'contact:ok') {
      console.log('成功进入客服会话')
    } else {
      console.log('进入客服会话失败:', e.detail.errMsg)
    }
  },

  // 重试
  retry() {
    this.loadSiteInfo()
  },

  // 分享
  onShareAppMessage() {
    const siteInfo = this.data.siteInfo
    return {
      title: `${siteInfo.author || '博主'}的博客`,
      path: '/pages/about/index',
      imageUrl: siteInfo.avatar
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const siteInfo = this.data.siteInfo
    return {
      title: `${siteInfo.author || '博主'}的博客 - ${siteInfo.title || '我的博客'}`,
      imageUrl: siteInfo.avatar
    }
  },

  // 加载阅读统计数据
  async loadReadingStats() {
    try {
      const history = await localStorageManager.getReadingHistory()
      const favorites = await localStorageManager.getFavorites()
      const stats = await localStorageManager.getReadingStatistics()

      // 计算统计数据
      const readingStats = this.calculateReadingStats(history, favorites, stats)

      this.setData({ readingStats })
    } catch (error) {
      console.error('加载阅读统计失败:', error)
    }
  },

  // 计算阅读统计数据
  calculateReadingStats(history, favorites, stats) {
    const totalArticles = history.length
    const favoriteCount = favorites.length
    const totalReadingTime = history.reduce((sum, item) => sum + (item.readingTime || 0), 0)
    const averageReadingTime = totalArticles > 0 ? Math.round(totalReadingTime / totalArticles) : 0
    const longestReadingTime = Math.max(...history.map(item => item.readingTime || 0), 0)

    // 计算最常阅读的分类
    const categoryCount = {}
    history.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
      }
    })
    const mostReadCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b, '暂无')

    // 计算最近阅读天数
    const recentDays = new Set()
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    history.forEach(item => {
      if (item.visitTime && item.visitTime > thirtyDaysAgo) {
        const day = new Date(item.visitTime).toDateString()
        recentDays.add(day)
      }
    })

    return {
      totalReadingTime: this.formatReadingTime(totalReadingTime),
      totalArticles,
      favoriteCount,
      averageReadingTime: this.formatReadingTime(averageReadingTime),
      longestReadingTime: this.formatReadingTime(longestReadingTime),
      mostReadCategory,
      recentReadingDays: recentDays.size
    }
  },

  // 格式化阅读时间
  formatReadingTime(milliseconds) {
    if (milliseconds < 60000) {
      return Math.round(milliseconds / 1000) + '秒'
    } else if (milliseconds < 3600000) {
      return Math.round(milliseconds / 60000) + '分钟'
    } else {
      const hours = Math.floor(milliseconds / 3600000)
      const minutes = Math.round((milliseconds % 3600000) / 60000)
      return hours + '小时' + (minutes > 0 ? minutes + '分钟' : '')
    }
  }
})
