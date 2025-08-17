// app.js
const { StorageUtil, CACHE_TIME, CACHE_KEYS } = require('./utils/storage.js')
const { themeManager } = require('./utils/theme.js')

App({
  globalData: {
    // API基础地址，指向NotionNext后端服务
    // 开发环境可以使用 http://localhost:3000/api/miniprogram
    // 生产环境需要替换为实际的域名
    apiBaseUrl: 'https://blog.hehouhui.cn/api/miniprogram',
    // 站点信息缓存
    siteInfo: null,
    // 用户信息
    userInfo: null,
    // 当前主题
    theme: null,
    // 主题管理器
    themeManager
  },

  onLaunch() {
    console.log('小程序启动')

    // 初始化主题系统
    this.initTheme()

    // 检查更新
    this.checkForUpdate()

    // 预加载站点信息
    this.loadSiteInfo()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  onError(msg) {
    console.error('小程序错误:', msg)
  },

  // 检查小程序更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本')
        }
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败')
      })
    }
  },

  // 初始化主题系统
  initTheme() {
    try {
      // 先初始化主题管理器
      this.globalData.themeManager.init()

      // 应用主题（自动检测节日主题或使用默认主题）
      const currentTheme = this.globalData.themeManager.applyTheme()
      this.globalData.theme = currentTheme

      console.log('主题系统初始化完成:', currentTheme.name)
    } catch (error) {
      console.error('主题系统初始化失败:', error)
      // 使用默认主题作为后备
      const defaultTheme = this.globalData.themeManager.getDefaultTheme()
      this.globalData.theme = defaultTheme
    }
  },

  // 预加载站点信息
  loadSiteInfo() {
    // 先尝试从缓存获取
    const cachedSiteInfo = StorageUtil.get(CACHE_KEYS.SITE_INFO)
    if (cachedSiteInfo) {
      this.globalData.siteInfo = cachedSiteInfo
      console.log('从缓存加载站点信息')
      return
    }

    wx.request({
      url: `${this.globalData.apiBaseUrl}/site-info`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          this.globalData.siteInfo = res.data.data
          // 缓存站点信息，缓存3小时
          StorageUtil.set(CACHE_KEYS.SITE_INFO, res.data.data, CACHE_TIME.THREE_HOURS)
          console.log('站点信息加载成功')
        }
      },
      fail: (err) => {
        console.error('站点信息加载失败:', err)
      }
    })
  },

  // 全局请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBaseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  },

  // 显示错误提示
  showError(message = '操作失败') {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    })
  },

  // 显示成功提示
  showSuccess(message = '操作成功') {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    })
  },

  // 格式化日期
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return ''

    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
  },

  // 截取文本
  truncateText(text, maxLength = 100) {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  },
  towxml: require('./towxml/index')
})
