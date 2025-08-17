/**
 * 情感化互动管理器
 * 实现时间场景彩蛋、作者状态互动、轻量共鸣互动等功能
 */
const hitokoto = require('./hitokoto')
const hitokotoManager = hitokoto.hitokotoManager
const { StorageUtil } = require('./storage')

class EmotionManager {
  constructor() {
    this.timeScenes = {
      dawn: { start: 5, end: 7, name: '黎明', emoji: '🌅' },
      morning: { start: 7, end: 11, name: '上午', emoji: '☀️' },
      noon: { start: 11, end: 13, name: '正午', emoji: '🌞' },
      afternoon: { start: 13, end: 17, name: '下午', emoji: '🌤️' },
      evening: { start: 17, end: 19, name: '傍晚', emoji: '🌇' },
      night: { start: 19, end: 23, name: '夜晚', emoji: '🌙' },
      midnight: { start: 23, end: 5, name: '深夜', emoji: '🌌' }
    }

    this.authorStates = {
      writing: { name: '创作中', emoji: '✍️', message: '作者正在挥毫泼墨，新的文章即将诞生' },
      reading: { name: '阅读中', emoji: '📖', message: '作者正在汲取知识的养分' },
      thinking: { name: '思考中', emoji: '🤔', message: '作者正在深度思考，酝酿新的灵感' },
      traveling: { name: '旅行中', emoji: '🎒', message: '作者正在路上，收集着新的故事' },
      coding: { name: '编程中', emoji: '💻', message: '作者正在敲击键盘，构建数字世界' },
      resting: { name: '休息中', emoji: '😴', message: '作者正在休息，为下一次创作积蓄能量' }
    }

    this.resonanceTypes = {
      like: { name: '赞同', emoji: '👍', message: '感谢你的认同' },
      love: { name: '喜欢', emoji: '❤️', message: '很高兴这篇文章触动了你' },
      inspire: { name: '启发', emoji: '💡', message: '能给你带来启发是我的荣幸' },
      comfort: { name: '安慰', emoji: '🤗', message: '希望这些文字能给你温暖' },
      surprise: { name: '惊喜', emoji: '😮', message: '意外的收获总是让人开心' },
      deep: { name: '深度', emoji: '🧠', message: '深度思考让我们更接近真理' }
    }

    this.specialDates = {
      '01-01': { name: '元旦', message: '新年新气象，愿你在新的一年里收获满满', emoji: '🎊' },
      '02-14': { name: '情人节', message: '爱意绵绵的日子，愿你被温柔以待', emoji: '💕' },
      '03-08': { name: '妇女节', message: '致敬每一位了不起的女性', emoji: '🌸' },
      '04-01': { name: '愚人节', message: '今天可以开个小玩笑，但真心永远不骗人', emoji: '😄' },
      '05-01': { name: '劳动节', message: '向每一位辛勤工作的人致敬', emoji: '💪' },
      '06-01': { name: '儿童节', message: '愿你永远保持童心，对世界充满好奇', emoji: '🎈' },
      '07-01': { name: '建党节', message: '不忘初心，牢记使命', emoji: '🇨🇳' },
      '08-01': { name: '建军节', message: '致敬最可爱的人', emoji: '🎖️' },
      '09-10': { name: '教师节', message: '感谢每一位传道授业解惑的老师', emoji: '🍎' },
      '10-01': { name: '国庆节', message: '祖国生日快乐，愿山河无恙，人民安康', emoji: '🎆' },
      '12-25': { name: '圣诞节', message: '圣诞快乐，愿你被爱包围', emoji: '🎄' }
    }
  }

  /**
   * 获取当前时间场景
   */
  getCurrentTimeScene() {
    const hour = new Date().getHours()

    // 特殊处理 midnight（23:00 - 5:00）
    if (hour >= 23 || hour < 5) {
      return { key: 'midnight', ...this.timeScenes.midnight }
    }

    for (const [key, scene] of Object.entries(this.timeScenes)) {
      if (key === 'midnight') continue
      if (hour >= scene.start && hour < scene.end) {
        return { key, ...scene }
      }
    }

    return { key: 'unknown', name: '未知', emoji: '🕐' }
  }

