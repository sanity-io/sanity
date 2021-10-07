import {PortableTextEditor} from '@sanity/portable-text-editor'
import scrollIntoView from 'scroll-into-view-if-needed'

export function scrollSelectionIntoView(editor: PortableTextEditor, domRange: Range): void {
  const selection = PortableTextEditor.getSelection(editor)
  if (selection) {
    const leafEl = domRange.startContainer.parentElement
    if (!leafEl) {
      return
    }
    leafEl.getBoundingClientRect = domRange.getBoundingClientRect.bind(domRange)
    let voidOffset = 0
    let voidIsVisible = false
    try {
      const block = PortableTextEditor.focusBlock(editor)
      const blockType = PortableTextEditor.getPortableTextFeatures(editor).types.block
      const isVoid = block._type !== blockType.name
      if (block && isVoid && leafEl.getBoundingClientRect) {
        const element = PortableTextEditor.findDOMNode(editor, block) as HTMLElement
        const boundingRect = element.getBoundingClientRect()
        voidOffset = boundingRect.height
        // Get container properties
        const cTop = leafEl.scrollTop
        const cBottom = cTop + leafEl.clientHeight
        // Get element properties
        const eTop = element.offsetTop
        const eBottom = eTop + element.clientHeight
        // Check if in view
        const isTotal = eTop >= cTop && eBottom <= cBottom
        const isPartial = (eTop < cTop && eBottom > cTop) || (eBottom > cBottom && eTop < cBottom)
        voidIsVisible = isTotal || isPartial
      }
    } catch (err) {
      // Nothing
    }
    scrollIntoView(leafEl, {
      scrollMode: voidOffset ? 'always' : 'if-needed',
      behavior: (actions) => {
        if (voidIsVisible) {
          return
        }
        actions.forEach(({el, top, left}) => {
          el.scrollTop = top - (voidOffset ? voidOffset + 5 : 0)
          el.scrollLeft = left
        })
      },
      block: voidOffset ? 'start' : 'center',
      inline: 'nearest',
    })
    delete leafEl.getBoundingClientRect
  }
}
