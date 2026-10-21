import {useState} from 'react'

import {type PerspectiveMenuExtension} from './PerspectiveMenuExtension'

/**
 * PROPOSED (Variants 2.0 test studio): the state of a host's search for a long perspective menu (see `PerspectiveMenuExtension.search`).
 * The search shows only when the menu holds more than `search.above` entries. The text belongs to the perspective it was typed under: picking an
 * entry changes the perspective, so the next opening starts empty.
 *
 * @internal
 */
export function useReleaseMenuSearch(
  search: PerspectiveMenuExtension['search'],
  entryCount: number,
  selectedPerspectiveName: string | undefined,
): {searchable: boolean; query: string; needle: string; setQuery: (text: string) => void} {
  const [typed, setTyped] = useState<{perspective: string | undefined; text: string}>({
    perspective: undefined,
    text: '',
  })
  const query = typed.perspective === selectedPerspectiveName ? typed.text : ''
  const searchable = search !== undefined && entryCount > search.above
  return {
    searchable,
    query,
    needle: searchable ? query.trim().toLowerCase() : '',
    setQuery: (text: string) => setTyped({perspective: selectedPerspectiveName, text}),
  }
}
