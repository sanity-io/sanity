import {RefObject, useCallback, useState} from 'react'
import {VIRTUAL_LIST_OVERSCAN} from '../constants'

export function useSaveSearchIndexOnClose({
  childContainerRef,
  onClose,
  saveOnClose,
}: {
  childContainerRef: RefObject<HTMLDivElement>
  onClose: () => void
  saveOnClose?: boolean
}): {
  handleClose: () => void
  savedSearchIndex: number
} {
  const [savedSearchIndex, setSavedSearchIndex] = useState<number>()

  const handleClose = useCallback(() => {
    let targetIndex: number
    if (saveOnClose) {
      const firstElement = childContainerRef?.current?.children?.[
        VIRTUAL_LIST_OVERSCAN
      ] as HTMLElement

      if (firstElement) {
        targetIndex = Number(firstElement.dataset.index)
        if (targetIndex <= VIRTUAL_LIST_OVERSCAN) {
          targetIndex = 0
        }
        if (typeof targetIndex === 'number') {
          setSavedSearchIndex(targetIndex)
        }
      }
    }

    onClose()
  }, [childContainerRef, saveOnClose, onClose])

  return {
    handleClose,
    savedSearchIndex,
  }
}
