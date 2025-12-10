const ICONS = {
  search: 'M10 18a8 8 0 1 1 5.657-2.343l4.243 4.243-1.414 1.414-4.243-4.243A7.963 7.963 0 0 1 10 18zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  calendar: 'M3 4h14v14H3V4zm2 2v2h2V6H5zm4 0v2h2V6H9zm4 0v2h2V6h-2zM5 10v2h2v-2H5zm4 0v2h2v-2H9zm4 0v2h2v-2h-2zM5 14v2h2v-2H5zm4 0v2h2v-2H9zm4 0v2h2v-2h-2z',
  folder: 'M2 5h6l2 2h8v11H2V5z',
  chart: 'M4 16h2V8H4v8zm4 0h2V4H8v12zm4 0h2v-6h-2v6zm4 0h2v-10h-2v10z',
  arrowLeft: 'M15 4l-8 8 8 8v-5h7v-6h-7V4z',
  share: 'M12 5l4 4-1.4 1.4L13 8.8V15h-2V8.8l-1.6 1.6L8 9l4-4zM6 17h12v2H6v-2z',
  heart: 'M12 21s-6-4.35-9-7.35C-1 12 2 6 6 8c2 1 3 3 6 5 3-2 4-4 6-5 4-2 7 4 3 5.65C18 16.65 12 21 12 21z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  clock: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm1-10.59l3.3 1.91-.99 1.72L11 13V7h2v4.41z'
}

Component({
  properties: {
    name: { type: String, value: 'search' },
    size: { type: Number, value: 32 },
    color: { type: String, value: '#333' }
  },
  data: {
    svgSrc: ''
  },
  observers: {
    'name,size,color': function(name, size, color) {
      const path = ICONS[name] || ICONS.search
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="${path}"/></svg>`
      const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
      this.setData({ svgSrc: uri })
    }
  },
  lifetimes: {
    attached() {
      const { name, size, color } = this.data
      const path = ICONS[name] || ICONS.search
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="${path}"/></svg>`
      const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
      this.setData({ svgSrc: uri })
    }
  }
})
