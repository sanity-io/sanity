import isScrollContainer from './isScrollContainer'

const SCROLL_INTO_VIEW_TOP_PADDING = -15

const scrollIntoView = field => {
  const element = field.element

  let parentElementWithScroll = element.parentElement

  while (!isScrollContainer(parentElementWithScroll)) {
    parentElementWithScroll = parentElementWithScroll.parentElement
  }

  parentElementWithScroll.scroll({
    top:
      parentElementWithScroll.scrollTop +
      field.rect.top -
      field.rect.bounds.top +
      SCROLL_INTO_VIEW_TOP_PADDING,
    left: 0,
    behavior: 'smooth'
  })
}

export default scrollIntoView
