// pages/search/index.js
const app = getApp()
const { animationManager } = require('../../utils/animation.js')
const { localStorageManager } = require('../../utils/local-storage.js')

Page({
  data: {
    keyword: '',
    posts: [],
    searchHistory: [],
    hotKeywords: ['Vue', 'React', 'JavaScript', 'CSS', 'Node.js', 'Python'],
    loading: false,
    loadingMore: false,
    error: '',
    hasSearched: false,
    hasMore: false,
    page: 1,
    pageSize: 10,
    totalCount: 0,
    autoFocus: true,
    // 本地存储相关
    favoriteIds: []
  },

  onLoad(options) {
    console.log('搜索页面加载:', options)

    // 如果有传入的关键词，直接搜索
    if (options.keyword) {
      this.setData({
        keyword: options.keyword,
        autoFocus: false
      })
      this.search(options.keyword)
    }

    this.loadSearchHistory()
  },

  onShow() {
    // 页面显示时刷新搜索历史
    this.loadSearchHistory()
    this.loadFavoriteIds()
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || []
      this.setData({ searchHistory: history.slice(0, 10) }) // 最多显示10条
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword || keyword.trim() === '') return

    try {
      let history = wx.getStorageSync('searchHistory') || []

      // 移除重复项
      history = history.filter(item => item !== keyword)

      // 添加到开头
      history.unshift(keyword)

      // 限制历史记录数量
      if (history.length > 20) {
        history = history.slice(0, 20)
      }

      wx.setStorageSync('searchHistory', history)
      this.setData({ searchHistory: history.slice(0, 10) })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 清空搜索历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('searchHistory')
            this.setData({ searchHistory: [] })
            app.showSuccess('已清空搜索历史')
          } catch (error) {
            console.error('清空搜索历史失败:', error)
            app.showError('清空失败')
          }
        }
      }
    })
  },

  // 输入关键词
  onKeywordInput(e) {
    const keyword = e.detail.value
    this.setData({ keyword })

    // 实时搜索（防抖）
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }

    if (keyword.trim()) {
      this.searchTimer = setTimeout(() => {
        this.search(keyword, false) // 实时搜索不保存历史
      }, 500)
    } else {
      this.setData({
        hasSearched: false,
        posts: [],
        totalCount: 0
      })
    }
  },

  // 搜索
  onSearch() {
    const keyword = this.data.keyword.trim()
    if (!keyword) {
      app.showError('请输入搜索关键词')
      return
    }

    this.search(keyword, true)
  },

  // 点击搜索历史
  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword })
    this.search(keyword, true)
  },

  // 点击热门关键词
  onHotKeywordTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword })
    this.search(keyword, true)
  },

  // 执行搜索
  async search(keyword, saveHistory = true) {
    if (!keyword || keyword.trim() === '') return

    try {
      this.setData({
        loading: true,
        error: '',
        page: 1,
        hasMore: false
      })

      const result = await app.request({
        url: '/posts',
        data: {
          search: keyword.trim(),
          page: 1,
          pageSize: this.data.pageSize
        }
      })

      if (result.success) {
        const { posts, pagination } = result.data

        // 高亮搜索关键词
        const highlightedPosts = this.highlightKeyword(posts, keyword)

        // 更新收藏状态
        const postsWithFavoriteStatus = this.updatePostsFavoriteStatus(highlightedPosts)

        this.setData({
          posts: postsWithFavoriteStatus,
          hasSearched: true,
          hasMore: pagination.hasMore,
          totalCount: pagination.total,
          page: 1
        })

        // 保存搜索历史
        if (saveHistory) {
          this.saveSearchHistory(keyword.trim())
        }
      } else {
        throw new Error(result.message || '搜索失败')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      this.setData({
        error: error.message || '搜索失败，请重试',
        hasSearched: true,
        posts: [],
        totalCount: 0
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载更多
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return

    try {
      this.setData({ loadingMore: true })

      const nextPage = this.data.page + 1
      const result = await app.request({
        url: '/posts',
        data: {
          search: this.data.keyword.trim(),
          page: nextPage,
          pageSize: this.data.pageSize
        }
      })

      if (result.success) {
        const { posts, pagination } = result.data

        // 高亮搜索关键词
        const highlightedPosts = this.highlightKeyword(posts, this.data.keyword)

        // 更新收藏状态
        const postsWithFavoriteStatus = this.updatePostsFavoriteStatus(highlightedPosts)

        this.setData({
          posts: this.data.posts.concat(postsWithFavoriteStatus),
          hasMore: pagination.hasMore,
          page: nextPage
        })
      } else {
        throw new Error(result.message || '加载更多失败')
      }
    } catch (error) {
      console.error('加载更多失败:', error)
      app.showError('加载更多失败')
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  // 高亮关键词
  highlightKeyword(posts, keyword) {
    if (!keyword || !posts || posts.length === 0) return posts

    const keywordRegex = new RegExp(`(${keyword})`, 'gi')

    return posts.map(post => {
      const highlightedPost = Object.assign({}, post)

      // 高亮标题
      if (post.title) {
        highlightedPost.highlightTitle = post.title.replace(
          keywordRegex,
          '<span style="background-color: #ffeb3b; color: #333;">$1</span>'
        )
      }

      // 高亮摘要
      if (post.summary) {
        highlightedPost.highlightSummary = post.summary.replace(
          keywordRegex,
          '<span style="background-color: #ffeb3b; color: #333;">$1</span>'
        )
      }

      return highlightedPost
    })
  },

  // 点击文章
  onPostTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('点击搜索结果文章:', id)

    if (!id) {
      wx.showToast({
        title: '文章信息错误',
        icon: 'none'
      })
      return
    }

    // 添加页面切换动画
    animationManager.pageTransition('slideLeft', () => {
      wx.navigateTo({
        url: `/pages/post-detail/index?id=${id}`
      })
    })
  },

  // 重试
  retry() {
    if (this.data.keyword.trim()) {
      this.search(this.data.keyword.trim(), false)
    }
  },

  // 页面滚动到底部
  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.keyword.trim()) {
      this.search(this.data.keyword.trim(), false)
    }
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    const { keyword, totalCount } = this.data
    return {
      title: keyword ? `搜索"${keyword}"找到${totalCount}篇文章` : '文章搜索',
      path: keyword ? `/pages/search/index?keyword=${keyword}` : '/pages/search/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { keyword, totalCount } = this.data
    return {
      title: keyword ? `搜索"${keyword}"找到${totalCount}篇文章` : '文章搜索'
    }
  },

  // 页面卸载
  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },

  // 加载收藏ID列表
  async loadFavoriteIds() {
    try {
      const favorites = await localStorageManager.getFavorites()
      const favoriteIds = favorites.map(item => item.id || item.slug)
      this.setData({ favoriteIds })
    } catch (error) {
      console.error('加载收藏数据失败:', error)
    }
  },

  // 更新文章收藏状态
  updatePostsFavoriteStatus(posts) {
    const { favoriteIds } = this.data
    return posts.map(post => ({
      ...post,
      isFavorited: favoriteIds.includes(post.id || post.slug)
    }))
  }
})
