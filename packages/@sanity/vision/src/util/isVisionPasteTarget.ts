function isTextEntryElement(node: EventTarget | undefined): boolean {
  const tagName = (node as Partial<Element> | undefined)?.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA'
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

  // Text fields paste natively; the query and params editors are `contenteditable`, not form fields
  if (isTextEntryElement(target)) {
    return false
  }

  // Nothing focused
  if (target === window.document || target === window.document.body) {
    return true
  }

  return root !== null && path.includes(root)
}
