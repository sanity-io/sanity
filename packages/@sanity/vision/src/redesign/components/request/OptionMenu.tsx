import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {SearchIcon} from '@sanity/icons/Search'
import {Button, type ButtonProps, Card, Label, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {Box, Flex, Text, VStack} from 'ui5'

import {cx} from '../../util/cx'
import * as redesignStyles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'
import * as styles from './OptionMenu.module.css'

/** Fits the menu to its labels, between a minimum and a maximum, and scrolls the rest */
const MENU_STYLE = {
  width: 'max-content',
  minWidth: 'min(240px, calc(100vw - 24px))',
  maxWidth: 'min(360px, calc(100vw - 24px))',
  overflow: 'auto',
} as const

/**
 * The size and tone of an Options picker's trigger, which the tool's other dropdowns (the result
 * panel's view menus) share so every dropdown in Vision looks alike
 */
export const OPTION_TRIGGER_PROPS = {
  fontSize: 1,
  iconRight: ChevronDownIcon,
  mode: 'ghost',
  padding: 2,
} as const satisfies ButtonProps

/** The keys `@sanity/ui`'s menu answers with a focus move, also when they are pressed in the search */
const MENU_FOCUS_KEYS = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'Tab'])

interface OptionMenuButtonProps {
  /** Id of the trigger, which the field's label points at */
  id: string
  /** Prefix of the trigger (`-select`), menu (`-menu`) and search (`-search`) test ids */
  testId: string
  /** What the trigger shows */
  text: string
  /** The option the trigger stands for, exposed as its `value` like a select's */
  value: string
  /** The menu's items, between the search field (when there is one) and the menu's end */
  children: ReactNode
  /** Placeholder of the search field at the top of the menu; without one, there is no search */
  searchPlaceholder?: string
  searchQuery?: string
  onSearchQueryChange?: (query: string) => void
  /**
   * Called as the menu opens, in the same render: the place to reset the search. The menu
   * stays mounted while closed and fades out when it closes, so a reset then would re-filter the
   * items in view.
   */
  onOpen?: () => void
  /**
   * An element of the menu the menu opens no taller than: it ends where this element ends, or
   * at the edge of the viewport, and scrolls the items after it
   */
  foldRef?: RefObject<HTMLElement | null>
}

/**
 * The trigger and menu shared by the Options pickers (dataset, perspective, variants), laid out
 * like the navbar's perspective menu: a search field pinned at the top that takes focus when
 * the menu opens, then sections of items that size the menu between a minimum and a maximum
 * width. Every trigger has the same size and tone, so the pickers line up on the grid.
 */
export function OptionMenuButton({
  id,
  testId,
  text,
  value,
  children,
  searchPlaceholder,
  searchQuery = '',
  onSearchQueryChange,
  onOpen,
  foldRef,
}: OptionMenuButtonProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [foldHeight, setFoldHeight] = useState<number | undefined>(undefined)
  const hasSearch = searchPlaceholder !== undefined

  // The search field takes focus before the opened menu is painted, so focus never shows
  // anywhere else first, and keeps it until the user moves it. `@sanity/ui`'s menu focuses its
  // selected item (or, after a keyboard open, its first) on its own a frame after a re-render
  // that follows the opening, at no fixed delay the field could wait out: until the first key
  // or pointer input in the menu, a focus move onto an item is that one, and the field takes
  // focus back.
  useLayoutEffect(() => {
    if (open) searchRef.current?.focus({preventScroll: true})
  }, [open])
  const focusMovedByUserRef = useRef(false)
  const handleMenuFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const search = searchRef.current
      if (!hasSearch || !search || focusMovedByUserRef.current || event.target === search) return
      search.focus({preventScroll: true})
    },
    [hasSearch],
  )
  const handleMenuPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== searchRef.current) focusMovedByUserRef.current = true
  }, [])
  const handleMenuKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    // Typing in the search moves no focus; only the keys the menu turns into a focus move do
    if (event.target !== searchRef.current || MENU_FOCUS_KEYS.has(event.key)) {
      focusMovedByUserRef.current = true
    }
  }, [])

  // Measured once per opening, before the menu is painted, so it never shows at another height
  // first; it keeps the height while the search filters the items, and through the fade-out,
  // until the next opening measures again. The fold's offset in the menu does not depend on
  // where the popover has put the menu, or on how tall the viewport lets it be.
  useLayoutEffect(() => {
    if (!open || !foldRef) return
    const menu = menuRef.current
    const fold = foldRef.current
    if (!menu || !fold || menu.offsetHeight === 0) return
    // The popover scales in, so the rectangles are scaled back to layout pixels
    const menuRect = menu.getBoundingClientRect()
    const scale = menuRect.height / menu.offsetHeight || 1
    const bottom = (fold.getBoundingClientRect().bottom - menuRect.top) / scale
    setFoldHeight(Math.ceil(bottom + menu.scrollTop))
  }, [open, foldRef])

  const handleOpen = useCallback(() => {
    focusMovedByUserRef.current = false
    setOpen(true)
    onOpen?.()
  }, [onOpen])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <MenuButton
      button={
        <Button
          {...OPTION_TRIGGER_PROPS}
          className={styles.trigger}
          data-testid={`${testId}-select`}
          justify="space-between"
          text={text}
          textAlign="left"
          value={value}
        />
      }
      id={id}
      menu={
        <Menu
          className={cx(redesignStyles.popoverScroll, themeStyles.themeTokens)}
          data-testid={`${testId}-menu`}
          gap={0}
          onFocus={handleMenuFocus}
          onKeyDownCapture={handleMenuKeyDown}
          onPointerDownCapture={handleMenuPointer}
          onPointerMoveCapture={handleMenuPointer}
          padding={0}
          ref={menuRef}
          // Width is inline so it wins over the menu's own `min-width: 0`. Display stays the
          // component's: a stylesheet `display` ties `@sanity/ui`'s `:not([hidden])` rule and
          // loses in a production build.
          style={foldHeight === undefined ? MENU_STYLE : {...MENU_STYLE, maxHeight: foldHeight}}
        >
          {hasSearch && (
            <Box borderBottom flexShrink={0} padding={2}>
              <TextInput
                data-testid={`${testId}-search`}
                fontSize={1}
                icon={SearchIcon}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onSearchQueryChange?.(event.currentTarget.value)
                }
                placeholder={searchPlaceholder}
                radius={2}
                ref={searchRef}
                value={searchQuery}
              />
            </Box>
          )}
          <Flex flexDirection="column">{children}</Flex>
        </Menu>
      }
      onClose={handleClose}
      onOpen={handleOpen}
      popover={{
        animate: true,
        constrainSize: true,
        fallbackPlacements: ['top-start'],
        placement: 'bottom-start',
        portal: true,
        tone: 'default',
      }}
    />
  )
}