  /**
   * 获取时间场景问候语
   */
  getTimeGreeting() {
    const scene = this.getCurrentTimeScene()
    const greetings = {
      dawn: ['黎明破晓，新的一天开始了', '晨光熹微，愿你有个美好的开始'],
      morning: ['早上好！愿你今天充满活力', '美好的上午，适合阅读和思考'],
      noon: ['正午时光，给自己一个小憩', '阳光正好，心情也跟着明朗'],
      afternoon: ['午后时光，最适合慢慢品读', '下午好，来杯茶配文字如何？'],
      evening: ['夕阳西下，一天即将结束', '傍晚时分，回味今日的收获'],
      night: ['夜幕降临，静谧的阅读时光', '夜晚好，在文字中寻找心灵的慰藉'],
      midnight: ['深夜了，注意休息哦', '夜深人静，最适合与文字对话']
    }

    const messages = greetings[scene.key] || ['你好，欢迎来到墨语世界']
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    return {
      scene: scene.name,
      emoji: scene.emoji,
      message: randomMessage,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    }
  }

  /**
   * 获取特殊日期彩蛋
   */
  getSpecialDateEgg() {
    const today = new Date()
    const dateKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    if (this.specialDates[dateKey]) {
      return {
        isSpecial: true,
        ...this.specialDates[dateKey],
        date: today.toLocaleDateString('zh-CN')
      }
    }

    return { isSpecial: false }
  }

  /**
   * 获取作者状态
   */
  async getAuthorStatus() {
    try {
      // 从存储中获取作者状态，如果没有则随机生成
      let authorStatus = await StorageUtil.get('author_status')

      if (
        !authorStatus ||
        this.isStatusExpired(authorStatus.timestamp, authorStatus.duration)
      ) {
        const states = Object.keys(this.authorStates)
        const randomState = states[Math.floor(Math.random() * states.length)]

        authorStatus = {
          state: randomState,
          timestamp: Date.now(),
          duration: Math.floor(Math.random() * 4 + 1) * 60 * 60 * 1000 // 1-4小时
        }

        await StorageUtil.set('author_status', authorStatus)
      }

      const stateInfo = this.authorStates[authorStatus.state]
      return {
        ...stateInfo,
        state: authorStatus.state,
        timestamp: authorStatus.timestamp,
        timeLeft: this.getTimeLeft(authorStatus.timestamp, authorStatus.duration)
      }
    } catch (error) {
      console.error('获取作者状态失败:', error)
      return {
        ...this.authorStates.writing,
        state: 'writing',
        timestamp: Date.now(),
        timeLeft: '刚刚更新'
      }
    }
  }

  /**
   * 检查状态是否过期
   */
  isStatusExpired(timestamp, duration = 4 * 60 * 60 * 1000) {
    return Date.now() - timestamp > duration
  }

  /**
   * 获取剩余时间
   */
  getTimeLeft(timestamp, duration) {
    const remaining = Math.max(0, duration - (Date.now() - timestamp))

    if (remaining === 0) return '即将结束'

    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

    return hours > 0
      ? `还有${hours}小时${minutes}分钟`
      : `还有${minutes}分钟`
  }

