import {Portal, useGlobalKeyDown} from '@sanity/ui'
import React, {MutableRefObject, useCallback, useRef, useState} from 'react'
import {PlaceholderSearchInput} from './PlaceholderSearchInput'
import {Dialog} from './Dialog'
import {OmnisearchProvider} from './state/OmnisearchContext'
import {isEscape, isSearchHotKey} from './utils/search-hotkeys'
import {SearchController} from './SearchController'

interface OmnisearchFieldProps {
  // eslint-disable-next-line react/no-unused-prop-types
  portalElement?: HTMLDivElement | null
}

export function Omnisearch(props: OmnisearchFieldProps) {
  const placeholderInputEl = useRef<HTMLInputElement>()
  const [open, setOpened, setClosed] = useOpen()

  useSearchHotkeyListener(placeholderInputEl, open, setOpened, setClosed)

  return (
    <OmnisearchProvider onClose={setClosed}>
      <PlaceholderSearchInput ref={placeholderInputEl} setOpened={setOpened} />

      {open && (
        <Portal>
          <Dialog onClose={setClosed} placeholderRef={placeholderInputEl} />
        </Portal>
      )}

      <SearchController />
    </OmnisearchProvider>
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
        setOpened()
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

function useOpen() {
  const [open, setOpen] = useState(false)
  const setOpened = useCallback(() => setOpen(true), [setOpen])
  const setClosed = useCallback(() => setOpen(false), [setOpen])
  return [open, setOpened, setClosed] as [typeof open, typeof setOpened, typeof setClosed]
}
