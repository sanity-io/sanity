// MenuPopover, from the Storybook Variants 2.0 exploration (selector/primitives.tsx @ 2700f4cf07; that file is a
// copy of address-row/AddressMenus.tsx). Unchanged apart from imports.
import {type KeyboardEvent, type ReactNode, useEffect, useRef} from 'react'

import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'

/**
 * A Popover that closes on Escape and on a press outside both the panel and its anchor. Keyboard
 * focus moves through the search box and the rows with the arrow keys.
 */
export function MenuPopover(props: {
  anchor: HTMLElement | null
  open: boolean
  onDismiss: () => void
  width: number
  children: ReactNode
  testId: string
  placement?: 'bottom-start' | 'bottom-end'
}) {
  const {anchor, open, onDismiss, width, children, testId} = props
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return undefined
    const onPress = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || anchor?.contains(target)) return
      onDismiss()
    }
    // Escape closes the menu wherever focus is: the anchor holds it as often as the panel does.
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', onPress)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPress)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, anchor, onDismiss])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'input, [data-menu-row], [data-ui="MenuItem"]',
      ) ?? [],
    )
    if (!focusable.length) return
    event.preventDefault()
    const at = focusable.indexOf(event.target as HTMLElement)
    const next = event.key === 'ArrowDown' ? at + 1 : at - 1
    focusable[(next + focusable.length) % focusable.length]?.focus()
  }

  // Closed, the menu is not mounted: a hidden panel would keep its search box and rows in the page,
  // and the search box could not take focus each time the menu opens.
  if (!open || !anchor) return null

  return (
    <Popover
      content={
        <div data-testid={testId} onKeyDown={onKeyDown} ref={panelRef} style={{width}}>
          {children}
        </div>
      }
      fallbackPlacements={['bottom-end', 'bottom-start', 'top-start']}
      open
      padding={0}
      placement={props.placement ?? 'bottom-start'}
      radius={3}
      referenceElement={anchor}
      shadow={3}
    />
  )
}

