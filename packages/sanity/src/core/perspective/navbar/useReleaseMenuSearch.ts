import {useState} from 'react'

import {type PerspectiveMenuExtension} from './PerspectiveMenuExtension'

/**
 * PROPOSED (Variants 2.0 test studio): the state of a host's search for a long perspective menu (see `PerspectiveMenuExtension.search`).
 * The search shows only when the menu holds more than `search.above` entries. The text belongs to the perspective it was typed under: picking an
 * entry changes the perspective, so the next opening starts empty. While a search is typed the menu keeps the size it had when the first
 * character was typed (`size`), so filtering never makes it jump.
 *
 * @internal
 */
export function useReleaseMenuSearch(
  search: PerspectiveMenuExtension['search'],
  entryCount: number,
  selectedPerspectiveName: string | undefined,
): {
  searchable: boolean
  query: string
  needle: string
  size: {width: number; height: number} | null
  setQuery: (text: string, menu: HTMLElement | null) => void
} {
  const [typed, setTyped] = useState<{
    perspective: string | undefined
    text: string
    size: {width: number; height: number} | null
  }>({perspective: undefined, text: '', size: null})
  const current = typed.perspective === selectedPerspectiveName
  const query = current ? typed.text : ''
  const searchable = search !== undefined && entryCount > search.above
  return {
    searchable,
    query,
    needle: searchable ? query.trim().toLowerCase() : '',
    size: current && query ? typed.size : null,
    // Called from the input's change event, where the menu still has its unfiltered size: that is the size to keep.
    setQuery: (text, menu) => {
      const rect = menu?.getBoundingClientRect()
      const keep =
        current && typed.size ? typed.size : rect ? {width: rect.width, height: rect.height} : null
      setTyped({perspective: selectedPerspectiveName, text, size: text ? keep : null})
    },
  }
}
