import {useCallback, useState} from 'react'
import {
  VIRTUAL_LIST_CHILDREN_UI_NAME,
  VIRTUAL_LIST_ITEM_HEIGHT,
  VIRTUAL_LIST_UI_NAME,
} from '../constants'

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
    const listElement = document.querySelector(`[data-ui="${VIRTUAL_LIST_UI_NAME}"]`)
    const childrenElement = document.querySelector(`[data-ui="${VIRTUAL_LIST_CHILDREN_UI_NAME}"]`)

    if (listElement && childrenElement) {
      const listElementTop = listElement.getBoundingClientRect().top
      const childrenElementTop = childrenElement?.getBoundingClientRect().top
      const index = Math.floor((listElementTop - childrenElementTop) / VIRTUAL_LIST_ITEM_HEIGHT)
      setSavedSearchIndex(index)
    } else {
      setSavedSearchIndex(0)
    }
  }, [])

  return {
    saveSearchIndex,
    savedSearchIndex,
  }
}
