export const hasOverflowScroll = (el) => {
  const overflow = getComputedStyle(el).overflow
  return overflow.includes('auto') || overflow.includes('scroll')
}

// Check whether an element is currently scrollable (meaning it must both have overflow scroll *and* content overflowing)
export const isScrollable = (el) => {
  return (
    hasOverflowScroll(el) &&
    (el.scrollHeight !== el.offsetHeight || el.scrollWidth !== el.offsetWidth)
  )
}
