const isScrollContainer = el => {
  if (el.scrollHeight !== el.offsetHeight || el.scrollWidth !== el.offsetWidth) {
    return true
  }
  const overflow = getComputedStyle(el).overflow
  return overflow.includes('auto') || overflow.includes('scroll')
}
export default isScrollContainer
