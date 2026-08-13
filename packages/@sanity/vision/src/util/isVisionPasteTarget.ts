function isTextEntryElement(node: EventTarget | undefined): boolean {
  const tagName = (node as Partial<Element> | undefined)?.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA'
}

/**
 * Vision listens for paste events on `document` so that a Sanity API URL can be pasted anywhere in
 * the tool without focusing the query editor first. Because the listener is global it also observes
 * pastes meant for elements Vision knows nothing about, such as the Studio search field that
 * renders in a portal above the tool, so the target has to be vetted before Vision consumes the
 * event.
 *
 * The dispatch path is used rather than `event.target`: CodeMirror handles the paste before it
 * bubbles up to `document` and re-renders the line it landed in, which detaches the original
 * target from the document. The path is captured when the event is dispatched, so it still
 * describes where the paste went.
 */
export function isVisionPasteTarget(root: Node | null, event: ClipboardEvent): boolean {
  const path = event.composedPath()
  const [target] = path

  // Text fields keep their native paste behaviour, including Vision's own. The query and params
  // editors are CodeMirror `contenteditable` elements rather than form fields, so URLs can still be
  // pasted straight into them.
  if (isTextEntryElement(target)) {
    return false
  }

  // A paste with nothing focused targets the document or its body. Vision fills the tool area, so
  // treat those as intended for Vision.
  if (target === window.document || target === window.document.body) {
    return true
  }

  return root !== null && path.includes(root)
}
