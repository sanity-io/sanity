import {PortableTextEditor} from '@sanity/portable-text-editor'
import {useMemo} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

// This hook is used to scroll the editor selection into place when actively editing the document.
export function useScrollSelectionIntoView(scrollElement: HTMLElement | null) {
  return useMemo(
    () =>
      (editor: PortableTextEditor, domRange: Range): void => {
        const selection = PortableTextEditor.getSelection(editor)
        if (selection) {
          const leafEl = domRange.startContainer.parentElement
          if (!leafEl) {
            return
          }
          scrollIntoView(leafEl, {
            scrollMode: 'if-needed',
            boundary: scrollElement,
            block: 'start',
            inline: 'nearest',
          })
        }
      },
    [scrollElement]
  )
}
