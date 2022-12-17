import {Plugin} from 'vite'

const intro = `'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
`

export function sanityIsHotkeyPlugin(): Plugin {
  return {
    name: 'sanity/server/fix/is-hotkey',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('is-hotkey/lib/index.js')) {
        return null
      }

      let transformed = code

      transformed = transformed.replace(intro, '')

      // `default` export
      transformed = transformed.replace('exports.default =', 'export default')

      // `isHotkey` export
      transformed = transformed.replace('exports.isHotkey = isHotkey;', 'export {isHotkey};')

      // `isCodeHotkey` export
      transformed = transformed.replace(
        'exports.isCodeHotkey = isCodeHotkey;',
        'export {isCodeHotkey};'
      )

      // `isKeyHotkey` export
      transformed = transformed.replace(
        'exports.isKeyHotkey = isKeyHotkey;',
        'export {isKeyHotkey};'
      )

      // `parseHotkey` export
      transformed = transformed.replace(
        'exports.parseHotkey = parseHotkey;',
        'export {parseHotkey};'
      )

      // `compareHotkey` export
      transformed = transformed.replace(
        'exports.compareHotkey = compareHotkey;',
        'export {compareHotkey};'
      )

      // `toKeyCode` export
      transformed = transformed.replace('exports.toKeyCode = toKeyCode;', 'export {toKeyCode};')

      // `toKeyName` export
      transformed = transformed.replace('exports.toKeyName = toKeyName;', 'export {toKeyName};')

      return transformed
    },
  }
}
