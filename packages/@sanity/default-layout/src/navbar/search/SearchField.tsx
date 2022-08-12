import {Portal} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {useSearchState} from './contexts/search'
import {hasSearchableTerms} from './contexts/search/selectors'
import {useSaveSearchIndexOnClose} from './hooks/useSaveSearchIndexOnClose'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

export function SearchField() {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const placeholderInputRef = useRef<HTMLInputElement>()

  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])
  const handleOpen = useCallback(() => setOpen(true), [setOpen])

  const {
    state: {terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms(terms)

  /**
   * Retrieve and retain top-most search index on close
   */
  const {savedSearchIndex, handleClose} = useSaveSearchIndexOnClose({
    childContainerRef,
    onClose,
    saveOnClose: hasValidTerms,
  })

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
