// 本地存储管理器 - 处理阅读足迹、收藏夹、深夜读者分析等功能
const { StorageUtil } = require('./storage.js')

class LocalStorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      READING_HISTORY: 'reading_history',
      FAVORITES: 'favorites',
      MIDNIGHT_READER: 'midnight_reader',
      RANDOM_ENCOUNTER: 'random_encounter',
      USER_PREFERENCES: 'user_preferences'
    }

    // 初始化默认数据结构
    this.initDefaultData()
  }

  // 初始化默认数据结构
  async initDefaultData() {
    const defaultData = {
      [this.STORAGE_KEYS.READING_HISTORY]: [],
      [this.STORAGE_KEYS.FAVORITES]: [],
      [this.STORAGE_KEYS.MIDNIGHT_READER]: {
        totalMidnightReads: 0,
        lastMidnightRead: null,
        midnightReadDates: [],
        achievements: []
      },
      [this.STORAGE_KEYS.RANDOM_ENCOUNTER]: {
        encounterHistory: [],
        lastEncounterDate: null,
        totalEncounters: 0
      },
      [this.STORAGE_KEYS.USER_PREFERENCES]: {
        enableReadingHistory: true,
        enableMidnightAnalysis: true,
        maxHistoryItems: 100
      }
    }

    // 检查并初始化缺失的数据
    for (const [key, defaultValue] of Object.entries(defaultData)) {
      const existing = await StorageUtil.get(key)
      if (!existing) {
        await StorageUtil.set(key, defaultValue)
      }
    }
  }

  // ==================== 阅读足迹功能 ====================

  /**
   * 记录阅读足迹
   * @param {Object} postInfo - 文章信息
   * @param {number} readingTime - 阅读时长（秒）
   * @param {number} progress - 阅读进度（0-100）
   */
  async recordReadingHistory(postInfo, readingTime = 0, progress = 0) {
    try {
      const preferences = await this.getUserPreferences()
      if (!preferences.enableReadingHistory) return

      const history = await this.getReadingHistory()
      const now = Date.now()

      // 检查是否已存在该文章的记录
      const existingIndex = history.findIndex(item =>
        item.postId === postInfo.id || item.slug === postInfo.slug
      )

      const historyItem = {
        postId: postInfo.id,
        slug: postInfo.slug,
        title: postInfo.title,
        readAt: now,
        readingTime,
        progress,
        category: postInfo.category,
        tags: postInfo.tags || [],
        isMidnightRead: this.isMidnightTime(now)
      }

      if (existingIndex >= 0) {
        // 更新现有记录
        history[existingIndex] = {
          ...history[existingIndex],
          ...historyItem,
          totalReadingTime: (history[existingIndex].totalReadingTime || 0) + readingTime,
          readCount: (history[existingIndex].readCount || 1) + 1
        }
      } else {
        // 添加新记录
        historyItem.totalReadingTime = readingTime
        historyItem.readCount = 1
        history.unshift(historyItem)
      }

      // 限制历史记录数量
      if (history.length > preferences.maxHistoryItems) {
        history.splice(preferences.maxHistoryItems)
      }

      await StorageUtil.set(this.STORAGE_KEYS.READING_HISTORY, history)

      // 如果是深夜阅读，记录到深夜读者分析
      if (historyItem.isMidnightRead) {
        await this.recordMidnightReading(postInfo, readingTime)
      }

      return historyItem
    } catch (error) {
      console.error('记录阅读足迹失败:', error)
      return null
    }
  }

  /**
   * 更新阅读时间（兼容旧调用）
   * @param {Object} historyInfo - { id/slug/title/category/tags, readingTime, visitTime }
   */
  async updateReadingTime(historyInfo) {
    try {
      const postInfo = {
        id: historyInfo.id,
        slug: historyInfo.slug,
        title: historyInfo.title,
        category: historyInfo.category,
        tags: historyInfo.tags || []
      }
      const readingTime = historyInfo.readingTime || 0
      const progress = 0
      return await this.recordReadingHistory(postInfo, readingTime, progress)
    } catch (error) {
      console.error('更新阅读时间失败:', error)
      return null
    }
  }

  /**
   * 删除单条阅读历史（按 id 或 slug）
   */
  async removeFromHistory(postId) {
    try {
      const history = await this.getReadingHistory()
      const newHistory = history.filter(item => item.postId !== postId && item.slug !== postId)
      await StorageUtil.set(this.STORAGE_KEYS.READING_HISTORY, newHistory)
      return { success: true }
    } catch (error) {
      console.error('删除历史失败:', error)
      return { success: false }
    }
  }

  /**
   * 清空阅读历史
   */
  async clearHistory() {
    try {
      await StorageUtil.set(this.STORAGE_KEYS.READING_HISTORY, [])
      return { success: true }
    } catch (error) {
      console.error('清空历史失败:', error)
      return { success: false }
    }
  }

  /**
   * 获取阅读历史
   * @param {number} limit - 限制数量
   * @param {string} category - 分类筛选
   */
  async getReadingHistory(limit = 50, category = null) {
    try {
      const history = await StorageUtil.get(this.STORAGE_KEYS.READING_HISTORY) || []

      let filteredHistory = history
      if (category) {
        filteredHistory = history.filter(item => item.category === category)
      }

      return filteredHistory.slice(0, limit)
    } catch (error) {
      console.error('获取阅读历史失败:', error)
      return []
    }
  }

  /**
   * 获取阅读统计
   */
  async getReadingStatistics() {
    try {
      const history = await this.getReadingHistory()
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000
      const oneWeek = 7 * oneDay
      const oneMonth = 30 * oneDay

      const stats = {
        totalReads: history.length,
        totalReadingTime: history.reduce((sum, item) => sum + (item.totalReadingTime || 0), 0),
        todayReads: history.filter(item => now - item.readAt < oneDay).length,
        weekReads: history.filter(item => now - item.readAt < oneWeek).length,
        monthReads: history.filter(item => now - item.readAt < oneMonth).length,
        favoriteCategories: this.getFavoriteCategories(history),
        readingStreak: this.calculateReadingStreak(history),
        averageReadingTime: 0
      }

      if (stats.totalReads > 0) {
        stats.averageReadingTime = Math.round(stats.totalReadingTime / stats.totalReads)
      }

      return stats
    } catch (error) {
      console.error('获取阅读统计失败:', error)
      return {}
    }
  }

  // ==================== 文章收藏夹功能 ====================

  /**
   * 添加到收藏夹
   * @param {Object} postInfo - 文章信息
   */
  async addToFavorites(postInfo) {
    try {
      const favorites = await this.getFavorites()

      // 检查是否已收藏
      const exists = favorites.some(item =>
        item.postId === postInfo.id || item.slug === postInfo.slug
      )

      if (exists) {
        return { success: false, message: '文章已在收藏夹中' }
      }

      const favoriteItem = {
        postId: postInfo.id,
        slug: postInfo.slug,
        title: postInfo.title,
        category: postInfo.category,
        tags: postInfo.tags || [],
        addedAt: Date.now(),
        excerpt: postInfo.excerpt || ''
      }

      favorites.unshift(favoriteItem)
      await StorageUtil.set(this.STORAGE_KEYS.FAVORITES, favorites)

      return { success: true, message: '已添加到收藏夹', item: favoriteItem }
    } catch (error) {
      console.error('添加收藏失败:', error)
      return { success: false, message: '添加收藏失败' }
    }
  }

  /**
   * 从收藏夹移除
   * @param {string} postId - 文章ID或slug
   */
  async removeFromFavorites(postId) {
    try {
      const favorites = await this.getFavorites()
      const newFavorites = favorites.filter(item =>
        item.postId !== postId && item.slug !== postId
      )

      if (newFavorites.length === favorites.length) {
        return { success: false, message: '文章不在收藏夹中' }
      }

      await StorageUtil.set(this.STORAGE_KEYS.FAVORITES, newFavorites)
      return { success: true, message: '已从收藏夹移除' }
    } catch (error) {
      console.error('移除收藏失败:', error)
      return { success: false, message: '移除收藏失败' }
    }
  }

  /**
   * 获取收藏夹列表
   * @param {string} category - 分类筛选
   */
  async getFavorites(category = null) {
    try {
      const favorites = await StorageUtil.get(this.STORAGE_KEYS.FAVORITES) || []

      if (category) {
        return favorites.filter(item => item.category === category)
      }

      return favorites
    } catch (error) {
      console.error('获取收藏夹失败:', error)
      return []
    }
  }

  /**
   * 检查文章是否已收藏
   * @param {string} postId - 文章ID或slug
   */
  async isFavorited(postId) {
    try {
      const favorites = await this.getFavorites()
      return favorites.some(item => item.postId === postId || item.slug === postId)
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      return false
    }
  }

  /**
   * 清空收藏夹
   */
  async clearFavorites() {
    try {
      await StorageUtil.set(this.STORAGE_KEYS.FAVORITES, [])
      return { success: true }
    } catch (error) {
      console.error('清空收藏夹失败:', error)
      return { success: false }
    }
  }

  // ==================== 深夜读者分析功能 ====================

  /**
   * 记录深夜阅读
   * @param {Object} postInfo - 文章信息
   * @param {number} readingTime - 阅读时长
   */
  async recordMidnightReading(postInfo, readingTime) {
    try {
      const preferences = await this.getUserPreferences()
      if (!preferences.enableMidnightAnalysis) return

      const midnightData = await StorageUtil.get(this.STORAGE_KEYS.MIDNIGHT_READER) || {
        totalMidnightReads: 0,
        lastMidnightRead: null,
        midnightReadDates: [],
        achievements: []
      }

      const now = Date.now()
      const dateStr = new Date(now).toDateString()

      midnightData.totalMidnightReads += 1
      midnightData.lastMidnightRead = now

      // 记录深夜阅读日期（避免重复）
      if (!midnightData.midnightReadDates.includes(dateStr)) {
        midnightData.midnightReadDates.push(dateStr)
      }

      // 检查并解锁成就
      await this.checkMidnightAchievements(midnightData)

      await StorageUtil.set(this.STORAGE_KEYS.MIDNIGHT_READER, midnightData)

      return midnightData
    } catch (error) {
      console.error('记录深夜阅读失败:', error)
      return null
    }
  }

  /**
   * 获取深夜读者分析数据
   */
  async getMidnightReaderAnalysis() {
    try {
      const midnightData = await StorageUtil.get(this.STORAGE_KEYS.MIDNIGHT_READER) || {
        totalMidnightReads: 0,
        lastMidnightRead: null,
        midnightReadDates: [],
        achievements: []
      }

      const analysis = {
        ...midnightData,
        midnightReadDays: midnightData.midnightReadDates.length,
        longestStreak: this.calculateMidnightStreak(midnightData.midnightReadDates),
        readerLevel: this.getMidnightReaderLevel(midnightData.totalMidnightReads),
        nextAchievement: this.getNextMidnightAchievement(midnightData.totalMidnightReads)
      }

      return analysis
    } catch (error) {
      console.error('获取深夜读者分析失败:', error)
      return {}
    }
  }

  // ==================== 随机遇见抽卡式阅读功能 ====================

  /**
   * 随机遇见文章（抽卡式）
   * @param {Array} allPosts - 所有文章列表
   * @param {Object} options - 选项配置
   */
  async randomEncounter(allPosts, options = {}) {
    try {
      const {
        excludeRead = true,
        preferCategory = null,
        preferTags = [],
        rarityBonus = true
      } = options

      let availablePosts = [...allPosts]

      // 排除已读文章
      if (excludeRead) {
        const history = await this.getReadingHistory()
        const readPostIds = new Set(history.map(item => item.postId || item.slug))
        availablePosts = availablePosts.filter(post =>
          !readPostIds.has(post.id) && !readPostIds.has(post.slug)
        )
      }

      if (availablePosts.length === 0) {
        return { success: false, message: '没有可遇见的新文章' }
      }

      // 应用偏好筛选和权重
      const weightedPosts = this.applyEncounterWeights(availablePosts, {
        preferCategory,
        preferTags,
        rarityBonus
      })

      // 随机选择
      const selectedPost = this.weightedRandomSelect(weightedPosts)

      // 记录遇见历史
      await this.recordEncounter(selectedPost)

      return {
        success: true,
        post: selectedPost,
        encounterType: this.getEncounterType(selectedPost),
        message: this.getEncounterMessage(selectedPost)
      }
    } catch (error) {
      console.error('随机遇见失败:', error)
      return { success: false, message: '遇见失败，请稍后再试' }
    }
  }

  /**
   * 记录遇见历史
   * @param {Object} post - 遇见的文章
   */
  async recordEncounter(post) {
    try {
      const encounterData = await StorageUtil.get(this.STORAGE_KEYS.RANDOM_ENCOUNTER) || {
        encounterHistory: [],
        lastEncounterDate: null,
        totalEncounters: 0
      }

      const encounter = {
        postId: post.id,
        slug: post.slug,
        title: post.title,
        category: post.category,
        encounteredAt: Date.now(),
        encounterType: this.getEncounterType(post)
      }

      encounterData.encounterHistory.unshift(encounter)
      encounterData.lastEncounterDate = Date.now()
      encounterData.totalEncounters += 1

      // 限制历史记录数量
      if (encounterData.encounterHistory.length > 50) {
        encounterData.encounterHistory.splice(50)
      }

      await StorageUtil.set(this.STORAGE_KEYS.RANDOM_ENCOUNTER, encounterData)

      return encounter
    } catch (error) {
      console.error('记录遇见历史失败:', error)
      return null
    }
  }

  /**
   * 获取遇见历史
   */
  async getEncounterHistory() {
    try {
      const encounterData = await StorageUtil.get(this.STORAGE_KEYS.RANDOM_ENCOUNTER) || {
        encounterHistory: [],
        lastEncounterDate: null,
        totalEncounters: 0
      }

      return encounterData
    } catch (error) {
      console.error('获取遇见历史失败:', error)
      return { encounterHistory: [], lastEncounterDate: null, totalEncounters: 0 }
    }
  }

  // ==================== 用户偏好设置 ====================

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences() {
    try {
      const preferences = await StorageUtil.get(this.STORAGE_KEYS.USER_PREFERENCES) || {
        enableReadingHistory: true,
        enableMidnightAnalysis: true,
        maxHistoryItems: 100
      }

      return preferences
    } catch (error) {
      console.error('获取用户偏好失败:', error)
      return {
        enableReadingHistory: true,
        enableMidnightAnalysis: true,
        maxHistoryItems: 100
      }
    }
  }

  /**
   * 更新用户偏好设置
   * @param {Object} newPreferences - 新的偏好设置
   */
  async updateUserPreferences(newPreferences) {
    try {
      const currentPreferences = await this.getUserPreferences()
      const updatedPreferences = { ...currentPreferences, ...newPreferences }

      await StorageUtil.set(this.STORAGE_KEYS.USER_PREFERENCES, updatedPreferences)
      return { success: true, preferences: updatedPreferences }
    } catch (error) {
      console.error('更新用户偏好失败:', error)
      return { success: false, message: '更新偏好设置失败' }
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 判断是否为深夜时间（22:00-06:00）
   * @param {number} timestamp - 时间戳
   */
  isMidnightTime(timestamp) {
    const hour = new Date(timestamp).getHours()
    return hour >= 22 || hour < 6
  }

  /**
   * 获取最喜欢的分类
   * @param {Array} history - 阅读历史
   */
  getFavoriteCategories(history) {
    const categoryCount = {}
    history.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
      }
    })

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))
  }

  /**
   * 计算阅读连续天数
   * @param {Array} history - 阅读历史
   */
  calculateReadingStreak(history) {
    if (history.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    const currentDate = new Date(today)

    while (true) {
      const dayStart = currentDate.getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      const hasReadToday = history.some(item =>
        item.readAt >= dayStart && item.readAt < dayEnd
      )

      if (hasReadToday) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * 检查深夜阅读成就
   * @param {Object} midnightData - 深夜阅读数据
   */
  async checkMidnightAchievements(midnightData) {
    const achievements = [
      { id: 'night_owl_1', name: '夜猫子', condition: 1, description: '首次深夜阅读' },
      { id: 'night_owl_10', name: '深夜学者', condition: 10, description: '深夜阅读10篇文章' },
      { id: 'night_owl_50', name: '夜读达人', condition: 50, description: '深夜阅读50篇文章' },
      { id: 'night_owl_100', name: '深夜大师', condition: 100, description: '深夜阅读100篇文章' }
    ]

    achievements.forEach(achievement => {
      if (midnightData.totalMidnightReads >= achievement.condition &&
          !midnightData.achievements.includes(achievement.id)) {
        midnightData.achievements.push(achievement.id)
      }
    })
  }

  /**
   * 计算深夜阅读连续天数
   * @param {Array} midnightReadDates - 深夜阅读日期数组
   */
  calculateMidnightStreak(midnightReadDates) {
    if (midnightReadDates.length === 0) return 0

    const sortedDates = midnightReadDates
      .map(dateStr => new Date(dateStr).getTime())
      .sort((a, b) => b - a)

    let streak = 1
    const oneDay = 24 * 60 * 60 * 1000

    for (let i = 1; i < sortedDates.length; i++) {
      const diff = sortedDates[i - 1] - sortedDates[i]
      if (diff <= oneDay * 2) { // 允许1天的间隔
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * 获取深夜读者等级
   * @param {number} totalReads - 总深夜阅读数
   */
  getMidnightReaderLevel(totalReads) {
    if (totalReads >= 100) return { level: 5, name: '深夜大师', next: null }
    if (totalReads >= 50) return { level: 4, name: '夜读达人', next: 100 }
    if (totalReads >= 20) return { level: 3, name: '深夜学者', next: 50 }
    if (totalReads >= 5) return { level: 2, name: '夜猫子', next: 20 }
    return { level: 1, name: '初夜读者', next: 5 }
  }

  /**
   * 获取下一个深夜成就
   * @param {number} totalReads - 总深夜阅读数
   */
  getNextMidnightAchievement(totalReads) {
    const achievements = [1, 5, 10, 20, 50, 100]
    const next = achievements.find(target => target > totalReads)
    return next ? { target: next, remaining: next - totalReads } : null
  }

  /**
   * 应用遇见权重
   * @param {Array} posts - 文章列表
   * @param {Object} options - 选项
   */
  applyEncounterWeights(posts, options) {
    return posts.map(post => {
      let weight = 1

      // 分类偏好权重
      if (options.preferCategory && post.category === options.preferCategory) {
        weight *= 2
      }

      // 标签偏好权重
      if (options.preferTags && options.preferTags.length > 0) {
        const matchingTags = (post.tags || []).filter(tag =>
          options.preferTags.includes(tag)
        ).length
        weight *= (1 + matchingTags * 0.5)
      }

      // 稀有度加成
      if (options.rarityBonus) {
        const ageInDays = (Date.now() - new Date(post.createdAt).getTime()) / (24 * 60 * 60 * 1000)
        if (ageInDays > 365) weight *= 1.5 // 老文章加成
        if (ageInDays < 7) weight *= 1.3 // 新文章加成
      }

      return { ...post, weight }
    })
  }

  /**
   * 权重随机选择
   * @param {Array} weightedItems - 带权重的项目列表
   */
  weightedRandomSelect(weightedItems) {
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight

    for (const item of weightedItems) {
      random -= item.weight
      if (random <= 0) {
        return item
      }
    }

    return weightedItems[weightedItems.length - 1]
  }

  /**
   * 获取遇见类型
   * @param {Object} post - 文章
   */
  getEncounterType(post) {
    const ageInDays = (Date.now() - new Date(post.createdAt).getTime()) / (24 * 60 * 60 * 1000)

    if (ageInDays < 7) return 'new'
    if (ageInDays > 365) return 'classic'
    if (Math.random() < 0.1) return 'rare'
    return 'normal'
  }

  /**
   * 获取遇见消息
   * @param {Object} post - 文章
   */
  getEncounterMessage(post) {
    const messages = {
      new: ['发现了一篇新鲜出炉的文章！', '新的知识在等待你的探索', '刚刚发布的内容，你是最早的读者之一'],
      classic: ['时光荏苒，经典永存', '这是一篇经过时间考验的好文章', '让我们重温这篇经典之作'],
      rare: ['稀有发现！这篇文章很少被人遇见', '你的运气不错，发现了隐藏的宝藏', '这是一次特殊的遇见'],
      normal: ['又一次美妙的遇见', '知识的海洋中，总有惊喜等待', '让我们开始这次阅读之旅']
    }

    const type = this.getEncounterType(post)
    const typeMessages = messages[type] || messages.normal
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }

  /**
   * 清理过期数据
   * @param {number} daysToKeep - 保留天数
   */
  async cleanupExpiredData(daysToKeep = 90) {
    try {
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)

      // 清理阅读历史
      const history = await this.getReadingHistory()
      const cleanHistory = history.filter(item => item.readAt > cutoffTime)
      await StorageUtil.set(this.STORAGE_KEYS.READING_HISTORY, cleanHistory)

      // 清理遇见历史
      const encounterData = await this.getEncounterHistory()
      encounterData.encounterHistory = encounterData.encounterHistory.filter(
        item => item.encounteredAt > cutoffTime
      )
      await StorageUtil.set(this.STORAGE_KEYS.RANDOM_ENCOUNTER, encounterData)

      return { success: true, message: '数据清理完成' }
    } catch (error) {
      console.error('清理过期数据失败:', error)
      return { success: false, message: '数据清理失败' }
    }
  }
}

// 创建全局实例
const localStorageManager = new LocalStorageManager()

// 添加别名方法以保持向后兼容
localStorageManager.addToHistory = localStorageManager.recordReadingHistory
localStorageManager.removeFavorite = localStorageManager.removeFromFavorites

module.exports = { localStorageManager }
