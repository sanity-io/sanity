import {useCallback, useState} from 'react'
import {VIRTUAL_LIST_CHILDREN_UI_NAME, VIRTUAL_LIST_OVERSCAN} from '../constants'

export function useSaveSearchResultsIndexOnClose(): {
  saveSearchIndex: () => void
  savedSearchIndex: number
} {
  const [savedSearchIndex, setSavedSearchIndex] = useState<number>()

  /**
   * Query search result children for the 'top most' visible element (factoring in overscan)
   * and obtain its index.
   */
  const saveSearchIndex = useCallback(() => {
    const childrenElement = document.querySelector(`[data-ui="${VIRTUAL_LIST_CHILDREN_UI_NAME}"]`)
    const topMostElement = childrenElement?.children?.[VIRTUAL_LIST_OVERSCAN] as HTMLElement

    if (topMostElement) {
      let targetIndex = Number(topMostElement.dataset.index || 0)
      if (targetIndex <= VIRTUAL_LIST_OVERSCAN) {
        targetIndex = 0
      }
      setSavedSearchIndex(targetIndex)
    } else {
      setSavedSearchIndex(0)
    }
  }, [])

  return {
    saveSearchIndex,
    savedSearchIndex,
  }
}
