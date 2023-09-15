export function getCaretElement(rootElement: HTMLElement | null): HTMLElement | null {
  const selection = window.getSelection()

  if (!selection || selection.type !== 'Caret') return null

  const selectionRange = selection.getRangeAt(0)
  const isWithinRoot = rootElement?.contains(selectionRange.commonAncestorContainer)

  if (!isWithinRoot) return null

  const {anchorNode, focusNode} = selection

  if (rootElement?.contains(anchorNode) && anchorNode === focusNode) {
    try {
      const range = window.getSelection()?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()
      if (rect) {
        const element = {
          getBoundingClientRect: () => rect,
        } as HTMLElement
        return element
      }
    } catch (_) {
      return null
    }
  }

  return null
}
