import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {SearchIcon} from '@sanity/icons/Search'
import {Button, Card, Label, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {
  type ChangeEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {Box, Flex, Text, VStack} from 'ui5'

import * as styles from './OptionMenu.module.css'

/** Fits the menu to its labels, between a minimum and a maximum, and scrolls the rest */
const MENU_STYLE = {
  width: 'max-content',
  minWidth: 'min(240px, calc(100vw - 24px))',
  maxWidth: 'min(360px, calc(100vw - 24px))',
  overflow: 'auto',
} as const

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
  onClose?: () => void
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
  onClose,
}: OptionMenuButtonProps) {
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const hasSearch = searchPlaceholder !== undefined

  useFocusOnOpen(open && hasSearch, searchRef)

  const handleClose = useCallback(() => {
    setOpen(false)
    onClose?.()
  }, [onClose])

  return (
    <MenuButton
      button={
        <Button
          className={styles.trigger}
          data-testid={`${testId}-select`}
          fontSize={1}
          iconRight={ChevronDownIcon}
          justify="space-between"
          mode="ghost"
          padding={2}
          text={text}
          textAlign="left"
          value={value}
        />
      }
      id={id}
      menu={
        <Menu
          data-testid={`${testId}-menu`}
          gap={0}
          padding={0}
          // Width is inline so it wins over the menu's own `min-width: 0`. Display stays the
          // component's: a stylesheet `display` ties `@sanity/ui`'s `:not([hidden])` rule and
          // loses in a production build.
          style={MENU_STYLE}
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
      onOpen={() => setOpen(true)}
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

/**
 * Focuses the search field once the menu has opened. The menu moves focus to its first item a
 * frame after a keyboard open, so the search field takes it back a frame later.
 */
function useFocusOnOpen(open: boolean, ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    if (!open) return undefined
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => ref.current?.focus())
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [open, ref])
}

/** A group heading, as the navbar perspective menu labels its release types */
export function OptionMenuGroupLabel({children}: {children: string}) {
  return (
    <Box paddingBottom={1} paddingLeft={2} paddingTop={3}>
      <Label muted size={1} style={{textTransform: 'uppercase'}}>
        {children}
      </Label>
    </Box>
  )
}

/** A group of items, under a heading like the navbar menu's release types, or none */
export function OptionMenuSection({title, children}: {title?: string; children: ReactNode}) {
  return (
    <Card borderBottom className={styles.section} padding={1}>
      <VStack gap={1}>
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
        <Box flexShrink={0} paddingX={3} paddingY={2}>
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
        paddingY={2}
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
            size={1}
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
    <Box padding={3}>
      <Text muted size={1}>
        {children}
      </Text>
    </Box>
  )
}
