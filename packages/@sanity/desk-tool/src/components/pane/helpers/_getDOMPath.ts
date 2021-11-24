/**
 * @internal
 */
export function _getDOMPath(rootElement: HTMLElement, el: HTMLElement): number[] {
  const path: number[] = []

  let e = el

  while (e !== rootElement) {
    const parentElement = e.parentElement

    if (!parentElement) return path

    const children = Array.from(parentElement.childNodes)
    const index = children.indexOf(e)

    path.unshift(index)

    if (parentElement === rootElement) {
      return path
    }

    e = parentElement
  }

  return path
}
