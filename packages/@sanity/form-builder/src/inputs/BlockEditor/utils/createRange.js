import getWindow from 'get-window'

export default function createRange(event) {
  const window = getWindow(event.target)
  const {x, y} = event
  // Resolve the point where the drag is now
  let range
  // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
  if (window.document.caretRangeFromPoint) {
    range = window.document.caretRangeFromPoint(x, y)
  } else {
    range = window.document.createRange()
    range.setStart(event.rangeParent, event.rangeOffset)
  }

  if (!range || range.isCollapsed) {
    return null
  }

  const rangeOffset = range.startOffset
  const rangeLength = range.startContainer.wholeText ? range.startContainer.wholeText.length : 0
  const rangeIsAtStart = rangeOffset < rangeLength / 2
  range.detach()
  return {
    rangeOffset: rangeOffset,
    rangeLength: rangeLength,
    rangeIsAtStart: rangeIsAtStart
  }
}
