// @flow

// This plugin scrolls the scrollcontainer to absolute top or bottom if first block or last block is selected

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
          scrollContainer.current.scrollTo({
            left: 0,
            top: 0,
            behavior: 'smooth'
          })
        }
      }
      return next()
    }
  }
}
