import {type Placement, Text, useClickOutsideEvent} from '@sanity/ui'
import {
  cloneElement,
  type DOMAttributes,
  type JSX,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react'
import {Box} from 'ui5'

import {Popover} from '../popover/Popover'
import {TOOLTIP_DELAY_PROPS} from './constants'

/**
 * How long the tooltip stays open after the pointer leaves the trigger or the tooltip, so the
 * pointer can cross the gap between them.
 */
const CLOSE_DELAY = 200

/**
 * What the pointer or focus last asked for. The timer that acts on it lives in an effect, so a
 * new intent cancels the pending one.
 */
type Intent = 'open' | 'openNow' | 'close' | 'hold'

type TriggerHandlers = Pick<
  DOMAttributes<HTMLElement>,
  'onBlur' | 'onFocus' | 'onMouseEnter' | 'onMouseLeave'
> & {'aria-describedby'?: string}

interface InteractiveTooltipProps {
  children: JSX.Element
  content: ReactNode
  disabled?: boolean
  fallbackPlacements?: Placement[]
  placement?: Placement
  portal?: boolean | string
}

function hasSelectionInside(element: HTMLElement | null): boolean {
  const selection = window.getSelection()
  if (!element || !selection || selection.isCollapsed || selection.rangeCount === 0) return false
  return element.contains(selection.getRangeAt(0).commonAncestorContainer)
}

/**
 * A tooltip whose content the pointer can move onto, select and copy (WCAG 2.1, 1.4.13 "Content
 * on Hover or Focus"). `@sanity/ui` v4's tooltip ignores pointer events and closes as soon as the
 * pointer leaves its trigger, so this one is built on a popover instead.
 *
 * Opens on hover (after the regular tooltip delay) and on focus, stays open while the pointer is
 * over the trigger or the tooltip, and closes on Escape. While text inside it is selected it stays
 * open until the user clicks elsewhere, so the selection can be copied.
 *
 * @internal
 */
export function InteractiveTooltip(props: InteractiveTooltipProps) {
  const {children, content, disabled, fallbackPlacements, placement = 'bottom', portal} = props
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [intent, setIntent] = useState<Intent>('hold')
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (intent === 'hold') return undefined

    const delay =
      intent === 'open' ? TOOLTIP_DELAY_PROPS.open : intent === 'openNow' ? 0 : CLOSE_DELAY
    const timeout = setTimeout(() => {
      if (intent !== 'close') {
        setOpen(true)
      } else if (hasSelectionInside(contentElement)) {
        setPinned(true)
      } else {
        setOpen(false)
      }
    }, delay)

    return () => clearTimeout(timeout)
  }, [contentElement, intent])

  const close = useCallback(() => {
    if (hasSelectionInside(contentElement)) window.getSelection()?.removeAllRanges()
    setIntent('hold')
    setPinned(false)
    setOpen(false)
  }, [contentElement])

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, open])

  useClickOutsideEvent(pinned ? close : undefined, () => [contentElement, triggerElement])

  const leaveIntent: Intent = pinned ? 'hold' : 'close'
  const childProps: TriggerHandlers = children.props

  const trigger = cloneElement<TriggerHandlers & RefAttributes<HTMLElement>>(children, {
    'aria-describedby': disabled ? undefined : id,
    'ref': setTriggerElement,
    'onMouseEnter': (event) => {
      if (!disabled) setIntent(open ? 'openNow' : 'open')
      childProps.onMouseEnter?.(event)
    },
    'onMouseLeave': (event) => {
      setIntent(leaveIntent)
      childProps.onMouseLeave?.(event)
    },
    'onFocus': (event) => {
      if (!disabled) setIntent('openNow')
      childProps.onFocus?.(event)
    },
    'onBlur': (event) => {
      setIntent(leaveIntent)
      childProps.onBlur?.(event)
    },
  })

  return (
    <Popover
      content={
        <Box
          id={id}
          onMouseEnter={() => setIntent('hold')}
          onMouseLeave={() => setIntent(leaveIntent)}
          ref={setContentElement}
          role="tooltip"
        >
          {typeof content === 'string' ? (
            <Box padding={1}>
              <Text size={1}>{content}</Text>
            </Box>
          ) : (
            content
          )}
        </Box>
      }
      fallbackPlacements={fallbackPlacements}
      open={open && !disabled}
      padding={typeof content === 'string' ? 1 : 2}
      placement={placement}
      portal={portal ?? true}
      radius={2}
      shadow={2}
    >
      {trigger}
    </Popover>
  )
}
