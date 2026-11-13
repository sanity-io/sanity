import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Label, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ChangeEvent, type ReactElement, type ReactNode, useCallback, useId} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {MenuButton} from '../../../../../../../ui-components/menuButton/MenuButton'
import {Tooltip} from '../../../../../../../ui-components/tooltip/Tooltip'
import {documentNavigationMenu} from './DocumentNavigationMenu.css'

/** @internal */
export interface DocumentNavigationMenuSection {
  /** Test id suffix: the section renders as `<testId>-section-<key>`. */
  key: string
  label: string
  items: ReactNode[]
  /** Shown while nothing is being filtered even when it has no items, e.g. "Has 0 variants". */
  alwaysShow?: boolean
  /** Explains the section, behind an info icon beside the label. */
  tooltip?: string
}

/** @internal */
export interface DocumentNavigationMenuProps {
  /** Test id of the menu; sections, the empty filter result and the tooltip derive from it. */
  testId: string
  /** The trigger, usually a `DropdownButton`. */
  button: ReactElement
  filterPlaceholder: string
  filterQuery: string
  /** Called with every edit of the filter, and with `''` when the menu closes. */
  onFilterChange: (query: string) => void
  /** Items above the sections, outside any of them. */
  leadingItems?: ReactNode
  sections: DocumentNavigationMenuSection[]
}

function MenuSection(props: {
  children?: ReactNode
  label: string
  testId: string
  tooltip?: string
}) {
  const {children, label, testId, tooltip} = props
  return (
    <Flex borderTop data-testid={testId} flexDirection="column" gap={1} paddingTop={1}>
      <Flex alignItems="center" gap={2} paddingX={3} paddingTop={3} paddingBottom={2}>
        <Label muted size={1} style={{textTransform: 'uppercase'}}>
          {label}
        </Label>
        {tooltip ? (
          <Tooltip content={tooltip} placement="top" portal>
            <span aria-label={tooltip} data-testid={`${testId}-tooltip`} role="img">
              <Text muted size={1}>
                <InfoOutlineIcon />
              </Text>
            </span>
          </Tooltip>
        ) : null}
      </Flex>
      {children}
    </Flex>
  )
}

/**
 * The menu of the document panel navigation pickers: a filter, optional leading items and
 * sections of items with a header each. Filtering is the caller's: it passes the items that match
 * `filterQuery`. A section with no items is hidden while filtering, and when nothing is left the
 * menu says so.
 *
 * @internal
 */
export function DocumentNavigationMenu(props: DocumentNavigationMenuProps) {
  const {button, filterPlaceholder, filterQuery, leadingItems, onFilterChange, sections, testId} =
    props
  const {t} = useTranslation()
  const menuId = useId()

  const isFiltering = filterQuery.trim().length > 0
  const visibleSections = sections.filter(
    (section) => section.items.length > 0 || (section.alwaysShow && !isFiltering),
  )
  const hasMatches = Boolean(leadingItems) || visibleSections.length > 0

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onFilterChange(event.currentTarget.value),
    [onFilterChange],
  )
  const handleClose = useCallback(() => onFilterChange(''), [onFilterChange])

  return (
    <MenuButton
      button={button}
      id={menuId}
      onClose={handleClose}
      menu={
        <Menu className={documentNavigationMenu} data-testid={testId} padding={1}>
          <Box flexShrink={0} padding={1}>
            <TextInput
              aria-label={filterPlaceholder}
              fontSize={1}
              onChange={handleFilterChange}
              placeholder={filterPlaceholder}
              radius={2}
              value={filterQuery}
            />
          </Box>
          {hasMatches ? (
            <Flex
              flexDirection="column"
              flexGrow={1}
              flexShrink={1}
              minHeight="0"
              overflowY="auto"
              paddingX={1}
              paddingBottom={1}
            >
              {/* Menu items are flex children with min-height: 0, so they collapse when they sit
              directly in this scroller. Keep them in a column that sizes to its content. */}
              <Flex flexDirection="column" flexShrink={0} gap={1}>
                {leadingItems}
                {visibleSections.map((section) => (
                  <MenuSection
                    key={section.key}
                    label={section.label}
                    testId={`${testId}-section-${section.key}`}
                    tooltip={section.tooltip}
                  >
                    {section.items}
                  </MenuSection>
                ))}
              </Flex>
            </Flex>
          ) : (
            <Box data-testid={`${testId}-no-matches`} paddingX={4} paddingBottom={3}>
              <Text muted size={1}>
                {t('navbar.filter.no-matches', {filter: filterQuery.trim()})}
              </Text>
            </Box>
          )}
        </Menu>
      }
      popover={{
        constrainSize: true,
        fallbackPlacements: ['bottom-end'],
        overflow: 'hidden',
        placement: 'bottom-start',
        portal: true,
        tone: 'default',
        zOffset: 3000,
      }}
    />
  )
}