  /**
   * 记录共鸣互动
   */
  async recordResonance(postId, type, extra = {}) {
    try {
      const resonanceData = {
        postId,
        type,
        timestamp: Date.now(),
        ...extra
      }

      // 获取现有的共鸣记录
      let resonances = (await StorageUtil.get('user_resonances')) || []
      resonances.push(resonanceData)

      // 只保留最近100条记录
      if (resonances.length > 100) {
        resonances = resonances.slice(-100)
      }

      await StorageUtil.set('user_resonances', resonances)

      // 返回共鸣反馈
      const resonanceInfo = this.resonanceTypes[type] || this.resonanceTypes.like
      return {
        success: true,
        feedback: {
          ...resonanceInfo,
          timestamp: resonanceData.timestamp
        }
      }
    } catch (error) {
      console.error('记录共鸣失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取情感化问候
   */
  async getEmotionalGreeting() {
    const timeGreeting = this.getTimeGreeting()
    const specialDate = this.getSpecialDateEgg()
    const authorStatus = await this.getAuthorStatus()

    const greeting = {
      time: timeGreeting,
      author: authorStatus,
      special: specialDate.isSpecial ? specialDate : null
    }

    // 如果是特殊日期，优先显示特殊问候
    if (specialDate.isSpecial) {
      greeting.primary = {
        message: `${specialDate.emoji} ${specialDate.message}`,
        type: 'special',
        title: `今天是${specialDate.name}`
      }
    } else {
      greeting.primary = {
        message: `${timeGreeting.emoji} ${timeGreeting.message}`,
        type: 'time',
        title: `${timeGreeting.scene}好`
      }
    }

    return greeting
  }

  /**
   * 获取阅读完成彩蛋
   */
  async getReadingCompleteEgg(postId, readingTime) {
    try {
      const eggs = [
        { type: 'time', message: '时光荏苒，感谢你的耐心阅读', emoji: '⏰' },
        { type: 'wisdom', message: '知识的种子已经播下，静待花开', emoji: '🌱' },
        { type: 'journey', message: '每一次阅读都是心灵的旅行', emoji: '🚀' },
        { type: 'growth', message: '在文字中成长，在思考中进步', emoji: '📈' },
        { type: 'connection', message: '文字连接你我，思想跨越时空', emoji: '🌉' }
      ]

      const randomEgg = eggs[Math.floor(Math.random() * eggs.length)]

      // 根据阅读时间给出不同的反馈
      let timeBonus = ''
      if (readingTime > 300) {
        // 5分钟以上
        timeBonus = '深度阅读者，为你的专注点赞！'
      } else if (readingTime > 120) {
        // 2分钟以上
        timeBonus = '认真的读者，感谢你的用心！'
      } else {
        timeBonus = '快速浏览也是一种阅读方式！'
      }

      // 获取一言作为额外彩蛋
      const hitokoto = await hitokotoManager.getHitokoto('i')

      return {
        egg: randomEgg,
        timeBonus,
        readingTime: Math.floor(readingTime),
        hitokoto: hitokoto.content
          ? {
              text: hitokoto.content,
              from: hitokoto.source || '未知',
              author: hitokoto.author || '佚名'
            }
          : null,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('获取阅读完成彩蛋失败:', error)
      return {
        egg: { type: 'default', message: '感谢你的阅读！', emoji: '📖' },
        timeBonus: '每一次阅读都是收获！',
        readingTime: Math.floor(readingTime),
        timestamp: Date.now()
      }
    }
  }

  /**
   * 获取深夜阅读彩蛋
   */
  getMidnightReaderEgg() {
    const hour = new Date().getHours()

    if (hour >= 23 || hour < 6) {
      const messages = [
        '夜深了，记得早点休息哦 🌙',
        '深夜读书人，向你的坚持致敬 ✨',
        '夜色如墨，文字如灯 🕯️',
        '在这静谧的夜晚，与文字相伴 🌌',
        '夜猫子读者，注意保护眼睛哦 👀'
      ]

      return {
        isMidnight: true,
        message: messages[Math.floor(Math.random() * messages.length)],
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        advice: '适度阅读，健康生活'
      }
    }

    return { isMidnight: false }
  }

  /**
   * 获取随机鼓励语
   */
  getRandomEncouragement() {
    const encouragements = [
      { text: '每一次阅读都是成长', emoji: '🌱' },
      { text: '知识的力量无穷无尽', emoji: '💪' },
      { text: '思考让生活更有意义', emoji: '🧠' },
      { text: '文字是心灵的窗户', emoji: '🪟' },
      { text: '阅读是最好的投资', emoji: '💎' },
      { text: '智慧在于不断学习', emoji: '📚' },
      { text: '每个字都值得细细品味', emoji: '🍵' },
      { text: '好奇心是最好的老师', emoji: '🔍' }
    ]

    return encouragements[Math.floor(Math.random() * encouragements.length)]
  }
}

// 创建全局实例
const emotionManager = new EmotionManager()

module.exports = {
  emotionManager
}
