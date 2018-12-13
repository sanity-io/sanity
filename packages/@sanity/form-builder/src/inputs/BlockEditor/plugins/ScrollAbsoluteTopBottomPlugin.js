// @flow

// This plugin scrolls the scrollcontainer to absolute top or bottom if first block or last block is selected

export default function ScrollAbsoluteTopBottomPlugin(scrollContainer: ElementRef<any>) {
  return {
    // eslint-disable-next-line complexity
    onChange(editor: any, next: void => void) {
      if (scrollContainer && scrollContainer.current && editor.value.focusBlock) {
        const isFirstBlock =
          editor.value.focusBlock.key === editor.value.document.nodes.first().key &&
          editor.value.selection.focus.offset === 0
        const isLastBlock =
          editor.value.focusBlock.key === editor.value.document.nodes.last().key &&
          editor.value.selection.focus.offset === editor.value.focusBlock.text.length
        if (isFirstBlock || isLastBlock) {
          scrollContainer.current.scrollTo({
            left: 0,
            top: isFirstBlock ? 0 : scrollContainer.current.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
      return next()
    }
  }
}
