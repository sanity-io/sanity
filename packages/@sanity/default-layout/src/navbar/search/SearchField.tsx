import {Portal} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {POPOVER_INPUT_PADDING, POPOVER_MAX_WIDTH} from './constants'
import {useMeasureSearchResultsIndex} from './hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

export function SearchField() {
  const [placeholderElement, setPlaceholderElement] = useState<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number
    y: number
  }>(null)

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
   * Update popover position on window resize based off current placeholder input
   */
  const handleWindowResize = useCallback(() => {
    setPopoverPosition(calcDialogPosition(placeholderElement))
  }, [placeholderElement])

  /**
   * Bind hotkeys to open / close actions
   */
  useSearchHotkeys({
    onClose: handleClose,
    onOpen: handleOpen,
    open,
  })

  useEffect(() => {
    setPopoverPosition(calcDialogPosition(placeholderElement))
  }, [placeholderElement])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return (
    <>
      <PlaceholderSearchInput onOpen={handleOpen} ref={setPlaceholderElement} />
      {open && (
        <Portal>
          <FocusLock autoFocus={false} returnFocus>
            <SearchPopover
              initialSearchIndex={savedSearchIndex}
              onClose={handleClose}
              position={popoverPosition}
            />
          </FocusLock>
        </Portal>
      )}
    </>
  )
}

function calcDialogPosition(
  element: HTMLElement
): {
  x: number | null
  y: number
} {
  if (!element) {
    return null
  }

  const placeholderRect = element.getBoundingClientRect()

  // Offset positioning to account for dialog padding. This should ensure that our popover search input
  // sits directly over the top of the existing placeholder input.
  return {
    x:
      window.innerWidth - placeholderRect.x > POPOVER_MAX_WIDTH
        ? placeholderRect.x - POPOVER_INPUT_PADDING
        : null,
    y: placeholderRect.y - POPOVER_INPUT_PADDING,
  }
}
