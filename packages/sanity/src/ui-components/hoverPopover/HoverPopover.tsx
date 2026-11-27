import {useGlobalKeyDown} from '@sanity/ui'
import {type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {Box} from 'ui5'

import {Popover, type PopoverProps} from '../popover/Popover'

/** For each group, closes the popover of the group that is open. */
const openPopoverByGroup = new Map<string, () => void>()

/** @internal */
export interface HoverPopoverProps extends Omit<
  PopoverProps,
  'children' | 'content' | 'open' | 'referenceElement'
> {
  /** The element that opens the popover while the pointer rests on it. */
  children: ReactElement
  /** Rendered while the popover is open. */
  content: ReactNode
  /** How long the pointer rests on the element before the popover opens, in milliseconds. */
  openDelay?: number
  /**
   * How long the popover stays open once the pointer left both the element and the popover, in
   * milliseconds: the time it has to move from one to the other.
   */
  closeDelay?: number
  /** Popovers of the same group close each other, so only one of them is open at a time. */
  group?: string
}

/**
 * A popover that opens while the pointer rests on its element, and stays open while the pointer is
 * on the element or on the popover, so its content can be scrolled and interacted with. Escape
 * closes it.
 *
 * @internal
 */
export function HoverPopover(props: HoverPopoverProps) {
  const {children, content, openDelay = 400, closeDelay = 200, group, ...popoverProps} = props
  const [open, setOpen] = useState(false)
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearPending = useCallback(() => {
    clearTimeout(pendingRef.current)
    pendingRef.current = undefined
  }, [])

  const close = useCallback(() => {
    clearPending()
    setOpen(false)
  }, [clearPending])

  const handlePointerEnter = useCallback(() => {
    clearPending()
    if (!open) pendingRef.current = setTimeout(() => setOpen(true), openDelay)
  }, [clearPending, open, openDelay])

  const handlePointerLeave = useCallback(() => {
    clearPending()
    pendingRef.current = setTimeout(close, closeDelay)
  }, [clearPending, close, closeDelay])

  const setTrigger = useCallback((trigger: HTMLSpanElement | null) => {
    setReferenceElement(
      trigger?.firstElementChild instanceof HTMLElement ? trigger.firstElementChild : null,
    )
  }, [])

  useEffect(() => clearPending, [clearPending])

  useEffect(() => {
    if (!open || !group) return undefined
    const closeOther = openPopoverByGroup.get(group)
    if (closeOther && closeOther !== close) closeOther()
    openPopoverByGroup.set(group, close)
    return () => {
      if (openPopoverByGroup.get(group) === close) openPopoverByGroup.delete(group)
    }
  }, [close, group, open])

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (open && event.key === 'Escape') close()
      },
      [close, open],
    ),
  )

  return (
    <>
      {/* Takes no box of its own: the element keeps its place in the layout. */}
      <span
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        ref={setTrigger}
        style={{display: 'contents'}}
      >
        {children}
      </span>
      <Popover
        {...popoverProps}
        open={open}
        referenceElement={referenceElement}
        content={
          open && (
            <Box
              data-ui="HoverPopoverContent"
              onMouseEnter={handlePointerEnter}
              onMouseLeave={handlePointerLeave}
            >
              {content}
            </Box>
          )
        }
      />
    </>
  )
}
