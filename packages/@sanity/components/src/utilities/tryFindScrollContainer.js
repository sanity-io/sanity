/* global window, document */
export default function tryFindScrollContainer(element, callback) {
  if (!window || !document) {
    return false
  }

  if (!element) {
    console.error('tryFindScrollContainer: No element', element) //eslint-disable-line
  }

  let scrollContainer = element
  let foundScrollContainer = false

  while (!foundScrollContainer) {
    if (!scrollContainer || !scrollContainer.parentNode) {
      break
    }

    if (['overlay', 'auto', 'scroll'].includes(window.getComputedStyle(scrollContainer).overflowY)) {
      foundScrollContainer = true
      break
    }
    scrollContainer = scrollContainer.parentNode
  }

  if (scrollContainer === document) {
    scrollContainer = document.body
  }

  return callback(scrollContainer)
}
