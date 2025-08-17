/**
 * 主题管理工具类
 * 支持默认主题、节日主题自动切换和主题过渡动画
 */

class ThemeManager {
  constructor() {
    this.currentTheme = null
    this.holidayThemeEnabled = true
    this.initialized = false
  }

  // 初始化主题系统
  init() {
    if (this.initialized) return

    // 从本地存储获取用户偏好
    const userPrefs = wx.getStorageSync('user_theme_prefs') || {}
    this.holidayThemeEnabled = userPrefs.holidayEnabled !== false

    // 检测并应用主题
    this.applyTheme()
    this.initialized = true
  }

  // 默认「素墨」主题配置
  getDefaultTheme() {
    return {
      name: '素墨',
      id: 'default',
      colors: {
        primary: '#FFFFFF', // 主背景
        secondary: '#F8F9FA', // 次背景
        background: '#FFFFFF', // 页面背景
        backgroundLight: '#F8F9FA', // 浅色背景
        backgroundDark: '#2C3E50', // 深色背景
        textPrimary: '#1F1F1F', // 主文字
        textSecondary: '#5A5A5A', // 次要文字
        textHint: '#8C8C8C', // 提示文字
        textLight: '#7F8C8D', // 浅色文字
        textMuted: '#BDC3C7', // 静音文字
        textWhite: '#FFFFFF', // 白色文字
        accent: '#3A6EA5', // 强调色
        accentLight: '#5B9BD5', // 浅强调色
        accentDark: '#2E5A8A', // 深强调色
        hover: '#E6F0FF', // 悬停反馈色
        active: '#D6E7FF', // 激活状态色
        divider: '#E8E8E8', // 分割线
        border: '#BDC3C7', // 边框色
        borderLight: '#ECF0F1', // 浅边框色
        // 按钮颜色
        buttonPrimary: '#3A6EA5', // 主按钮
        buttonSecondary: '#95A5A6', // 次按钮
        buttonSuccess: '#27AE60', // 成功按钮
        buttonWarning: '#F39C12', // 警告按钮
        buttonDanger: '#E74C3C', // 危险按钮
        buttonInfo: '#3498DB', // 信息按钮
        // 状态颜色
        success: '#27AE60', // 成功色
        warning: '#F39C12', // 警告色
        error: '#E74C3C', // 错误色
        info: '#3498DB' // 信息色
      },
      fonts: {
        h1: { size: '20px', weight: 600 },
        h2: { size: '18px', weight: 500 },
        body: { size: '16px', weight: 400, lineHeight: 1.8 },
        caption: { size: '14px', weight: 400 },
        label: { size: '14px', weight: 500 }
      },
      animations: {
        pageTransition: 'fade-slide-up',
        duration: '300ms',
        easing: 'ease-in-out'
      }
    }
  }

