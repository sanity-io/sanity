// @flow

import isKeyHotkey, {toKeyName} from 'is-hotkey'
import {Change} from 'slate'

type Options = {
  decorators?: string[]
}

// This plugin makes keyboard shortcuts for decorators

const isStrongHotkey = isKeyHotkey('mod+b')
const isEmphasisHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotKey = isKeyHotkey("mod+'")

const modKeyPlatformName = toKeyName('mod')

export const keyMaps = {
  strong: `${modKeyPlatformName} + b`,
  em: `${modKeyPlatformName} + i`,
  underline: `${modKeyPlatformName} + u`,
  code: `${modKeyPlatformName} + '`
}

export default function SetMarksOnKeyComboPlugin(options: Options = {}) {
  const decorators = options.decorators || []
  return {
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change) {
      let mark
      if (isStrongHotkey(event)) {
        mark = 'strong'
      } else if (isEmphasisHotkey(event)) {
        mark = 'em'
      } else if (isUnderlinedHotkey(event)) {
        mark = 'underline'
      } else if (isCodeHotKey(event)) {
        mark = 'code'
      } else {
        return undefined
      }
      // Return if not supported by schema
      if (!decorators.includes(mark)) {
        return undefined
      }
      event.preventDefault()
      return change.toggleMark(mark)
    }
  }
}
