import {LegacyLayerProvider} from '@sanity/base/components'
import {Portal, useGlobalKeyDown} from '@sanity/ui'
import React, {MutableRefObject, useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {isEscape, isSearchHotKey} from './utils/search-hotkeys'

export function SearchField() {
  const placeholderInputEl = useRef<HTMLInputElement>()

  const [open, setOpen] = useState(false)
  const handleClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const handleOpen = useCallback(() => setOpen(true), [setOpen])

  useSearchHotkeyListener(placeholderInputEl, open, handleOpen, handleClose)

  return (
    <LegacyLayerProvider zOffset="navbarPopover">
      <PlaceholderSearchInput onOpen={handleOpen} ref={placeholderInputEl} />
      {open && (
        <Portal>
          <FocusLock>
            <SearchPopover onClose={handleClose} placeholderRef={placeholderInputEl} />
          </FocusLock>
        </Portal>
      )}
    </LegacyLayerProvider>
  )
}

function useSearchHotkeyListener(
  inputEl: MutableRefObject<HTMLInputElement>,
  open: boolean,
  setOpened: () => void,
  setClosed: () => void
) {
  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isSearchHotKey(event)) {
        event.preventDefault()
        if (open) {
          setClosed()
        } else {
          setOpened()
        }
      }
      if (isEscape(event) && open) {
        setClosed()
        inputEl.current?.focus()
      }
    },
    [inputEl, setOpened, setClosed, open]
  )

  useGlobalKeyDown(handleGlobalKeyDown)
}
