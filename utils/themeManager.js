class ThemeManager {
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

module.exports = new ThemeManager()
