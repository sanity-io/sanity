import React, {useCallback, useEffect, useState} from 'react'
import {PlaceholderSearchInput} from './components/PlaceholderSearchInput'
import {SearchPopover} from './components/SearchPopover'
import {POPOVER_INPUT_PADDING, POPOVER_MAX_WIDTH} from './constants'

export function SearchField() {
  const [placeholderElement, setPlaceholderElement] = useState<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number
    y: number
  }>(null)

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  /**
   * Update popover position on window resize based off current placeholder input
   */
  const handleWindowResize = useCallback(() => {
    setPopoverPosition(calcDialogPosition(placeholderElement))
  }, [placeholderElement])

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
      <SearchPopover
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        position={popoverPosition}
      />
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
