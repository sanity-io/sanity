import isScrollContainer from './isScrollContainer'

const getOffsetsTo = (source: HTMLElement, target: HTMLElement) => {
  let el: HTMLElement | null = source

  const bounds: {top: number; height: number} = {
    top: 0,
    height: Number.MAX_SAFE_INTEGER
  }

  let top = 0
  let left = 0
  let foundScrollContainer = false

  while (el && el !== target) {
    if (foundScrollContainer) {
      bounds.top += el.offsetTop
    }

    if (isScrollContainer(el)) {
      bounds.top = el.offsetTop
      bounds.height = el.offsetHeight
      foundScrollContainer = true
    }
    top += el.offsetTop - el.scrollTop
    left += el.offsetLeft - el.scrollLeft
    el = el.offsetParent as HTMLElement
  }

  return {
    top,
    left,
    bounds: {
      top: bounds.top,
      bottom: bounds.top + bounds.height
    }
  }
}

export default getOffsetsTo
