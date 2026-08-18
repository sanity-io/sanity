function acceptsNativePaste(node: EventTarget | undefined): boolean {
  const element = node as Partial<HTMLInputElement | HTMLTextAreaElement> | undefined
  const isTextField = element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA'
  return isTextField && element?.readOnly === false
}

/**
 * Whether a paste seen by Vision's `document` level listener was meant for Vision. The listener is
 * global, so it also observes pastes aimed at unrelated elements such as the Studio search field.
 *
 * Uses the dispatch path rather than `event.target`, because CodeMirror handles the paste and
 * re-renders the pasted line before the event reaches `document`, detaching the original target.
 */
export function isVisionPasteTarget(root: Node | null, event: ClipboardEvent): boolean {
  const path = event.composedPath()
  const [target] = path

  // A readonly field keeps focus after Copy URL but drops the paste, so Vision still claims it
  if (acceptsNativePaste(target)) {
    return false
  }

  // Nothing focused
  if (target === window.document || target === window.document.body) {
    return true
  }

  return root !== null && path.includes(root)
}
