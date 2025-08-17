/**
 * 动效管理器
 * 提供统一的动画效果管理和控制
 */

class AnimationManager {
  constructor() {
    this.animations = new Map()
    this.defaultDuration = 300
    this.defaultEasing = 'ease-out'

    // 预定义动画配置
    this.presets = {
      // 页面切换动画
      pageTransition: {
        slideLeft: {
          duration: 400,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        },
        slideRight: {
          duration: 400,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        },
        fadeIn: {
          duration: 300,
          easing: 'ease-out'
        }
      },

      // 按钮点击动画
      buttonClick: {
        scale: {
          duration: 150,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        ripple: {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      },

      // 点赞动画
      like: {
        heart: {
          duration: 800,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        float: {
          duration: 1200,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }
      },

      // 加载动画
      loading: {
        spin: {
          duration: 1000,
          easing: 'linear',
          infinite: true
        },
        pulse: {
          duration: 1500,
          easing: 'ease-in-out',
          infinite: true
        },
        bounce: {
          duration: 1000,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          infinite: true
        }
      },

      // 节日专属动效
      festival: {
        snow: {
          duration: 3000,
          easing: 'linear',
          infinite: true
        },
        fireworks: {
          duration: 2000,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        },
        sakura: {
          duration: 4000,
          easing: 'ease-in-out',
          infinite: true
        }
      }
    }
  }

  /**
   * 创建动画实例
   * @param {string} id 动画ID
   * @param {Object} config 动画配置
   */
  createAnimation(id, config = {}) {
    const animation = {
      id,
      duration: config.duration || this.defaultDuration,
      easing: config.easing || this.defaultEasing,
      delay: config.delay || 0,
      infinite: config.infinite || false,
      direction: config.direction || 'normal',
      fillMode: config.fillMode || 'forwards',
      playState: 'paused',
      progress: 0,
      callbacks: {
        start: config.onStart || null,
        update: config.onUpdate || null,
        complete: config.onComplete || null
      }
    }

    this.animations.set(id, animation)
    return animation
  }

  /**
   * 播放动画
   * @param {string} id 动画ID
   * @param {Object} options 播放选项
   */
  play(id, options = {}) {
    const animation = this.animations.get(id)
    if (!animation) {
      console.warn(`Animation ${id} not found`)
      return
    }

    animation.playState = 'running'

    if (animation.callbacks.start) {
      animation.callbacks.start(animation)
    }

    // 模拟动画播放
    this._simulateAnimation(animation, options)
  }

  /**
   * 暂停动画
   * @param {string} id 动画ID
   */
  pause(id) {
    const animation = this.animations.get(id)
    if (animation) {
      animation.playState = 'paused'
    }
  }

  /**
   * 停止动画
   * @param {string} id 动画ID
   */
  stop(id) {
    const animation = this.animations.get(id)
    if (animation) {
      animation.playState = 'paused'
      animation.progress = 0
    }
  }

  /**
   * 获取预设动画配置
   * @param {string} category 动画分类
   * @param {string} type 动画类型
   */
  getPreset(category, type) {
    return this.presets[category]?.[type] || null
  }

  /**
   * 页面切换动画
   * @param {string} direction 切换方向
   * @param {Function} callback 完成回调
   */
  pageTransition(direction = 'slideLeft', callback) {
    const config = this.getPreset('pageTransition', direction)
    if (!config) return

    const animationId = `page-transition-${Date.now()}`
    this.createAnimation(animationId, {
      ...config,
      onComplete: () => {
        this.animations.delete(animationId)
        if (callback) callback()
      }
    })

    this.play(animationId)
    return animationId
  }

  /**
   * 按钮点击动画
   * @param {string} selector 按钮选择器
   * @param {string} type 动画类型
   */
  buttonClick(selector, type = 'scale') {
    const config = this.getPreset('buttonClick', type)
    if (!config) return

    const animationId = `button-click-${Date.now()}`
    this.createAnimation(animationId, {
      ...config,
      onComplete: () => {
        this.animations.delete(animationId)
      }
    })

    this.play(animationId, { selector })
    return animationId
  }

  /**
   * 点赞动画
   * @param {string} selector 元素选择器
   * @param {Object} options 动画选项
   */
  likeAnimation(selector, options = {}) {
    const heartConfig = this.getPreset('like', 'heart')
    const floatConfig = this.getPreset('like', 'float')

    if (!heartConfig || !floatConfig) return

    // 心形缩放动画
    const heartId = `like-heart-${Date.now()}`
    this.createAnimation(heartId, {
      ...heartConfig,
      onComplete: () => {
        this.animations.delete(heartId)
      }
    })

    // 浮动效果
    const floatId = `like-float-${Date.now()}`
    this.createAnimation(floatId, {
      ...floatConfig,
      delay: 200,
      onComplete: () => {
        this.animations.delete(floatId)
        if (options.onComplete) options.onComplete()
      }
    })

    this.play(heartId, { selector })
    setTimeout(() => {
      this.play(floatId, { selector })
    }, 200)

    return { heartId, floatId }
  }

  /**
   * 加载动画
   * @param {string} selector 元素选择器
   * @param {string} type 动画类型
   */
  loadingAnimation(selector, type = 'spin') {
    const config = this.getPreset('loading', type)
    if (!config) return

    const animationId = `loading-${type}-${Date.now()}`
    this.createAnimation(animationId, config)

    this.play(animationId, { selector })
    return animationId
  }

  /**
   * 淡入动画
   * @param {string} selector 元素选择器
   * @param {Object} options 动画选项
   */
  fadeIn(selector, options = {}) {
    const config = this.getPreset('pageTransition', 'fadeIn')
    if (!config) return

    const animationId = `fade-in-${Date.now()}`
    this.createAnimation(animationId, {
      ...config,
      ...options,
      onComplete: () => {
        this.animations.delete(animationId)
        if (options.onComplete) options.onComplete()
      }
    })

    this.play(animationId, { selector })
    return animationId
  }

  /**
   * 节日动效
   * @param {string} festival 节日类型
   * @param {Object} options 动画选项
   */
  festivalAnimation(festival, options = {}) {
    const config = this.getPreset('festival', festival)
    if (!config) return

    const animationId = `festival-${festival}-${Date.now()}`
    this.createAnimation(animationId, {
      ...config,
      ...options,
      onComplete: () => {
        if (!config.infinite) {
          this.animations.delete(animationId)
        }
        if (options.onComplete) options.onComplete()
      }
    })

    this.play(animationId, options)
    return animationId
  }

  /**
   * 创建自定义动画序列
   * @param {Array} sequence 动画序列
   * @param {Object} options 选项
   */
  createSequence(sequence, options = {}) {
    const sequenceId = `sequence-${Date.now()}`
    let currentIndex = 0

    const playNext = () => {
      if (currentIndex >= sequence.length) {
        if (options.onComplete) options.onComplete()
        return
      }

      const step = sequence[currentIndex]
      const stepId = `${sequenceId}-step-${currentIndex}`

      this.createAnimation(stepId, {
        ...step,
        onComplete: () => {
          this.animations.delete(stepId)
          currentIndex++
          if (step.delay) {
            setTimeout(playNext, step.delay)
          } else {
            playNext()
          }
        }
      })

      this.play(stepId, step.options)
    }

    playNext()
    return sequenceId
  }

  /**
   * 模拟动画播放（小程序环境下的简化实现）
   * @private
   */
  _simulateAnimation(animation, options = {}) {
    const startTime = Date.now()
    const { duration, callbacks } = animation

    const update = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      animation.progress = progress

      if (callbacks.update) {
        callbacks.update(animation, progress)
      }

      if (progress < 1 && animation.playState === 'running') {
        // 小程序环境使用setTimeout替代requestAnimationFrame
        setTimeout(update, 16) // 约60fps
      } else if (progress >= 1) {
        animation.playState = 'finished'
        if (callbacks.complete) {
          callbacks.complete(animation)
        }

        // 无限循环动画
        if (animation.infinite && animation.playState !== 'paused') {
          animation.progress = 0
          animation.playState = 'running'
          setTimeout(() => this._simulateAnimation(animation, options), 0)
        }
      }
    }

    // 小程序环境使用setTimeout替代requestAnimationFrame
    setTimeout(update, 16) // 约60fps
  }

  /**
   * 清理所有动画
   */
  clearAll() {
    this.animations.clear()
  }

  /**
   * 获取动画状态
   * @param {string} id 动画ID
   */
  getAnimationState(id) {
    return this.animations.get(id) || null
  }

  /**
   * 批量控制动画
   * @param {Array} ids 动画ID数组
   * @param {string} action 操作类型
   */
  batchControl(ids, action) {
    ids.forEach(id => {
      switch (action) {
        case 'play':
          this.play(id)
          break
        case 'pause':
          this.pause(id)
          break
        case 'stop':
          this.stop(id)
          break
      }
    })
  }
}

// 创建全局实例
const animationManager = new AnimationManager()

module.exports = {
  animationManager
}
