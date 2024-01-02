import {_getDOMPath} from './_getDOMPath'

const EMPTY_PATH: number[] = []

/**
 * @internal
 */
export function _sortElements(rootElement: HTMLElement, elements: HTMLElement[]): void {
  // Create a map containing the DOM path of each pane element.
  // The DOM path is relative to the `rootElement`, and is used in the next step for sorting.
  const map = new WeakMap<HTMLElement, number[]>()

  for (const element of elements) {
    map.set(element, _getDOMPath(rootElement, element))
  }

  const _sortByElementPath = (a: HTMLElement, b: HTMLElement) => {
    const _a = map.get(a) || EMPTY_PATH
    const _b = map.get(b) || EMPTY_PATH

    const len = Math.max(_a.length, _b.length)

    // Loop until there are different indexes
    for (let i = 0; i < len; i += 1) {
      const aIndex = _a[i] || -1
      const bIndex = _b[i] || -1

      if (aIndex !== bIndex) {
        return aIndex - bIndex
      }
    }

    return 0
  }

  elements.sort(_sortByElementPath)
}
