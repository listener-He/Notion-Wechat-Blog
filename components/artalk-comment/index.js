// components/artalk-comment/index.js
Component({
  properties: {
    // 文章标识符
    pageKey: {
      type: String,
      value: ''
    },
    // 文章标题
    pageTitle: {
      type: String,
      value: ''
    },
    // 文章URL
    pageUrl: {
      type: String,
      value: ''
    },
    // 是否显示评论
    show: {
      type: Boolean,
      value: true
    },
    // 主题模式
    darkMode: {
      type: Boolean,
      value: false
    }
  },

  data: {
    comments: [],
    loading: true,
    error: '',
    showCommentForm: false,
    commentContent: '',
    authorName: '',
    authorEmail: '',
    authorWebsite: '',
    replyToId: null,
    replyToName: '',
    submitting: false,
    // 评论统计
    commentCount: 0,
    // 分页
    currentPage: 1,
    hasMore: true
  },

  lifetimes: {
    attached() {
      if (this.properties.show && this.properties.pageKey) {
        this.loadComments()
      }
    }
  },

  observers: {
    pageKey: function(newVal) {
      if (newVal && this.properties.show) {
        this.loadComments()
      }
    }
  },

  methods: {
    // 加载评论列表
    async loadComments(page = 1) {
      if (!this.properties.pageKey) return

      try {
        this.setData({ loading: true, error: '' })

        // 模拟评论数据 - 实际项目中应该调用真实的API
        const mockComments = [
          {
            id: 1,
            content: '这篇文章写得很好，学到了很多！',
            author: {
              name: '张三',
              email: 'zhangsan@example.com',
              avatar: '👨‍💻'
            },
            createdAt: '2024-01-15 10:30:00',
            replies: [
              {
                id: 2,
                content: '同感，作者的见解很独到。',
                author: {
                  name: '李四',
                  email: 'lisi@example.com',
                  avatar: '👩‍💼'
                },
                createdAt: '2024-01-15 11:00:00',
                replyTo: '张三'
              }
            ]
          },
          {
            id: 3,
            content: '期待更多这样的技术分享！',
            author: {
              name: '王五',
              email: 'wangwu@example.com',
              avatar: '🧑‍🎓'
            },
            createdAt: '2024-01-15 14:20:00',
            replies: []
          }
        ]

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 800))

        this.setData({
          comments: page === 1 ? mockComments : [...this.data.comments, ...mockComments],
          commentCount: mockComments.length + mockComments.reduce((sum, comment) => sum + comment.replies.length, 0),
          loading: false,
          hasMore: false // 模拟数据只有一页
        })
      } catch (error) {
        console.error('加载评论失败:', error)
        this.setData({
          error: '加载评论失败，请稍后重试',
          loading: false
        })
      }
    },

    // 显示评论表单
    showCommentForm() {
      this.setData({
        showCommentForm: true,
        replyToId: null,
        replyToName: ''
      })
    },

    // 隐藏评论表单
    hideCommentForm() {
      this.setData({
        showCommentForm: false,
        commentContent: '',
        replyToId: null,
        replyToName: ''
      })
    },

    // 回复评论
    replyToComment(e) {
      const { id, name } = e.currentTarget.dataset
      this.setData({
        showCommentForm: true,
        replyToId: id,
        replyToName: name
      })
    },

    // 输入框变化
    onInputChange(e) {
      const { field } = e.currentTarget.dataset
      const { value } = e.detail
      this.setData({
        [field]: value
      })
    },

    // 提交评论
    async submitComment() {
      const { commentContent, authorName } = this.data

      if (!commentContent.trim()) {
        wx.showToast({
          title: '请输入评论内容',
          icon: 'none'
        })
        return
      }

      if (!authorName.trim()) {
        wx.showToast({
          title: '请输入昵称',
          icon: 'none'
        })
        return
      }

      try {
        this.setData({ submitting: true })

        // 模拟提交评论 - 实际项目中应该调用真实的API
        await new Promise(resolve => setTimeout(resolve, 1000))

        wx.showToast({
          title: '评论提交成功',
          icon: 'success'
        })

        // 重新加载评论
        this.loadComments()
        this.hideCommentForm()
      } catch (error) {
        console.error('提交评论失败:', error)
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      } finally {
        this.setData({ submitting: false })
      }
    },

    // 加载更多评论
    loadMoreComments() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadComments(this.data.currentPage + 1)
        this.setData({
          currentPage: this.data.currentPage + 1
        })
      }
    },

    // 刷新评论
    refreshComments() {
      this.setData({
        currentPage: 1,
        hasMore: true
      })
      this.loadComments(1)
    },

    // 格式化时间
    formatTime(timeStr) {
      const time = new Date(timeStr)
      const now = new Date()
      const diff = now - time
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      return timeStr.split(' ')[0]
    }
  }
})
