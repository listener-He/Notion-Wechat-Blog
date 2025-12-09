export default class ThemeManager {
  constructor() { this.initTheme() }
  initTheme() {
    const savedTheme = wx.getStorageSync('theme')
    const systemTheme = wx.getSystemInfoSync().theme
    const theme = savedTheme || (systemTheme === 'dark' ? 'dark' : 'light')
    this.applyTheme(theme)
  }
  applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return
    wx.setStorageSync('theme', theme)
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const page = pages[pages.length - 1]
      const pageEl = page.selectComponent('#app')
      if (pageEl) { pageEl.setData({ theme }) }
    }
    wx.setNavigationBarColor({
      frontColor: theme === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
    })
  }
  toggleTheme() {
    const currentTheme = wx.getStorageSync('theme') || 'light'
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    this.applyTheme(newTheme)
    return newTheme
  }
}
