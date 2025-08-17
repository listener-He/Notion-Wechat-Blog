// pages/reading-history/index.js
const { localStorageManager } = require('../../utils/local-storage.js')
const { animationManager } = require('../../utils/animation.js')

Page({
  data: {
    activeTab: 'history', // 'history' | 'favorites' | 'stats'
    historyList: [],
    favoritesList: [],
    readingStats: {},
    loading: true,
    error: '',
    // 排序和筛选
    sortBy: 'time', // 'time' | 'readingTime' | 'category'
    filterCategory: '',
    categories: [],
    showFilter: false
  },

  onLoad() {
    this.loadData()
    animationManager.fadeIn('.reading-history-container')
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData(true)
  },

  // 加载数据
  async loadData(isRefresh = false) {
    try {
      this.setData({ loading: true, error: '' })

      const [history, favorites] = await Promise.all([
        localStorageManager.getReadingHistory(),
        localStorageManager.getFavorites()
      ])

      // 处理数据
      const processedHistory = this.processHistoryData(history)
      const processedFavorites = this.processFavoritesData(favorites)
      const stats = this.processStatsData(history, favorites)
      const categories = this.extractCategories(history)

      this.setData({
        historyList: processedHistory,
        favoritesList: processedFavorites,
        readingStats: stats,
        categories,
        loading: false
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        })
      }
    } catch (error) {
      console.error('加载阅读数据失败:', error)
      this.setData({
        loading: false,
        error: '加载失败，请重试'
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }
    }
  },

  // 处理历史数据
  processHistoryData(history) {
    return history.map(item => ({
      ...item,
      formattedTime: this.formatTime(item.visitTime),
      formattedReadingTime: this.formatReadingTime(item.readingTime || 0),
      relativeTime: this.getRelativeTime(item.visitTime)
    })).sort((a, b) => {
      switch (this.data.sortBy) {
        case 'readingTime':
          return (b.readingTime || 0) - (a.readingTime || 0)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        default:
          return b.visitTime - a.visitTime
      }
    })
  },

  // 处理收藏数据
  processFavoritesData(favorites) {
    return favorites.map(item => ({
      ...item,
      formattedTime: this.formatTime(item.favoriteTime || Date.now())
    })).sort((a, b) => (b.favoriteTime || 0) - (a.favoriteTime || 0))
  },

  // 处理统计数据
  processStatsData(history, favorites) {
    const totalArticles = history.length
    const favoriteCount = favorites.length
    const totalReadingTime = history.reduce((sum, item) => sum + (item.readingTime || 0), 0)
    const averageReadingTime = totalArticles > 0 ? totalReadingTime / totalArticles : 0

    // 按分类统计
    const categoryStats = {}
    history.forEach(item => {
      if (item.category) {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = { count: 0, totalTime: 0 }
        }
        categoryStats[item.category].count++
        categoryStats[item.category].totalTime += (item.readingTime || 0)
      }
    })

    // 按月份统计
    const monthlyStats = {}
    history.forEach(item => {
      const month = new Date(item.visitTime).toISOString().slice(0, 7)
      if (!monthlyStats[month]) {
        monthlyStats[month] = { count: 0, totalTime: 0 }
      }
      monthlyStats[month].count++
      monthlyStats[month].totalTime += (item.readingTime || 0)
    })

    return {
      totalArticles,
      favoriteCount,
      totalReadingTime: this.formatReadingTime(totalReadingTime),
      averageReadingTime: this.formatReadingTime(averageReadingTime),
      categoryStats: Object.entries(categoryStats).map(([name, data]) => ({
        name,
        ...data,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0
      })),
      monthlyStats: Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => b.month.localeCompare(a.month))
    }
  },

  // 提取分类
  extractCategories(history) {
    return [...new Set(history.map(item => item.category).filter(Boolean))]
  },

  // 切换标签页
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // 排序切换
  onSortChange(e) {
    const sortBy = e.currentTarget.dataset.sort
    this.setData({ sortBy })
    const processedHistory = this.processHistoryData(this.data.historyList)
    this.setData({ historyList: processedHistory })
  },

  // 切换筛选面板
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  // 分类筛选
  onCategoryFilter(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ filterCategory: category === this.data.filterCategory ? '' : category })
    this.loadData()
  },

  // 点击文章
  onPostTap(e) {
    const { id, slug } = e.currentTarget.dataset
    const postId = id || slug

    if (postId) {
      wx.navigateTo({
        url: `/pages/post-detail/index?id=${postId}`
      })
    } else {
      wx.showToast({
        title: '文章不存在',
        icon: 'none'
      })
    }
  },

  // 删除历史记录
  async onDeleteHistory(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.historyList[index]

    try {
      await localStorageManager.removeFromHistory(item.id || item.slug)
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      this.loadData()
    } catch (error) {
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  },

  // 取消收藏
  async onRemoveFavorite(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.favoritesList[index]

    try {
      await localStorageManager.removeFavorite(item.id || item.slug)
      wx.showToast({
        title: '取消收藏成功',
        icon: 'success'
      })
      this.loadData()
    } catch (error) {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 清空历史记录
  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有阅读历史吗？此操作不可恢复。',
      success: async(res) => {
        if (res.confirm) {
          try {
            await localStorageManager.clearHistory()
            wx.showToast({
              title: '清空成功',
              icon: 'success'
            })
            this.loadData()
          } catch (error) {
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 清空收藏
  onClearFavorites() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有收藏吗？此操作不可恢复。',
      success: async(res) => {
        if (res.confirm) {
          try {
            await localStorageManager.clearFavorites()
            wx.showToast({
              title: '清空成功',
              icon: 'success'
            })
            this.loadData()
          } catch (error) {
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const isThisYear = date.getFullYear() === today.getFullYear()

    if (isToday) {
      return `今天 ${hours}:${minutes}`
    } else if (isThisYear) {
      return `${month}-${day} ${hours}:${minutes}`
    } else {
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
  },

  // 获取相对时间
  getRelativeTime(timestamp) {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return '很久以前'
  },

  // 格式化阅读时间
  formatReadingTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟`
    } else {
      return `${seconds}秒`
    }
  },

  // 重试
  retry() {
    this.loadData()
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '我的阅读足迹',
      path: '/pages/reading-history/index'
    }
  },

  onShareTimeline() {
    return {
      title: '我的阅读足迹'
    }
  }
})
