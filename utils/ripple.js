export function createRipple(event, element) {
  const rect = element.getBoundingClientRect()
  const x = event.touches[0].clientX - rect.left
  const y = event.touches[0].clientY - rect.top
  const size = Math.max(rect.width, rect.height)
  const ripple = document.createElement('view')
  ripple.className = 'ripple-effect'
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${x - size / 2}px`
  ripple.style.top = `${y - size / 2}px`
  element.appendChild(ripple)
  setTimeout(() => { ripple.remove() }, 600)
}
