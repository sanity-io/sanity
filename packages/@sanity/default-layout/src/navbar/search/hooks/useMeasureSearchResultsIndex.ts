import {useCallback, useState} from 'react'
import {VIRTUAL_LIST_ITEM_HEIGHT} from '../constants'

export function useMeasureSearchResultsIndex(
  childContainerElement: HTMLDivElement | null
): {
  lastSearchIndex: number
  resetLastSearchIndex: () => void
  setLastSearchIndex: () => void
} {
  const [lastSearchIndex, setSavedSearchIndex] = useState<number>(0)

  const resetLastSearchIndex = useCallback(() => {
    setSavedSearchIndex(0)
  }, [])

  /**
   * Query search result children for the 'top most' visible element (factoring in overscan)
   * and obtain its index.
   */
  const setLastSearchIndex = useCallback(() => {
    const childContainerParentElement = childContainerElement?.parentElement

    if (childContainerParentElement && childContainerElement) {
      const childContainerParentElementTop = childContainerParentElement.getBoundingClientRect().top
      const childContainerElementTop = childContainerElement.getBoundingClientRect().top
      const index = Math.floor(
        (childContainerParentElementTop - childContainerElementTop) / VIRTUAL_LIST_ITEM_HEIGHT
      )
      setSavedSearchIndex(index)
    } else {
      setSavedSearchIndex(0)
    }
  }, [childContainerElement])

  return {
    lastSearchIndex,
    resetLastSearchIndex,
    setLastSearchIndex,
  }
}
