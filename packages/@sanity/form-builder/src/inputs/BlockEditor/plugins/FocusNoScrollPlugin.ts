import React from 'react'
import {SlateEditor} from '../typeDefs'

// This plugin focuses the block editor without scrolling to the focus

export default function FocusNoScrollPlugin(scrollContainer: React.RefObject<any>) {
  let originalScroll = 0
  const preventScrollFn = event => {
    event.preventDefault()
    if (event.target instanceof HTMLElement) {
      event.target.scrollTop = originalScroll
    }
  }
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, editor: SlateEditor, next: (arg0: void) => void) {
      if (command.type !== 'focusNoScroll') {
        return next()
      }
      if (scrollContainer && scrollContainer.current) {
        originalScroll = scrollContainer.current.scrollTop
        scrollContainer.current.addEventListener('scroll', preventScrollFn)
        editor.focus()
        setTimeout(() => {
          if (scrollContainer && scrollContainer.current) {
            scrollContainer.current.scrollTop = originalScroll
            scrollContainer.current.removeEventListener('scroll', preventScrollFn)
          }
        }, 300)
        return editor
      }
      return next()
    }
  }
}
