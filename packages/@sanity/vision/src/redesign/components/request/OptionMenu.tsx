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
        <Menu className={styles.menu} data-testid={`${testId}-menu`} padding={0}>
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
          <Flex className={styles.list} flexDirection="column">
            {children}
          </Flex>
        </Menu>
      }
      onClose={handleClose}
      onOpen={() => setOpen(true)}
      popover={{
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

/** A group of items, under a heading like the navbar menu's release types, or none */
export function OptionMenuSection({title, children}: {title?: string; children: ReactNode}) {
  return (
    <Card borderBottom className={styles.section} padding={1}>
      <VStack gap={1}>
        {title && (
          <Box paddingBottom={1} paddingLeft={2} paddingTop={3}>
            <Label muted size={1} style={{textTransform: 'uppercase'}}>
              {title}
            </Label>
          </Box>
        )}
        {children}
      </VStack>
    </Card>
  )
}

interface OptionMenuItemProps {
  testId: string
  title: string
  subtitle?: string
  /** Shown before the title, like the perspective dots of the navbar menu */
  icon?: ReactNode
  selected: boolean
  onClick: () => void
}

/** An item laid out like the navbar perspective menu's: icon, title, and a muted line under it */
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
      <Flex alignItems="flex-start" gap={1}>
        <Box className={styles.icon} flexShrink={0} paddingX={3} paddingY={2}>
          {icon}
        </Box>
        <Flex
          flexDirection="column"
          flexGrow={1}
          gap={2}
          minWidth="0"
          paddingRight={2}
          paddingY={2}
        >
          <Text size={1} weight="medium" style={{color: 'var(--card-fg-color)'}}>
            {title}
          </Text>
          {subtitle && (
            <Text
              className={styles.subtitle}
              size={1}
              style={{color: 'var(--card-muted-fg-color)'}}
            >
              {subtitle}
            </Text>
          )}
        </Flex>
      </Flex>
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
