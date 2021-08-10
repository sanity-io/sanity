import {Editor} from 'slate'

export const PATCHING: WeakMap<Editor, boolean | undefined> = new WeakMap()

export function withoutPatching(editor: Editor, fn: () => void): void {
  const prev = isPatching(editor)
  PATCHING.set(editor, false)
  fn()
  PATCHING.set(editor, prev)
}

export function isPatching(editor: Editor): boolean | undefined {
  return PATCHING.get(editor)
}