/** A group heading, as the navbar perspective menu labels its release types */
export function OptionMenuGroupLabel({children}: {children: string}) {
  return (
    <Box paddingBottom={1} paddingLeft={2} paddingTop={2}>
      <Label muted size={0} style={{textTransform: 'uppercase'}}>
        {children}
      </Label>
    </Box>
  )
}

/** A group of items, under a heading like the navbar menu's release types, or none */
export function OptionMenuSection({
  title,
  testId,
  children,
  ref,
}: {
  title?: string
  testId?: string
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <Card borderBottom className={styles.section} data-testid={testId} padding={1} ref={ref}>
      <VStack gap={0}>
        {title && <OptionMenuGroupLabel>{title}</OptionMenuGroupLabel>}
        {children}
      </VStack>
    </Card>
  )
}

export interface OptionItemContentProps {
  title: string
  /** A muted line under the title, cut to one line with the whole of it on hover */
  subtitle?: string
  /** Shown before the title, like the perspective dots of the navbar menu */
  icon?: ReactNode
}

/**
 * What an Options picker's item shows, spaced like the navbar perspective menu's items. The
 * colours follow the card, so they stay readable on the hovered and selected backgrounds.
 */
export function OptionItemContent({title, subtitle, icon}: OptionItemContentProps) {
  return (
    <Flex alignItems="flex-start" gap={1}>
      {icon && (
        <Box flexShrink={0} paddingX={2} paddingY={1}>
          {icon}
        </Box>
      )}
      <Flex
        flexDirection="column"
        flexGrow={1}
        gap={2}
        minWidth="0"
        paddingLeft={icon ? 0 : 2}
        paddingRight={2}
        paddingY={1}
      >
        <Text
          as="div"
          size={1}
          style={{color: 'var(--card-fg-color)'}}
          trim={true}
          truncate={1}
          weight="medium"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            as="div"
            size={0}
            style={{color: 'var(--card-muted-fg-color)'}}
            title={subtitle}
            trim={true}
            truncate={1}
          >
            {subtitle}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

interface OptionMenuItemProps extends OptionItemContentProps {
  testId: string
  selected: boolean
  onClick: () => void
}

/** A radio item of an Options picker's menu */
export function OptionMenuItem({
  testId,
  title,
  subtitle,
  icon,
  selected,
  onClick,
}: OptionMenuItemProps) {
  return (
    <MenuItem
      aria-checked={selected}
      data-testid={testId}
      onClick={onClick}
      padding={1}
      pressed={selected}
      role="menuitemradio"
      selected={selected}
    >
      <OptionItemContent icon={icon} subtitle={subtitle} title={title} />
    </MenuItem>
  )
}

/** Shown in place of the items when the search matches none */
export function OptionMenuNoMatches({children}: {children: string}) {
  return (
    <Box padding={2}>
      <Text muted size={1}>
        {children}
      </Text>
    </Box>
  )
}