  // 节日主题配置
  getHolidayThemes() {
    return {
      spring: {
        name: '春笺 · Red Scroll',
        id: 'spring',
        period: { start: [1, 1], end: [1, 15] }, // 农历正月初一至十五
        colors: {
          primary: '#FFF8F0',
          secondary: '#FFF0E6',
          background: '#FFF8F0',
          backgroundLight: '#FFF0E6',
          backgroundDark: '#8B4513',
          textPrimary: '#2D1810',
          textSecondary: '#8B4513',
          textHint: '#CD853F',
          textLight: '#DEB887',
          textMuted: '#F4A460',
          textWhite: '#FFFFFF',
          accent: '#C41E3A',
          accentLight: '#DC143C',
          accentDark: '#8B0000',
          hover: '#FFE4E1',
          active: '#FFCCCB',
          divider: '#DEB887',
          border: '#DEB887',
          borderLight: '#F5DEB3',
          buttonPrimary: '#C41E3A',
          buttonSecondary: '#CD853F',
          buttonSuccess: '#228B22',
          buttonWarning: '#FF8C00',
          buttonDanger: '#DC143C',
          buttonInfo: '#4682B4',
          success: '#228B22',
          warning: '#FF8C00',
          error: '#DC143C',
          info: '#4682B4'
        },
        elements: {
          background: 'spring-pattern.png',
          icons: 'lantern',
          animation: 'red-scroll-unfold'
        }
      },
      qingming: {
        name: '雨巷 · Misty Path',
        id: 'qingming',
        period: { date: [4, 5] }, // 清明节当日
        colors: {
          primary: '#F5F5F5',
          secondary: '#E8F5E8',
          background: '#F5F5F5',
          backgroundLight: '#E8F5E8',
          backgroundDark: '#2F4F4F',
          textPrimary: '#2F4F4F',
          textSecondary: '#696969',
          textHint: '#A9A9A9',
          textLight: '#D3D3D3',
          textMuted: '#C0C0C0',
          textWhite: '#FFFFFF',
          accent: '#8FBC8F',
          accentLight: '#98FB98',
          accentDark: '#556B2F',
          hover: '#F0FFF0',
          active: '#E0FFE0',
          divider: '#D3D3D3',
          border: '#D3D3D3',
          borderLight: '#E8E8E8',
          buttonPrimary: '#8FBC8F',
          buttonSecondary: '#A9A9A9',
          buttonSuccess: '#32CD32',
          buttonWarning: '#DAA520',
          buttonDanger: '#CD5C5C',
          buttonInfo: '#4682B4',
          success: '#32CD32',
          warning: '#DAA520',
          error: '#CD5C5C',
          info: '#4682B4'
        },
        elements: {
          background: 'rain-mist.png',
          icons: 'umbrella',
          animation: 'rain-drops'
        }
      },
      duanwu: {
        name: '龙舟 · River Pulse',
        id: 'duanwu',
        period: { lunar: [5, 5] }, // 端午节当日
        colors: {
          primary: '#F0FFF0',
          secondary: '#E6FFE6',
          textPrimary: '#006400',
          textSecondary: '#228B22',
          textHint: '#90EE90',
          accent: '#8B4513',
          hover: '#F5FFFA',
          divider: '#98FB98'
        },
        elements: {
          background: 'water-wave.png',
          icons: 'dragon-boat',
          animation: 'boat-sailing'
        }
      },
      midautumn: {
        name: '月笺 · Moon Scroll',
        id: 'midautumn',
        period: { lunar: [8, 15] }, // 中秋节当日
        colors: {
          primary: '#F0F8FF',
          secondary: '#E6F3FF',
          textPrimary: '#000080',
          textSecondary: '#4169E1',
          textHint: '#87CEEB',
          accent: '#FFD700',
          hover: '#F5F5FF',
          divider: '#B0C4DE'
        },
        elements: {
          background: 'full-moon.png',
          icons: 'rabbit',
          animation: 'osmanthus-falling'
        }
      },
      national: {
        name: '山河 · Golden Horizon',
        id: 'national',
        period: { start: [10, 1], end: [10, 7] }, // 10月1日-7日
        colors: {
          primary: '#FFF5F5',
          secondary: '#FFE4E1',
          textPrimary: '#8B0000',
          textSecondary: '#DC143C',
          textHint: '#F08080',
          accent: '#FFD700',
          hover: '#FFEBCD',
          divider: '#DDA0DD'
        },
        elements: {
          background: 'great-wall.png',
          icons: 'flag',
          animation: 'flag-waving'
        }
      },
      dongzhi: {
        name: '雪窗 · Snow Window',
        id: 'dongzhi',
        period: { solar: 'dongzhi' }, // 冬至当日
        colors: {
          primary: '#F0F8FF',
          secondary: '#F5F5F5',
          textPrimary: '#2F4F4F',
          textSecondary: '#708090',
          textHint: '#C0C0C0',
          accent: '#4682B4',
          hover: '#E6E6FA',
          divider: '#D3D3D3'
        },
        elements: {
          background: 'snow-window.png',
          icons: 'snowflake',
          animation: 'snow-falling'
        }
      },
      newyear: {
        name: '新启 · New Dawn',
        id: 'newyear',
        period: { date: [1, 1] }, // 1月1日
        colors: {
          primary: '#F8F8FF',
          secondary: '#E6E6FA',
          textPrimary: '#483D8B',
          textSecondary: '#6A5ACD',
          textHint: '#9370DB',
          accent: '#4169E1',
          hover: '#F0F0FF',
          divider: '#DDA0DD'
        },
        elements: {
          background: 'starlight.png',
          icons: 'star',
          animation: 'number-emerge'
        }
      }
    }
  }

