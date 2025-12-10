// pages/posts/index.js
const app = getApp()
const { StorageUtil, CACHE_TIME, CACHE_KEYS } = require('../../utils/storage.js')
const { hitokotoManager } = require('../../utils/hitokoto.js')
const { emotionManager } = require('../../utils/emotion.js')
const { animationManager } = require('../../utils/animation.js')
const { localStorageManager } = require('../../utils/local-storage.js')

// 标签渐变调色盘与生成函数（顶层定义）
const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#36d1dc', '#5b86e5'],
  ['#ff9966', '#ff5e62'],
  ['#00b09b', '#96c93d'],
  ['#f7971e', '#ffd200'],
  ['#56ab2f', '#a8e063'],
  ['#2b5876', '#4e4376'],
  ['#bdc3c7', '#2c3e50']
]

function generateTagGradient(tagName = '') {
  let hash = 0
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const pair = GRADIENTS[Math.abs(hash) % GRADIENTS.length]
  return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`
}

Page({
  data: {
    posts: [],
    categories: [],
    tags: [],
    loading: true,
    loadingMore: false,
    showSkeleton: false,
    searchKeyword: '',
    selectedCategory: '',
    selectedTags: [],
    // 移除未使用的标签筛选与展开状态
    showSearchHistory: false,
    suggestionsVisible: false,
    suggestionCategories: [],
    suggestionTags: [],
    searchHistory: [],
    currentPage: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
    enableCategoryScroll: false,
    // 主题相关
    currentTheme: null,
    themeTransition: false,
    themeOpacity: 1,
    // 一言相关
    hitokoto: null,
    showTimeGreeting: false,
    timeGreeting: '',
    // 情感化互动相关
    emotionalGreeting: null,
    showEmotionalGreeting: false,
    authorStatus: null,
    specialDateEgg: null,
    midnightReaderEgg: null,
    // 本地存储相关
    readingHistory: [],
    favoriteIds: [],
    showHistorySection: false,
    coverLoadedMap: {},
    exhausted: false,
    coverFallbackMap: {},
  },
  

  

  onLoad() {
    console.log('文章页面加载')

    // 初始化主题
    this.initTheme()
    this.coverTimers = {}

    // 初始化情感化互动
    this.initEmotionalInteraction()

    // 检查时间场景彩蛋
    this.checkTimeGreeting()

    // 加载一言
    this.loadHitokoto()

    this.loadSearchHistory()
    this.loadFilterPreferences()
    this.loadInitialData()
    this.initLoadObserver()
    // 标记已经加载过初始数据
    this.hasLoadedInitialData = true
  },

  onReady() {
    this.attachLoadObserver()
  },

  onUnload() {
    this.destroyLoadObserver()
  },

  onShow() {
    // 检查主题是否需要更新
    this.checkThemeUpdate()

    // 页面显示时刷新数据（如果需要）
    // 避免首次加载时重复调用
    if (this.data.posts.length === 0 && !this.hasLoadedInitialData) {
      this.loadInitialData()
      this.hasLoadedInitialData = true
    }

    // 加载本地存储数据
    this.loadLocalStorageData()
  },

  onPullDownRefresh() {
    console.log('下拉刷新')
    this.refreshData()
  },

  // 预加载观察器
  initLoadObserver() {
    try {
      if (this.loadObserver) return
      this.loadObserver = wx.createIntersectionObserver(this)
      this.attachLoadObserver()
    } catch (e) {
      console.error('初始化预加载观察器失败:', e)
    }
  },

  attachLoadObserver() {
    try {
      if (!this.loadObserver) return
      if (this.loadObserver && this.loadObserver.disconnect) {
        this.loadObserver.disconnect()
      }
      const callback = (res) => {
        if (res && res.intersectionRatio > 0) {
          if (this.data.hasMore && !this.data.loadingMore && !this.data.exhausted) {
            this.loadMore()
          }
        }
      }
      this.loadObserver.relativeToViewport({ bottom: 300 }).observe('#loadMoreSentinel', callback)
    } catch (e) {
      // 目标元素可能尚未渲染，下一帧重试
      try {
        wx.nextTick(() => {
          try {
            if (this.loadObserver) {
              this.loadObserver.relativeToViewport({ bottom: 300 }).observe('#loadMoreSentinel', (res) => {
                if (res && res.intersectionRatio > 0) {
                  if (this.data.hasMore && !this.data.loadingMore && !this.data.exhausted) {
                    this.loadMore()
                  }
                }
              })
            }
          } catch (_err) {}
        })
      } catch (_e) {}
    }
  },

  destroyLoadObserver() {
    try {
      if (this.loadObserver && this.loadObserver.disconnect) {
        this.loadObserver.disconnect()
      }
      this.loadObserver = null
    } catch (e) {
      console.error('销毁预加载观察器失败:', e)
    }
  },

  // 加载初始数据
  async loadInitialData() {
    try {
      this.setData({
        loading: true,
        showSkeleton: true
      })

      // 并行加载分类、标签和文章数据
      await Promise.all([
        this.loadCategories(),
        this.loadTags()
      ])

      // 加载文章列表
      await this.loadPosts(true)
    } catch (error) {
      console.error('加载初始数据失败:', error)
      app.showError('加载数据失败')
    } finally {
      this.setData({
        loading: false,
        showSkeleton: false
      })
    }
  },

  // 刷新数据
  async refreshData() {
    try {
      // 清除缓存，确保获取最新数据
      StorageUtil.remove(CACHE_KEYS.CATEGORIES)
      StorageUtil.remove(CACHE_KEYS.TAGS)

      this.setData({
        currentPage: 1,
        posts: [],
        hasMore: true
      })

      // 重置加载标记
      this.hasLoadedInitialData = false

      // 重新加载所有数据
      await Promise.all([
        this.loadCategories(),
        this.loadTags()
      ])

      await this.loadPosts(true)
      wx.stopPullDownRefresh()
      app.showSuccess('刷新成功')
    } catch (error) {
      console.error('刷新失败:', error)
      app.showError('刷新失败')
      wx.stopPullDownRefresh()
    }
  },

  // 加载分类列表
  async loadCategories() {
    try {
      // 先尝试从缓存获取
      const cachedCategories = StorageUtil.get(CACHE_KEYS.CATEGORIES)
      if (cachedCategories) {
        // 计算总分类数（包括"全部"）
        const totalCategories = cachedCategories.length + 1
        this.setData({
          categories: cachedCategories,
          enableCategoryScroll: totalCategories > 3
        })
        console.log('从缓存加载分类列表')
        return { success: true, data: { categories: cachedCategories } }
      }

      const result = await app.request({
        url: '/categories'
      })

      if (result.success) {
        const categories = result.data.categories || []
        // 缓存分类数据，缓存30天
        StorageUtil.set(CACHE_KEYS.CATEGORIES, categories, CACHE_TIME.MONTH)

        // 计算总分类数（包括"全部"）
        const totalCategories = categories.length + 1
        this.setData({
          categories,
          enableCategoryScroll: totalCategories > 3
        })
        console.log('从网络加载分类列表')
      }
      return result
    } catch (error) {
      console.error('加载分类失败:', error)
      return { success: false }
    }
  },

  // 加载标签列表
  async loadTags() {
    try {
      // 先尝试从缓存获取
      const cachedTags = StorageUtil.get(CACHE_KEYS.TAGS)
      if (cachedTags) {
        this.setData({
          tags: cachedTags
        })
        console.log('从缓存加载标签列表')
        return { success: true, data: { tags: cachedTags } }
      }

      const result = await app.request({
        url: '/tags'
      })

      if (result.success) {
        const tags = result.data.tags || []
        // 为标签添加颜色
        const tagsWithColors = tags.map(tag => {
          if (typeof tag === 'string') {
            return {
              name: tag,
              gradient: generateTagGradient(tag)
            }
          } else if (tag && tag.name) {
            return Object.assign({}, tag, {
              gradient: tag.gradient || generateTagGradient(tag.name)
            })
          }
          return tag
        })

        // 缓存标签数据，缓存7天
        StorageUtil.set(CACHE_KEYS.TAGS, tagsWithColors, CACHE_TIME.WEEK)

        this.setData({
          tags: tagsWithColors
        })
        console.log('从网络加载标签列表')
      }
      return result
    } catch (error) {
      console.error('加载标签失败:', error)
      return { success: false }
    }
  },

  // 加载文章列表
  async loadPosts(reset = false) {
    try {
      if (reset) {
        this.setData({ currentPage: 1 })
        // 重置封面状态和计时器
        this.resetCoverState()
      }

    const params = {
      page: reset ? 1 : this.data.currentPage,
      pageSize: this.data.pageSize
    }

    // 添加筛选条件
    if (this.data.selectedCategory) {
      params.category = this.data.selectedCategory
    }
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword
    }
    if (this.data.selectedTags && this.data.selectedTags.length > 0) {
      params.tags = this.data.selectedTags
    }

      const result = await app.request({
        url: '/posts',
        data: params
      })

      if (result.success) {
        const newPosts = result.data.posts || []
        const pagination = result.data.pagination || {}

        // 为文章标签添加颜色
        const postsWithColors = newPosts.map(post => {
          if (post.tags && Array.isArray(post.tags)) {
            post.tags = post.tags.map(tag => {
              if (typeof tag === 'string') {
                return {
                  name: tag,
                  gradient: generateTagGradient(tag)
                }
              } else if (tag && tag.name) {
                return Object.assign({}, tag, {
                  gradient: tag.gradient || generateTagGradient(tag.name)
                })
              }
              return tag
            })
          }
          return post
        })

        const hasMore = (typeof pagination.hasNext !== 'undefined')
          ? !!pagination.hasNext
          : (typeof pagination.total === 'number' && (typeof pagination.current === 'number' || typeof pagination.page === 'number'))
            ? (((pagination.current || pagination.page || (reset ? 1 : this.data.currentPage)) * this.data.pageSize) < pagination.total)
            : (newPosts.length >= this.data.pageSize)

        const nextPosts = reset ? postsWithColors : this.data.posts.concat(postsWithColors)

        this.setData({
          posts: nextPosts,
          total: pagination.total || nextPosts.length,
          hasMore,
          exhausted: !hasMore,
          currentPage: pagination.current || (reset ? 1 : this.data.currentPage)
        })

        // 更新文章的收藏和阅读状态
        this.updatePostsStatus()

        // 为当前批次封面设置超时兜底
        this.scheduleCoverFallbackTimers(postsWithColors)

        // 确保观察器已正确附加
        wx.nextTick(() => {
          this.attachLoadObserver()
        })
      }

      return result
    } catch (error) {
      console.error('加载文章失败:', error)
      throw error
    }
  },

  // 封面加载完成，触发渐入
  onCoverLoad(e) {
    const id = e.currentTarget.dataset.id
    const map = Object.assign({}, this.data.coverLoadedMap, { [id]: true })
    this.setData({ coverLoadedMap: map })
    if (this.coverTimers && this.coverTimers[id]) {
      clearTimeout(this.coverTimers[id])
      delete this.coverTimers[id]
    }
  },

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.coverFallbackMap[id]) {
      const loaded = Object.assign({}, this.data.coverLoadedMap, { [id]: true })
      this.setData({ coverLoadedMap: loaded })
      return
    }
    const url = this.getFallbackCover(id)
    const map = Object.assign({}, this.data.coverFallbackMap, { [id]: url })
    this.setData({ coverFallbackMap: map })
    if (this.coverTimers && this.coverTimers[id]) {
      clearTimeout(this.coverTimers[id])
      delete this.coverTimers[id]
    }
  },

  getFallbackCover(id) {
    const seed = encodeURIComponent(id || (Date.now() + ''))
    return `https://picsum.photos/seed/${seed}/600/360`
  },

  scheduleCoverFallbackTimers(batch) {
    if (!Array.isArray(batch)) return
    if (!this.coverTimers) this.coverTimers = {}
    batch.forEach(post => {
      const id = post && (post.id || post.slug)
      const hasCover = !!(post && (post.pageCover || post.pageCoverThumbnail))
      if (!id || !hasCover) return
      if (this.data.coverLoadedMap[id] || this.data.coverFallbackMap[id] || this.coverTimers[id]) return
      this.coverTimers[id] = setTimeout(() => {
        if (!this.data.coverLoadedMap[id]) {
          const url = this.getFallbackCover(id)
          const map = Object.assign({}, this.data.coverFallbackMap, { [id]: url })
          this.setData({ coverFallbackMap: map })
        }
      }, 2000)
    })
  },

  resetCoverState() {
    if (this.coverTimers) {
      Object.keys(this.coverTimers).forEach(id => {
        clearTimeout(this.coverTimers[id])
      })
      this.coverTimers = {}
    }
    this.setData({ coverLoadedMap: {}, coverFallbackMap: {} })
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = (e.detail.value || '').trim()
    this.setData({ searchKeyword: keyword })

    if (!keyword) {
      this.setData({ suggestionsVisible: false, suggestionCategories: [], suggestionTags: [] })
      return
    }

    const kw = keyword.toLowerCase()
    const cats = (this.data.categories || []).filter(c => (c.name || '').toLowerCase().includes(kw)).slice(0, 6)
    const tags = (this.data.tags || []).filter(t => ((t.name || t) + '').toLowerCase().includes(kw)).slice(0, 8)
    this.setData({ suggestionCategories: cats, suggestionTags: tags, suggestionsVisible: (cats.length + tags.length) > 0 })
  },

  // 搜索框获得焦点
  onSearchFocus() {
    this.setData({
      showSearchHistory: true
    })
  },

  // 搜索框失去焦点
  onSearchBlur() {
    // 延迟隐藏，避免点击历史记录时立即隐藏
    setTimeout(() => {
      this.setData({
        showSearchHistory: false
      })
    }, 200)
  },

  // 执行搜索
  async onSearch() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) return

    console.log('搜索:', keyword)

    // 保存搜索历史
    this.saveSearchHistory(keyword)

    try {
      this.setData({
        loading: true,
        showSearchHistory: false
      })
      await this.loadPosts(true)
    } catch (error) {
      app.showError('搜索失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 选择分类
  async onCategorySelect(e) {
    const category = e.currentTarget.dataset.category
    console.log('选择分类:', category)

    if (category === this.data.selectedCategory) {
      return
    }

    try {
      this.setData({
        selectedCategory: category,
        loading: true
      })
      this.saveFilterPreferences()
      await this.loadPosts(true)
    } catch (error) {
      app.showError('筛选失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 选择标签
  async onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag
    console.log('选择标签:', tag)

    try {
      let selected = [...this.data.selectedTags]
      if (!tag || tag === '') {
        selected = []
      } else {
        const idx = selected.indexOf(tag)
        if (idx >= 0) {
          selected.splice(idx, 1)
        } else {
          selected.push(tag)
        }
      }

      this.setData({
        selectedTags: selected,
        selectedCategory: selected.length > 0 ? '' : this.data.selectedCategory,
        loading: true
      })
      this.saveFilterPreferences()
      await this.loadPosts(true)
    } catch (error) {
      app.showError('筛选失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 搜索联想点击-分类
  async onSuggestionTapCategory(e) {
    const category = e.currentTarget.dataset.category
    try {
      this.setData({
        selectedCategory: category,
        suggestionsVisible: false,
        loading: true
      })
      this.saveFilterPreferences()
      await this.loadPosts(true)
    } catch (error) {
      app.showError('筛选失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 搜索联想点击-标签
  async onSuggestionTapTag(e) {
    const tag = e.currentTarget.dataset.tag
    try {
      this.setData({
        selectedCategory: '',
        searchKeyword: tag,
        suggestionsVisible: false,
        loading: true,
        hasMore: true,
        exhausted: false
      })
      this.saveFilterPreferences()
      await this.loadPosts(true)
    } catch (error) {
      app.showError('筛选失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  

  // 清除分类
  async clearCategory() {
    try {
      this.setData({ selectedCategory: '', loading: true, hasMore: true, exhausted: false })
      this.saveFilterPreferences()
      await this.loadPosts(true)
    } catch (error) {
      app.showError('清除分类失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  

  // 清空筛选
  async clearFilters() {
    try {
      this.setData({
        selectedCategory: '',
        searchKeyword: '',
        loading: true,
        hasMore: true,
        exhausted: false
      })
      this.saveFilterPreferences()
      await this.loadPosts(true)
    } catch (error) {
      app.showError('清空筛选失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 分类长按提示
  onCategoryLongPress(e) {
    const name = e.currentTarget.dataset.category
    const item = (this.data.categories || []).find(c => c.name === name)
    const count = item ? (item.count || 0) : 0
    wx.showToast({ title: `${name || '全部'} · ${count} 篇`, icon: 'none', duration: 1500 })
  },

  // 加载更多
  async loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) {
      return
    }

    try {
      this.setData({
        loadingMore: true,
        currentPage: this.data.currentPage + 1
      })

      await this.loadPosts(false)
    } catch (error) {
      console.error('加载更多失败:', error)
      app.showError('加载更多失败')
      // 回退页码
      this.setData({
        currentPage: this.data.currentPage - 1
      })
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  // 点击文章
  onPostTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('点击文章:', id)

    animationManager.pageTransition('slideLeft', () => {
      if (id && id.trim() !== '') {
        wx.navigateTo({
          url: `/pages/post-detail/index?id=${id}`
        })
      } else {
        app.showError('文章信息不完整，无法访问')
      }
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '我的博客 - 文章列表',
      path: '/pages/posts/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '我的博客 - 精彩文章分享'
    }
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('search_history') || []
      console.log('加载搜索历史:', history)

      // 如果没有搜索历史，添加一些示例数据用于测试
      if (history.length === 0) {
        const testHistory = ['JavaScript', 'Vue.js', '前端开发', 'React']
        wx.setStorageSync('search_history', testHistory)
        this.setData({
          searchHistory: testHistory.slice(0, 8)
        })
        console.log('添加测试搜索历史:', testHistory)
      } else {
        this.setData({
          searchHistory: history.slice(0, 8) // 最多显示8个历史记录
        })
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    try {
      let history = wx.getStorageSync('search_history') || []

      // 移除重复项
      history = history.filter(item => item !== keyword)

      // 添加到开头
      history.unshift(keyword)

      // 限制历史记录数量
      history = history.slice(0, 10)

      // 保存到本地存储
      wx.setStorageSync('search_history', history)

      // 更新页面数据
      this.setData({
        searchHistory: history.slice(0, 8)
      })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 点击历史记录
  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({
      searchKeyword: keyword,
      showSearchHistory: false
    })
    this.onSearch()
  },

  // 清空搜索历史
  clearSearchHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('search_history')
            this.setData({
              searchHistory: [],
              showSearchHistory: false
            })
            wx.showToast({
              title: '已清空',
              icon: 'success'
            })
          } catch (error) {
            console.error('清空搜索历史失败:', error)
          }
        }
      }
    })
  },

  // 主题相关方法
  initTheme() {
    try {
      const theme = wx.getStorageSync('current_theme') || 'light'
      this.setData({ currentTheme: theme })
      console.log('初始化主题:', theme)
    } catch (error) {
      console.error('初始化主题失败:', error)
      this.setData({ currentTheme: 'light' })
    }
  },

  checkThemeUpdate() {
    try {
      const theme = wx.getStorageSync('current_theme') || 'light'
      if (theme !== this.data.currentTheme) {
        this.setData({
          themeTransition: true,
          themeOpacity: 0
        })

        setTimeout(() => {
          this.setData({
            currentTheme: theme,
            themeOpacity: 1
          })

          setTimeout(() => {
            this.setData({ themeTransition: false })
          }, 300)
        }, 150)
      }
    } catch (error) {
      console.error('检查主题更新失败:', error)
    }
  },

  // 时间问候相关
  checkTimeGreeting() {
    const hour = new Date().getHours()
    let greeting = ''
    let showGreeting = false

    if (hour >= 0 && hour < 6) {
      greeting = '夜深了，注意休息哦 🌙'
      showGreeting = true
    } else if (hour >= 6 && hour < 9) {
      greeting = '早上好！新的一天开始了 ☀️'
      showGreeting = true
    } else if (hour >= 21 && hour < 24) {
      greeting = '晚上好！今天辛苦了 🌃'
      showGreeting = true
    }

    this.setData({
      timeGreeting: greeting,
      showTimeGreeting: showGreeting
    })
  },

  // 一言相关方法
  async loadHitokoto() {
    try {
      const hitokoto = await hitokotoManager.getHitokoto()
      this.setData({ hitokoto })
      console.log('加载一言成功:', hitokoto)
    } catch (error) {
      console.error('加载一言失败:', error)
    }
  },

  // 刷新一言
  async refreshHitokoto() {
    try {
      const hitokoto = await hitokotoManager.refreshHitokoto()
      this.setData({ hitokoto })
      wx.showToast({
        title: '已刷新',
        icon: 'success',
        duration: 1000
      })
    } catch (error) {
      console.error('刷新一言失败:', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    }
  },

  /**
   * 初始化情感化互动
   */
  async initEmotionalInteraction() {
    try {
      // 获取情感化问候
      const greeting = await emotionManager.getEmotionalGreeting()

      // 获取深夜阅读彩蛋
      const midnightEgg = emotionManager.getMidnightReaderEgg()

      this.setData({
        emotionalGreeting: greeting,
        showEmotionalGreeting: true,
        authorStatus: greeting.author,
        specialDateEgg: greeting.special,
        midnightReaderEgg: midnightEgg.isMidnight ? midnightEgg : null
      })

      // 如果是深夜，显示深夜彩蛋
      if (midnightEgg.isMidnight) {
        setTimeout(() => {
          wx.showToast({
            title: midnightEgg.message,
            icon: 'none',
            duration: 3000
          })
        }, 2000)
      }
    } catch (error) {
      console.error('初始化情感化互动失败:', error)
    }
  },

  /**
   * 刷新情感化问候
   */
  async refreshEmotionalGreeting() {
    try {
      const greeting = await emotionManager.getEmotionalGreeting()
      this.setData({
        emotionalGreeting: greeting,
        authorStatus: greeting.author,
        specialDateEgg: greeting.special
      })
    } catch (error) {
      console.error('刷新情感化问候失败:', error)
    }
  },

  /**
   * 获取随机鼓励语
   */
  getRandomEncouragement() {
    const encouragement = emotionManager.getRandomEncouragement()
    wx.showToast({
      title: `${encouragement.emoji} ${encouragement.text}`,
      icon: 'none',
      duration: 2000
    })
  },

  // 加载本地存储数据
  async loadLocalStorageData() {
    try {
      // 加载阅读历史
      const history = await localStorageManager.getReadingHistory()
      // 加载收藏列表
      const favorites = await localStorageManager.getFavorites()
      const favoriteIds = favorites.map(item => item.postId || item.id || item.slug)

      this.setData({
        readingHistory: history.slice(0, 5), // 只显示最近5条
        favoriteIds,
        showHistorySection: history.length > 0
      })
    } catch (error) {
      console.error('加载本地存储数据失败:', error)
    }
  },

  // 更新文章的收藏和阅读状态
  updatePostsStatus() {
    const { posts, favoriteIds, readingHistory } = this.data
    const historyIds = readingHistory.map(item => item.postId || item.id || item.slug)

    const updatedPosts = posts.map(post => ({
      ...post,
      isFavorited: favoriteIds.includes(post.id || post.slug),
      hasRead: historyIds.includes(post.id || post.slug),
      lastReadTime: this.getLastReadTime(post.id || post.slug)
    }))

    this.setData({ posts: updatedPosts })
  },

  // 获取最后阅读时间
  getLastReadTime(postId) {
    const historyItem = this.data.readingHistory.find(item =>
      (item.postId || item.id || item.slug) === postId
    )
    return historyItem ? (historyItem.readAt || historyItem.visitTime || null) : null
  },

  // 加载筛选偏好（分类/标签/标签开关）
  loadFilterPreferences() {
    try {
      const prefs = StorageUtil.get('posts_filter')
      if (prefs) {
        this.setData({
          selectedCategory: prefs.selectedCategory || '',
          selectedTags: Array.isArray(prefs.selectedTags) ? prefs.selectedTags : (prefs.selectedTag ? [prefs.selectedTag] : [])
        })
      }
    } catch (error) {
      console.error('加载筛选偏好失败:', error)
    }
  },

  // 保存筛选偏好
  saveFilterPreferences() {
    try {
      const prefs = {
        selectedCategory: this.data.selectedCategory,
        selectedTags: this.data.selectedTags
      }
      // 缓存30天
      StorageUtil.set('posts_filter', prefs, CACHE_TIME.MONTH)
    } catch (error) {
      console.error('保存筛选偏好失败:', error)
    }
  }

})
