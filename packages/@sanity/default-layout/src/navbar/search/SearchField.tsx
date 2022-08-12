import {Portal} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {useSaveSearchResultsIndexOnClose} from './hooks/useSaveSearchIndexOnClose'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

export function SearchField() {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const placeholderInputRef = useRef<HTMLInputElement>()

  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])
  const handleOpen = useCallback(() => setOpen(true), [setOpen])

  const {savedSearchIndex, saveSearchIndex} = useSaveSearchResultsIndexOnClose()

  /**
   * Store top-most search result index on close.
   * When re-opened, we pass the saved index to our virtual list to scroll back to position.
   */
  const handleClose = useCallback(() => {
    saveSearchIndex()
    onClose()
  }, [onClose, saveSearchIndex])

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
              onClose={handleClose}
              placeholderRef={placeholderInputRef}
              initialSearchIndex={savedSearchIndex}
            />
          </FocusLock>
        </Portal>
      )}
    </>
  )
}