  // 检测当前日期是否匹配节日
  detectHoliday() {
    if (!this.holidayThemeEnabled) return null

    const now = new Date()
    const month = now.getMonth() + 1
    const date = now.getDate()
    const holidays = this.getHolidayThemes()

    for (const holiday of Object.values(holidays)) {
      if (holiday.period.date) {
        const [hMonth, hDate] = holiday.period.date
        if (month === hMonth && date === hDate) {
          return holiday
        }
      } else if (holiday.period.start && holiday.period.end) {
        const [startMonth, startDate] = holiday.period.start
        const [endMonth, endDate] = holiday.period.end
        if ((month === startMonth && date >= startDate) ||
            (month === endMonth && date <= endDate)) {
          return holiday
        }
      }
      // TODO: 添加农历和节气检测逻辑
    }

    return null
  }

  // 应用主题
  applyTheme(themeId = null) {
    let theme

    if (themeId) {
      // 手动指定主题
      const holidays = this.getHolidayThemes()
      theme = holidays[themeId] || this.getDefaultTheme()
    } else {
      // 自动检测主题
      const holidayTheme = this.detectHoliday()
      theme = holidayTheme || this.getDefaultTheme()
    }

    this.currentTheme = theme
    this.updateGlobalStyles(theme)

    // 保存当前主题到本地存储
    wx.setStorageSync('current_theme', {
      id: theme.id,
      name: theme.name,
      appliedAt: Date.now()
    })

    return theme
  }

  // 更新全局样式
  updateGlobalStyles(theme) {
    // 通过CSS变量更新全局样式
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.theme = theme
    }

    // 触发页面重新渲染
    const pages = getCurrentPages()
    pages.forEach(page => {
      if (page.onThemeChange && typeof page.onThemeChange === 'function') {
        page.onThemeChange(theme)
      }
    })
  }

  // 切换节日主题开关
  toggleHolidayTheme(enabled) {
    this.holidayThemeEnabled = enabled

    // 保存用户偏好
    const prefs = wx.getStorageSync('user_theme_prefs') || {}
    prefs.holidayEnabled = enabled
    wx.setStorageSync('user_theme_prefs', prefs)

    // 重新应用主题
    this.applyTheme()
  }

  // 获取当前主题
  getCurrentTheme() {
    return this.currentTheme || this.getDefaultTheme()
  }

  // 主题切换动画
  async switchThemeWithAnimation(newThemeId) {
    return new Promise((resolve) => {
      // 淡出动画
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]

      if (currentPage) {
        currentPage.setData({
          themeTransition: true,
          themeOpacity: 0
        })

        setTimeout(() => {
          // 应用新主题
          this.applyTheme(newThemeId)

          // 淡入动画
          currentPage.setData({
            themeOpacity: 1
          })

          setTimeout(() => {
            currentPage.setData({
              themeTransition: false
            })
            resolve()
          }, 300)
        }, 250)
      } else {
        this.applyTheme(newThemeId)
        resolve()
      }
    })
  }
}

// 创建全局主题管理器实例
const themeManager = new ThemeManager()

module.exports = {
  ThemeManager,
  themeManager
}
