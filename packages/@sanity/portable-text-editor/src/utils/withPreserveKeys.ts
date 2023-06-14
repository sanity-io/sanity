import {Editor} from 'slate'

export const PRESERVE_KEYS: WeakMap<Editor, boolean | undefined> = new WeakMap()

export function withPreserveKeys(editor: Editor, fn: () => void): void {
  const prev = isPreservingKeys(editor)
  PRESERVE_KEYS.set(editor, true)
  fn()
  PRESERVE_KEYS.set(editor, prev)
}

export function isPreservingKeys(editor: Editor): boolean | undefined {
  return PRESERVE_KEYS.get(editor)
}
