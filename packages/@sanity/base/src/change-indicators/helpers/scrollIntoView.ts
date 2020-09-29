import isScrollContainer from './isScrollContainer'

const SCROLL_INTO_VIEW_TOP_PADDING = -15

const scrollIntoView = field => {
  const element = field.element

  /*
   * Start at current element and check the parent for a scroll
   * bar until a scrollable element has been found.
   */
  let parentElementWithScroll = element

  while (!isScrollContainer(parentElementWithScroll)) {
    parentElementWithScroll = parentElementWithScroll.parentElement

    /*
     * If the parent element is null it means we are at the root
     * element, which has no parent. Since no scroll bar has
     * been found so far it does not make sense to scroll.
     */
    if (!parentElementWithScroll) {
      return
    }
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
