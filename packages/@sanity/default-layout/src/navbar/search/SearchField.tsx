import {Portal} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {useMeasureSearchResultsIndex} from './hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

export function SearchField() {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const placeholderInputRef = useRef<HTMLInputElement>()
  const [open, setOpen] = useState(false)

  /**
   * Measure top-most visible search result index
   */
  const {savedSearchIndex, saveSearchIndex} = useMeasureSearchResultsIndex()

  /**
   * On close:
   * - Store top-most search result scroll index
   * - Re-focus the last element in the studio
   */
  const handleClose = useCallback(() => {
    saveSearchIndex()
    setOpen(false)
  }, [saveSearchIndex])

  const handleOpen = useCallback(() => setOpen(true), [])

  /**
   * Bind hotkeys to open / close actions
   */
  useSearchHotkeys({
    onClose: handleClose,
    onOpen: handleOpen,
    open,
  })

  return (
    <>
      <PlaceholderSearchInput onOpen={handleOpen} ref={placeholderInputRef} />
      {open && (
        <Portal>
          <FocusLock>
            <SearchPopover
              childContainerRef={childContainerRef}
              initialSearchIndex={savedSearchIndex}
              onClose={handleClose}
              placeholderRef={placeholderInputRef}
            />
          </FocusLock>
        </Portal>
      )}
    </>
  )
}
