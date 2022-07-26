import {Portal} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

export function SearchField() {
  const placeholderInputRef = useRef<HTMLInputElement>()

  const [open, setOpen] = useState(false)
  const handleClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])
  const handleOpen = useCallback(() => setOpen(true), [setOpen])

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
            <SearchPopover onClose={handleClose} placeholderRef={placeholderInputRef} />
          </FocusLock>
        </Portal>
      )}
    </>
  )
}
