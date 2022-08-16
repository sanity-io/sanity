import {useCallback, useState} from 'react'
import {VIRTUAL_LIST_ITEM_HEIGHT} from '../constants'

export function useMeasureSearchResultsIndex(
  childContainerElement: HTMLDivElement
): {
  saveSearchIndex: () => void
  savedSearchIndex: number
} {
  const [savedSearchIndex, setSavedSearchIndex] = useState<number>()

  /**
   * Query search result children for the 'top most' visible element (factoring in overscan)
   * and obtain its index.
   */
  const saveSearchIndex = useCallback(() => {
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
    saveSearchIndex,
    savedSearchIndex,
  }
}
