// @flow

// This plugin scrolls the scrollcontainer to absolute top or bottom if first block or last block is selected

function scrollToTop(scrollContainer, isEdge) {
  if (window.navigator.userAgent.indexOf('Edge') > -1) {
    scrollContainer.scrollTop = 0
    return
  }
  scrollContainer.scrollTo({
    left: 0,
    top: 0,
    behavior: 'smooth'
  })
}

export default function ScrollAbsoluteTopBottomPlugin(scrollContainer: ElementRef<any>) {
  return {
    // eslint-disable-next-line complexity
    onChange(editor: any, next: void => void) {
      const {focusBlock, anchorBlock, document, selection} = editor.value
      if (!(scrollContainer && scrollContainer.current)) {
        return next()
      }
      if (!focusBlock) {
        return next()
      }
      if (focusBlock.key === anchorBlock.key) {
        const isFirstBlock = focusBlock.key === document.nodes.first().key
        const isStartOffset = selection.focus.offset === 0
        if (isFirstBlock && isStartOffset) {
          scrollToTop(scrollContainer.current)
        }
      }
      return next()
    }
  }
}
