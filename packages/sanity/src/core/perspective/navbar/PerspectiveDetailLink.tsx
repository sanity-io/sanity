import {ArrowTopRightIcon} from '@sanity/icons/ArrowTopRight'
import {useTheme_v2} from '@sanity/ui'
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {type IntentParameters, useIntentLink} from 'sanity/router'
import {Box, Flex, IconButton, type PaddingProps} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {detailLink, detailLinkContainer, detailLinkSpace} from './PerspectiveDetailLink.css'

/**
 * The arrow is the icon for opening content in another view; tertiary is the quiet level for a
 * secondary action in a row. `detailLinkSpace` reserves this button's width.
 */
const LINK_BUTTON_PROPS = {density: 'regular', icon: ArrowTopRightIcon, level: 'tertiary'} as const

/**
 * Wires a perspective menu item to the detail link next to it.
 *
 * The link is not a menu item, so the menu's arrow keys keep moving between menu items only. The
 * right arrow key moves focus from the item to its link and the left arrow key back; the other
 * keys still reach the menu, which moves on from the item, because focusing the link leaves it
 * as the menu's active item.
 *
 * `selected` is whether the row's perspective is the selected one.
 *
 * The link shows on one row at a time, the active row: the row the menu treats as active, which
 * is the one under the pointer or with keyboard focus (the menu marks its item `data-selected`),
 * or the row whose link the pointer is over, because the link lies outside the item and
 * hovering it ends the item's own hover. The menu moves its active item with the pointer and the
 * arrow keys, so the link needs no hover or focus state of its own.
 */
export function usePerspectiveDetailLink({selected}: {selected: boolean}) {
  const menuItemRef = useRef<HTMLButtonElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [linkHovered, setLinkHovered] = useState(false)
  const [itemActive, setItemActive] = useState(false)

  useEffect(() => {
    const item = menuItemRef.current
    if (!item) return undefined
    const readActive = () => setItemActive(item.hasAttribute('data-selected'))
    readActive()
    const observer = new MutationObserver(readActive)
    observer.observe(item, {attributeFilter: ['data-selected'], attributes: true})
    return () => observer.disconnect()
  }, [])

  const active = itemActive || linkHovered

  // A link the row's end shows is the one that may hold focus. When the menu moves on to another
  // row, focus leaves the link, which also closes its tooltip.
  useEffect(() => {
    if (!active && linkRef.current && linkRef.current === document.activeElement) {
      linkRef.current.blur()
    }
  }, [active])

  const handleMenuItemKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' || !linkRef.current) return
    event.preventDefault()
    linkRef.current.focus()
  }, [])

  const handleLinkKeyDown = useCallback((event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      menuItemRef.current?.focus()
    } else if (event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }, [])

  const handleLinkMouseEnter = useCallback(() => setLinkHovered(true), [])
  const handleLinkMouseLeave = useCallback(() => setLinkHovered(false), [])

  return {
    menuItemProps: {
      // The link lies over the item but outside it, so hovering the link ends the item's own
      // hover; `data-hovered` keeps the row highlighted. A selected row stays as it is: the
      // hover style would replace its selected fill.
      'data-hovered': linkHovered && !selected ? '' : undefined,
      'onKeyDown': handleMenuItemKeyDown,
      'ref': menuItemRef,
    },
    linkProps: {
      active,
      onKeyDown: handleLinkKeyDown,
      onMouseEnter: handleLinkMouseEnter,
      onMouseLeave: handleLinkMouseLeave,
      ref: linkRef,
    },
  }
}

/**
 * A menu closes when one of its items is clicked, but a detail link is not a menu item. Focusing
 * the menu's trigger closes it: the menu closes when focus leaves it, which is also how it handles
 * Tab, and focus ends up where a menu item click leaves it.
 */
export function usePerspectiveDetailLinkTrigger() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const handleNavigate = useCallback(() => {
    triggerRef.current?.focus()
  }, [])

  return {triggerRef, handleNavigate}
}

/**
 * Opens a perspective's detail page (a release, a variant) from its row in a perspective menu.
 *
 * Rendered next to the row's menu item rather than inside it: the menu item is a `<button>`, and
 * interactive content inside a button is invalid HTML that assistive technology never exposes.
 * The row renders `data-detail-link-row` and positions the link, and the menu item lays out its
 * content with `renderWithDetailLinkSpace`, which reserves the link's space.
 */
export function PerspectiveDetailLink(
  props: {
    /** Whether the row is the active one: the link shows and its tooltip can open only then. */
    'active': boolean
    'aria-label': string
    'data-testid': string
    'intent': string
    'params': IntentParameters
    'tooltip': string
    'onKeyDown': (event: KeyboardEvent<HTMLAnchorElement>) => void
    'onMouseEnter': () => void
    'onMouseLeave': () => void
    'onNavigate'?: () => void
    /** Positions the link's box within the row, as the padding does. */
    'style'?: CSSProperties
  } & PaddingProps &
    RefAttributes<HTMLAnchorElement>,
) {
  const {
    active,
    'aria-label': ariaLabel,
    'data-testid': testId,
    intent,
    params,
    tooltip,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    onNavigate,
    ref,
    style,
    ...paddingProps
  } = props
  const {href, onClick} = useIntentLink({intent, params, onClick: onNavigate})
  const {color} = useTheme_v2()
  // The link sits beside the menu item, not in it, so it does not inherit the colour the item
  // takes when the menu marks it selected (the active item, under the pointer or keyboard focus).
  // The link's styles read the same theme value from this variable while the item is selected.
  const linkStyle = {
    '--detail-link-selected-fg': color.selectable.default.selected.fg,
  } as CSSProperties

  return (
    // Centred on the row, like the menu item's own right icon
    <Flex
      alignItems="center"
      className={detailLinkContainer}
      data-active={active ? '' : undefined}
      style={style}
      {...paddingProps}
    >
      <Tooltip disabled={!active} portal content={tooltip} placement="bottom">
        <IconButton
          {...LINK_BUTTON_PROPS}
          aria-label={ariaLabel}
          as="a"
          className={detailLink}
          data-testid={testId}
          href={href}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          ref={ref}
          // The link sits in a `role="menu"`, whose children must be menu items; the menu's own
          // arrow-key handling still skips it, since it is not one of the menu's registered items
          role="menuitem"
          style={linkStyle}
          // Menu items leave the tab order to the menu; the right arrow key reaches the link
          tabIndex={-1}
        />
      </Tooltip>
    </Flex>
  )
}

/**
 * Lays out a menu item's content with the detail link's width reserved at its end. The space is an
 * empty box: the menu item is a `<button>`, so it cannot hold a second button to measure against.
 * Matches the studio `MenuItem`'s `renderMenuItem`.
 *
 * The gap is the 12px the menu item leaves before its own right-side content (`marginLeft={3}`).
 * A right icon bleeds 6px into it, which leaves room between a row's right icon and the link,
 * including the link's hover fill.
 */
export function renderWithDetailLinkSpace(menuItemContent: ReactNode) {
  return (
    <Flex gap={3}>
      <Box flexBasis="0%" flexGrow={1} minWidth="0">
        {menuItemContent}
      </Box>
      <Box className={detailLinkSpace} data-testid="perspective-detail-link-space" flexShrink={0} />
    </Flex>
  )
}
