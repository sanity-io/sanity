// @flow

import type {SlateEditor} from '../typeDefs'

// This plugin makes sure arrow-down-navigation works in Firefox when on void-blocks

export default function FirefoxVoidNodePlugin() {
  const browser = navigator.userAgent.toLowerCase()
  if (browser.indexOf('firefox') === -1) {
    return {}
  }
  return {
    onKeyDown(event: SyntheticKeyboardEvent<*>, editor: SlateEditor, next: void => void) {
      if (event.key !== 'ArrowDown') {
        return next()
      }
      if (!editor.query('isVoid', editor.value.focusBlock)) {
        return next()
      }
      event.preventDefault()
      editor.moveForward()
      return editor
    }
  }
}
