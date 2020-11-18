import {hasOverflowScroll} from './scrollUtils'

const getOffsetsTo = (source: HTMLElement, target: HTMLElement) => {
  let el: HTMLElement | null = source

  const bounds: {top: number; height: number; left: number; width: number} = {
    top: 0,
    left: 0,
    height: Number.MAX_SAFE_INTEGER,
    width: Number.MAX_SAFE_INTEGER,
  }

  let top = 0
  let left = 0
  let foundScrollContainer = false

  while (el && el !== target) {
    if (foundScrollContainer) {
      bounds.top += el.offsetTop
      bounds.left += el.offsetLeft
    }

    if (hasOverflowScroll(el)) {
      bounds.top = el.offsetTop
      bounds.height = el.offsetHeight
      bounds.left = el.offsetLeft
      bounds.width = el.offsetWidth
      foundScrollContainer = true
    }
    top += el.offsetTop - el.scrollTop
    left += el.offsetLeft - el.scrollLeft
    el = el.offsetParent as HTMLElement
  }

  return {
    rect: {
      top,
      left,
      height: source.offsetHeight,
      width: source.offsetWidth,
    },
    bounds: bounds,
  }
}

const time = <Args, Ret>(label, fn: (...args: Args[]) => Ret): ((...args: Args[]) => Ret) => {
  return (...args: Args[]) => {
    // eslint-disable-next-line no-console
    console.time(label)
    const ret = fn(...args)
    // eslint-disable-next-line no-console
    console.timeEnd(label)
    return ret
  }
}

export default getOffsetsTo
