Component({
  data: { progress: 0 },
  attached() { this.observer = null; this.initObserver() },
  detached() { if (this.observer) { this.observer.disconnect() } },
  methods: {
    initObserver() {
      const scrollView = this.getScrollView()
      if (!scrollView) return
      this.observer = wx.createIntersectionObserver(this, { thresholds: Array.from({ length: 101 }, (_, i) => i / 100) })
      this.observer.relativeTo(scrollView, { top: 0, bottom: 0 }).observe('.post-content', (res) => {
        const progress = Math.round(res.intersectionRatio * 100)
        this.setData({ progress })
      })
    },
    getScrollView() {
      const pages = getCurrentPages(); const currentPage = pages[pages.length - 1]
      return currentPage.selectComponent('#main-scroll')
    }
  }
})
