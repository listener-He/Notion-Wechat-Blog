// pages/post-detail/index.js
const app = getApp()
const towxml = require('../../towxml/index')
const hitokoto = require('../../utils/hitokoto')
const hitokotoManager = hitokoto.hitokotoManager
const themeManagerAlt = require('../../utils/themeManager')
const { emotionManager } = require('../../utils/emotion')
const { animationManager } = require('../../utils/animation')
const { localStorageManager } = require('../../utils/local-storage')

Page({
  data: {
    id: '',
    post: null,
    relatedPosts: [],
    loading: true,
    error: '',
    isFavorite: false,
    parsedContent: null,
    isContentReady: false,
    showTransition: true,
    transitionQuote: '',
    showReadingComplete: false,
    readingProgress: 0,
    isScrolledToBottom: false,
    currentTheme: null,
    themeOpacity: 1,
    completeQuote: null,
    readingCompleteEgg: null,
    showEmotionalFeedback: false,
    encouragementMessage: '',
    isScrolling: false,
    readingStartTime: null,
    totalReadingTime: 0,
    countdownSeconds: 3,
    countdownProgress: 0,
    countdownTimer: null,
    hasTriggeredReadingComplete: false,
    windowHeight: 0
  },

  onLoad(options) {
    console.log('文章详情页面加载:', options)

    const { id } = options

    // 初始化主题和阅读体验
    this.initReadingExperience()

    // 只使用ID查询文章详情
    if (id && id.trim() !== '') {
      this.setData({ id })

      this.loadPost()
      this.checkFavoriteStatus()
    } else if (id) {
      // 使用ID作为slug的fallback
      this.setData({ id: id || '' })
      this.loadPost()
      this.checkFavoriteStatus()
    } else {
      this.setData({
        error: '文章参数错误，缺少有效的文章标识',
        loading: false
      })
    }
  },

  onShow() {
    // 页面显示时更新收藏状态
    this.checkFavoriteStatus()
    // 记录阅读开始时间
    this.setData({
      readingStartTime: Date.now()
    })
  },

  onHide() {
    // 记录阅读足迹
    this.recordReadingHistory()
  },

  onUnload() {
    // 页面卸载时也记录阅读足迹
    this.recordReadingHistory()
  },

  toggleThemeQuick() {
    const newTheme = themeManagerAlt.toggleTheme()
    this.setData({ currentTheme: newTheme, themeOpacity: 0.98 })
    setTimeout(() => this.setData({ themeOpacity: 1 }), 200)
  },

  onPullDownRefresh() {
    console.log('下拉刷新')
    // 重置阅读彩蛋触发标志
    this.setData({ hasTriggeredReadingComplete: false })
    this.loadPost(true)
  },

  // 加载文章详情
  async loadPost(isRefresh = false) {
    try {
      this.setData({
        loading: true,
        error: ''
      })

      // 构建请求参数，只使用ID查询
      if (!this.data.id || this.data.id.trim() === '') {
        throw new Error('文章ID不能为空')
      }

      const result = await app.request({
        url: '/post/' + this.data.id
      })

      if (result.success && result.data && result.data.id) {
        console.log('API返回的原始数据:', result.data)
        // API返回的数据结构是扁平的，直接使用result.data作为post数据
        const post = {
          id: result.data.id,
          title: result.data.title,
          summary: result.data.summary,
          slug: result.data.slug,
          category: result.data.category,
          tags: result.data.tags || [],
          publishDate: result.data.publishDate,
          lastEditedDate: result.data.lastEditedDate,
          pageCover: result.data.pageCover,
          pageIcon: result.data.pageIcon,
          publishDay: result.data.publishDay,
          textContent: result.data.textContent,
          htmlContent: result.data.htmlContent,
          content: result.data.content,
          wordCount: result.data.wordCount,
          readingTime: result.data.readingTime,
          author: result.data.author,
          url: result.data.url
        }
        const relatedPosts = result.data.relatedPosts || []

        // 处理相关文章的日期格式化
        const processedRelatedPosts = relatedPosts.map(relatedPost => ({
          ...relatedPost,
          publishDate: relatedPost.publishDate ? app.formatDate(relatedPost.publishDate) : ''
        }))

        // 处理文章内容
        const processedPost = this.processPostContent(post)
        console.log('构建的post对象:', post)
        console.log('处理后的post对象:', processedPost)

        this.setData({
          post: processedPost,
          relatedPosts: processedRelatedPosts,
          loading: false
        })

        console.log('设置到页面的数据:', this.data.post)

        // 记录文章访问
        if (post && post.id) {
          this.recordPostVisit(post)
        }

        // 检查收藏状态
        this.checkFavoriteStatus()

        // 设置页面标题
        if (post && post.title) {
          wx.setNavigationBarTitle({
            title: post.title
          })
        }

        if (isRefresh) {
          app.showSuccess('刷新成功')
        }
      } else {
        throw new Error(result.message || '获取文章详情失败')
      }
    } catch (error) {
      console.error('加载文章详情失败:', error)
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

  // 处理文章内容
  processPostContent(post) {
    if (!post) return {}

    // 处理发布日期
    if (post.publishDate) {
      post.publishDate = app.formatDate(post.publishDate)
    }

    // 处理最后编辑日期
    if (post.lastEditedDate) {
      post.lastEditedDate = app.formatDate(post.lastEditedDate)
    }

    // 计算字数统计和预计阅读时间
    const rawText = post.textContent || ''
    if (rawText) {
      let processedTextContent = rawText
      if (typeof processedTextContent === 'string') {
        processedTextContent = processedTextContent.replace(/\\r\\n|\\n/g, '\n')
      }

      // 计算字数（去除Markdown标记符号）
      const plainText = processedTextContent
        .replace(/#{1,6}\s+/g, '') // 移除标题标记
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
        .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
        .replace(/```[\s\S]*?```/g, '') // 移除代码块
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // 移除图片
        .replace(/\[[^\]]*\]\([^)]+\)/g, '') // 移除链接
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim()

      const wordCount = plainText.length
      const readingTime = Math.max(1, Math.ceil(wordCount / 300)) // 假设每分钟阅读300字

      // 添加到post对象中
      post.wordCount = wordCount
      post.readingTime = readingTime

      try {
        const isHtml = /<\w+[^>]*>/.test(processedTextContent)
        const type = isHtml ? 'html' : 'markdown'
        const nodes = towxml(processedTextContent, type, { base: '', theme: 'light' })
        const hasChildren = nodes && nodes.children && nodes.children.length > 0
        if (hasChildren) {
          this.setData({ parsedContent: nodes, isContentReady: true })
        } else {
          const htmlFallback = isHtml ? processedTextContent : undefined
          this.setData({
            post: Object.assign({}, this.data.post, {
              content: htmlFallback || post.content || processedTextContent
            }),
            isContentReady: true
          })
        }
      } catch (error) {
        console.error('towxml解析失败:', error)
        this.setData({
          post: Object.assign({}, this.data.post, {
            content: post.content || processedTextContent
          }),
          isContentReady: true
        })
      }
    }

    // 处理HTML内容为rich-text可用的格式（备用）
    if (post.htmlContent) {
      post.content = this.processHtmlContent(post.htmlContent)
    }

    return post
  },

  // 处理HTML内容
  processHtmlContent(html) {
    if (!html) return ''

    // 这里可以添加更复杂的HTML处理逻辑
    // 目前简单处理，实际项目中可能需要使用专门的HTML解析库
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  },

  // 处理链接点击
  handleLinkTap(href) {
    console.log('点击链接:', href)

    if (!href) return

    // 判断是否为外部链接
    if (href.startsWith('http://') || href.startsWith('https://')) {
      // 复制链接到剪贴板
      wx.setClipboardData({
        data: href,
        success: () => {
          app.showSuccess('链接已复制到剪贴板')
        },
        fail: () => {
          app.showError('复制链接失败')
        }
      })
    } else if (href.startsWith('/')) {
      // 内部链接，可以进行页面跳转
      console.log('内部链接:', href)
      app.showError('暂不支持内部链接跳转')
    } else {
      // 其他类型链接
      console.log('其他链接:', href)
    }
  },

  // 检查收藏状态
  async checkFavoriteStatus() {
    try {
      const postId = this.data.post?.slug || this.data.post?.id || this.data.id
      if (postId) {
        const isFavorite = await localStorageManager.isFavorited(postId)
        this.setData({ isFavorite })
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  },

  // 切换收藏状态
  async toggleFavorite() {
    try {
      const currentStatus = this.data.isFavorite
      const postInfo = {
        id: this.data.post?.id || this.data.id,
        slug: this.data.post?.slug,
        title: this.data.post?.title,
        category: this.data.post?.category,
        tags: this.data.post?.tags,
        excerpt: this.data.post?.summary || this.data.post?.excerpt
      }

      let result
      if (currentStatus) {
        // 取消收藏
        result = await localStorageManager.removeFromFavorites(postInfo.slug || postInfo.id)
      } else {
        // 添加收藏
        result = await localStorageManager.addToFavorites(postInfo)

        // 添加点赞动画
        animationManager.likeAnimation('.action-btn')
      }

      if (result.success) {
        this.setData({
          isFavorite: !currentStatus
        })

        app.showSuccess(result.message)
      } else {
        app.showError(result.message || '操作失败')
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error)
      app.showError('操作失败')
    }
  },

  // 点击相关文章
  onRelatedPostTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('点击相关文章:', id)

    const currentId = this.data.id

    if (id && id.trim() !== '' && id !== currentId) {
      // 重定向到新文章
      wx.redirectTo({
        url: `/pages/post-detail/index?id=${id}`
      })
    } else if (id === currentId) {
      app.showError('这就是当前文章')
    } else {
      app.showError('相关文章信息不完整')
    }
  },

  // 返回
  goBack() {
    // 添加按钮点击动画
    animationManager.buttonClick('.action-btn', 'scale')
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/posts/index'
      })
    }
  },

  // 重试
  retry() {
    this.loadPost()
  },

  // 分享给好友
  onShareAppMessage() {
    const { post } = this.data
    return {
      title: post.title || '精彩文章分享',
      path: `/pages/post-detail/index?id=${this.data.id}`,
      imageUrl: post.pageCover || post.pageCoverThumbnail
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { post } = this.data
    return {
      title: post.title || '精彩文章分享',
      imageUrl: post.pageCover || post.pageCoverThumbnail
    }
  },

  // 页面滚动
  onPageScroll(e) {
    const scrollTop = e.scrollTop

    // 显示/隐藏返回顶部按钮
    if (scrollTop > 500 && !this.data.showBackToTop) {
      this.setData({ showBackToTop: true })
    } else if (scrollTop <= 500 && this.data.showBackToTop) {
      this.setData({ showBackToTop: false })
    }

    // 更新阅读进度
    wx.createSelectorQuery()
      .select('.container')
      .boundingClientRect((rect) => {
        if (rect) {
          let windowHeight = this.data.windowHeight
          if (!windowHeight || windowHeight === 0) {
            windowHeight = wx.getWindowInfo().screenWidth
          }
          this.updateReadingProgress(scrollTop, rect.height, windowHeight)
        }
      })
      .exec()
  },

  // 返回顶部
  backToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },

  // 初始化阅读体验
  async initReadingExperience() {
    console.log('开始初始化阅读体验')
    try {
      // 初始化主题
      const currentTheme = themeManager.getCurrentTheme()
      this.setData({ currentTheme })
      console.log('主题初始化完成:', currentTheme)

      // 加载过渡金句
      const transitionQuote = await hitokotoManager.getHitokoto('j')
      this.setData({ transitionQuote })
      console.log('过渡金句加载完成:', transitionQuote)

      // 缩短延迟时间，快速隐藏过渡界面 随机 1.5 ～ 3秒
      setTimeout(() => {
        console.log('隐藏过渡界面')
        this.setData({ showTransition: false })
      }, Math.random() * 1500 + 1500)
    } catch (error) {
      console.error('初始化阅读体验失败:', error)
      // 失败时直接隐藏过渡界面
      console.log('出错，直接隐藏过渡界面')
      this.setData({ showTransition: false })
    }
  },

  // 更新阅读进度
  updateReadingProgress(scrollTop, scrollHeight, windowHeight) {
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - windowHeight)) * 100))
    const isScrolledToBottom = progress >= 95

    this.setData({
      readingProgress: Math.round(progress),
      isScrolledToBottom
    })

    // 检查是否完成阅读（只触发一次）
    if (isScrolledToBottom && !this.data.showReadingComplete && !this.data.hasTriggeredReadingComplete) {
      this.setData({ hasTriggeredReadingComplete: true })
      this.showReadingComplete()
    }
  },

  // 显示阅读完成反馈
  async showReadingComplete() {
    try {
      const completeQuote = await hitokotoManager.getHitokoto('k')
      const readingTime = this.data.totalReadingTime || 0
      const readingEgg = await emotionManager.getReadingCompleteEgg(this.data.id, readingTime)

      this.setData({
        showReadingComplete: true,
        completeQuote,
        readingCompleteEgg: readingEgg,
        showEmotionalFeedback: true,
        countdownSeconds: 3,
        countdownProgress: 0
      })

      // 启动倒计时
      this.startCountdown()
    } catch (error) {
      console.error('显示阅读完成反馈失败:', error)
    }
  },

  // 启动倒计时
  startCountdown() {
    let seconds = 3
    this.setData({ countdownSeconds: seconds })

    const timer = setInterval(() => {
      seconds--
      this.setData({ countdownSeconds: seconds })

      if (seconds <= 0) {
        clearInterval(timer)
        this.hideReadingComplete()
      }
    }, 1000)

    this.setData({ countdownTimer: timer })
  },

  // 手动隐藏阅读完成反馈
  hideReadingComplete() {
    // 清除倒计时
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }

    this.setData({
      showReadingComplete: false,
      showEmotionalFeedback: false,
      countdownTimer: null
    })
  },

  // 防止点击彩蛋内容时关闭弹框
  preventClose() {
    // 空方法，用于阻止事件冒泡
  },

  // 获取随机鼓励语
  getRandomEncouragement() {
    const encouragement = emotionManager.getRandomEncouragement()
    this.setData({
      encouragementMessage: encouragement
    })

    // 显示鼓励语提示
    wx.showToast({
      title: encouragement,
      icon: 'none',
      duration: 2000
    })
  },

  // 刷新阅读金句
  async refreshReadingQuote() {
    try {
      const newQuote = await hitokotoManager.refreshHitokoto()
      this.setData({ completeQuote: newQuote })
    } catch (error) {
      console.error('刷新阅读金句失败:', error)
    }
  },

  // 记录文章访问
  async recordPostVisit(post) {
    try {
      const visitInfo = {
        id: post.id || this.data.slug,
        slug: this.data.slug,
        title: post.title,
        category: post.category,
        tags: post.tags,
        excerpt: post.excerpt,
        visitTime: Date.now()
      }

      await localStorageManager.addToHistory(visitInfo)
    } catch (error) {
      console.error('记录文章访问失败:', error)
    }
  },

  // 记录阅读足迹
  async recordReadingHistory() {
    try {
      const { readingStartTime, post } = this.data
      if (!readingStartTime || !post.title) return

      const readingTime = Date.now() - readingStartTime
      // 只记录阅读时间超过5秒的记录
      if (readingTime < 5000) return

      const historyInfo = {
        id: post.id || this.data.slug,
        slug: this.data.slug,
        title: post.title,
        category: post.category,
        tags: post.tags,
        excerpt: post.excerpt,
        readingTime,
        visitTime: readingStartTime
      }

      await localStorageManager.updateReadingTime(historyInfo)
    } catch (error) {
      console.error('记录阅读足迹失败:', error)
    }
  }
})
