import {SortIcon} from '@sanity/icons'
import {Box, Menu, MenuDivider, Text} from '@sanity/ui'
import {memo, useId} from 'react'
import {useGetI18nText, useTranslation} from 'sanity'

import {Button, MenuButton, MenuItem} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import {type PaneMenuItem} from '../../types'

/**
 * Identifier for the (virtual) "relevance" ordering. Relevance isn't one of the
 * pane's configured orderings — it's the score-based ranking applied while a
 * search term is present, so it gets its own reserved id.
 *
 * @internal
 */
export const RELEVANCE_ORDERING_ID = 'relevance'

/**
 * Stable id for a sort-order menu item, derived from its sort spec so it
 * survives re-renders without relying on the optional `id` field.
 *
 * @internal
 */
export function getSearchOrderingId(menuItem: PaneMenuItem): string {
  return menuItem.id ?? JSON.stringify(menuItem.params?.by ?? [])
}

/**
 * Whether a pane menu item represents a sort ordering.
 *
 * @internal
 */
export function isSortOrderingMenuItem(menuItem: PaneMenuItem): boolean {
  return menuItem.action === 'setSortOrder' && Array.isArray(menuItem.params?.by)
}

interface OrderingMenuItemProps {
  menuItem: PaneMenuItem
  selected: boolean
  onSelect: (id: string) => void
}

/**
 * A single ordering option. Rendered as its own component so it can resolve its
 * localized title via `useGetI18nText` (each item may carry its own i18n
 * record).
 */
function OrderingMenuItem({menuItem, selected, onSelect}: OrderingMenuItemProps) {
  const getI18nText = useGetI18nText(menuItem)
  const {title} = getI18nText(menuItem)

  return (
    <MenuItem
      onClick={() => onSelect(getSearchOrderingId(menuItem))}
      pressed={selected}
      text={title}
    />
  )
}

interface DocumentListPaneSearchOrderingProps {
  orderings: PaneMenuItem[]
  value: string
  onChange: (id: string) => void
}

/**
 * Sort-order control shown beneath the document list search input while a
 * search term is present. Defaults to relevance ranking, and lets the editor
 * temporarily apply one of the list's configured orderings instead.
 */
export const DocumentListPaneSearchOrdering = memo(function DocumentListPaneSearchOrdering(
  props: DocumentListPaneSearchOrderingProps,
) {
  const {orderings, value, onChange} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const menuButtonId = useId()

  const relevanceTitle = t('panes.document-list-pane.search-ordering.relevance')

  const selectedOrdering =
    value === RELEVANCE_ORDERING_ID
      ? undefined
      : orderings.find((ordering) => getSearchOrderingId(ordering) === value)

  // Resolve the active ordering's localized title for the button label. The
  // relevance case uses its own complete string rather than interpolating a
  // case-transformed title, which is unreliable across locales.
  const getI18nText = useGetI18nText(selectedOrdering)
  const buttonText = selectedOrdering
    ? t('panes.document-list-pane.search-ordering.label', {
        order: getI18nText(selectedOrdering).title,
      })
    : t('panes.document-list-pane.search-ordering.summary-relevance')

  // With no configured orderings there's nothing to choose between, so render a
  // plain, non-interactive label instead of an empty menu.
  if (orderings.length === 0) {
    return (
      <Box paddingX={2} paddingBottom={1}>
        <Text muted size={1} data-testid="document-list-search-ordering">
          {buttonText}
        </Text>
      </Box>
    )
  }

  return (
    <Box paddingBottom={1}>
      <MenuButton
        button={
          <Button
            data-testid="document-list-search-ordering"
            icon={SortIcon}
            mode="bleed"
            text={buttonText}
            tone="default"
            aria-label={t('panes.document-list-pane.search-ordering.aria-label')}
          />
        }
        id={menuButtonId}
        menu={
          <Menu>
            <MenuItem
              onClick={() => onChange(RELEVANCE_ORDERING_ID)}
              pressed={value === RELEVANCE_ORDERING_ID}
              text={relevanceTitle}
            />
            <MenuDivider />
            {orderings.map((ordering) => {
              const id = getSearchOrderingId(ordering)
              return (
                <OrderingMenuItem
                  key={id}
                  menuItem={ordering}
                  onSelect={onChange}
                  selected={value === id}
                />
              )
            })}
          </Menu>
        }
        popover={{placement: 'bottom-start', portal: true, radius: 2}}
      />
    </Box>
  )
})
