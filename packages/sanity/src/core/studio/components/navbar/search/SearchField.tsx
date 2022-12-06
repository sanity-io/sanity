import React, {useCallback, useEffect, useState} from 'react'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {PopoverPosition, SearchPopover} from './components/SearchPopover'
import {POPOVER_INPUT_PADDING, POPOVER_MAX_WIDTH} from './constants'

/**
 * @internal
 */
export function SearchField() {
  const [placeholderElement, setPlaceholderElement] = useState<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  const popoverPosition = usePopoverPosition(placeholderElement)

  return (
    <>
      <PlaceholderSearchInput onOpen={handleOpen} ref={setPlaceholderElement} />
      {popoverPosition && (
        <SearchPopover
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
          position={popoverPosition}
        />
      )}
    </>
  )
}

function calcDialogPosition(element: HTMLElement): PopoverPosition {
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

function usePopoverPosition(element: HTMLElement | null) {
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null)

  /**
   * Update popover position on window resize based off current placeholder input
   */
  const handleWindowResize = useCallback(() => {
    if (element) {
      setPopoverPosition(calcDialogPosition(element))
    }
  }, [element])

  useEffect(() => {
    if (element) {
      setPopoverPosition(calcDialogPosition(element))
    }
  }, [element])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return popoverPosition
}
