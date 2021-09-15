export function hasOverflowScroll(el: HTMLElement): boolean {
  const overflow = getComputedStyle(el).overflow

  return overflow.includes('auto') || overflow.includes('scroll')
}

// Check whether an element is currently scrollable (meaning it must both have overflow scroll *and* content overflowing)
export function isScrollable(el: HTMLElement): boolean {
  const scrollableContent = el.scrollHeight !== el.offsetHeight || el.scrollWidth !== el.offsetWidth

  return scrollableContent && hasOverflowScroll(el)
}
