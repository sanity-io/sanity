import {FilterIcon, SortIcon} from '@sanity/icons'
import {Box, Flex, Label, Menu, MenuDivider} from '@sanity/ui'
import isEqual from 'lodash-es/isEqual.js'
import {memo, useId} from 'react'
import {useGetI18nText, useSchema, useTranslation} from 'sanity'

import {Button, MenuButton, MenuItem} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import {type PaneMenuItem} from '../../types'
import {getSearchOrderingId} from './DocumentListPaneSearchOrdering'
import {toStaticSortOrder} from './helpers'
import {type ListFieldFacet} from './listFacets'
import {type SortOrder} from './types'

/**
 * Status facet for the per-pane list filter. `edited` = the loaded document
 * is a draft version (has unpublished edits); `published` = no pending
 * edits in the current perspective.
 *
 * @internal
 */
export type ListStatusFilter = 'any' | 'edited' | 'published'

const MENU_POPOVER = {placement: 'bottom-start', portal: true, radius: 2} as const

function SortMenuItem(props: {
  menuItem: PaneMenuItem
  selected: boolean
  onSelect: (item: PaneMenuItem) => void
}) {
  const {menuItem, selected, onSelect} = props
  const getI18nText = useGetI18nText(menuItem)

  return (
    <MenuItem
      onClick={() => onSelect(menuItem)}
      pressed={selected}
      text={getI18nText(menuItem).title}
    />
  )
}

/**
 * The always-on control row under the document list search input: a
 * persistent sort selector (promoted out of the search-only branch) and a
 * structured filter (status facet + type facet when the list is mixed).
 *
 * The filter is applied client-side over the loaded set in this prototype;
 * the production path is injecting constraints into the list query.
 *
 * @internal
 */
export const DocumentListPaneControls = memo(function DocumentListPaneControls(props: {
  orderings: PaneMenuItem[]
  sortOrder?: SortOrder
  onSetSortOrder?: (sortOrder: SortOrder) => void
  /** Hidden while a search term is active (relevance ordering takes over). */
  showSort: boolean
  statusFilter: ListStatusFilter
  onStatusFilterChange: (status: ListStatusFilter) => void
  /** Distinct `_type`s among loaded items; the type facet shows when >1. */
  availableTypes: string[]
  typeFilter: string[]
  onTypeFilterChange: (types: string[]) => void
  /** Facets derived from the pane's schema type (tier-2 filtering). */
  fieldFacets: ListFieldFacet[]
  fieldFilters: Record<string, Array<string | boolean>>
  onFieldFiltersChange: (filters: Record<string, Array<string | boolean>>) => void
  /** Confidence prototype: risk tiers present among pending agent proposals. */
  availableTiers: string[]
  tierFilter: string[]
  onTierFilterChange: (tiers: string[]) => void
}) {
  const {
    orderings,
    sortOrder,
    onSetSortOrder,
    showSort,
    statusFilter,
    onStatusFilterChange,
    availableTypes,
    typeFilter,
    onTypeFilterChange,
    fieldFacets,
    fieldFilters,
    onFieldFiltersChange,
    availableTiers,
    tierFilter,
    onTierFilterChange,
  } = props

  const {t} = useTranslation(structureLocaleNamespace)
  const schema = useSchema()
  const sortMenuId = useId()
  const filterMenuId = useId()

  const currentStaticBy = toStaticSortOrder({by: sortOrder?.by ?? []}).by
  const selectedOrdering = orderings.find((item) =>
    isEqual(toStaticSortOrder({by: item.params?.by ?? []}).by, currentStaticBy),
  )
  const getI18nText = useGetI18nText(selectedOrdering)

  const handleSelectOrdering = (item: PaneMenuItem) => {
    if (item.params?.by && onSetSortOrder) onSetSortOrder({by: item.params.by})
  }

  const toggleType = (typeName: string) => {
    onTypeFilterChange(
      typeFilter.includes(typeName)
        ? typeFilter.filter((name) => name !== typeName)
        : [...typeFilter, typeName],
    )
  }

  const toggleFieldValue = (fieldName: string, value: string | boolean) => {
    const current = fieldFilters[fieldName] ?? []
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]
    onFieldFiltersChange({...fieldFilters, [fieldName]: next})
  }

  const toggleTier = (tier: string) => {
    onTierFilterChange(
      tierFilter.includes(tier)
        ? tierFilter.filter((entry) => entry !== tier)
        : [...tierFilter, tier],
    )
  }

  const activeFieldFilterCount = Object.values(fieldFilters).reduce(
    (count, values) => count + values.length,
    0,
  )
  const activeFilterCount =
    (statusFilter === 'any' ? 0 : 1) +
    typeFilter.length +
    activeFieldFilterCount +
    tierFilter.length
  const filterActive = activeFilterCount > 0
  const showTypeFacet = availableTypes.length > 1

  const showSortControl = showSort && orderings.length > 0 && Boolean(onSetSortOrder)

  return (
    <Flex gap={1}>
      {showSortControl && (
        <MenuButton
          button={
            <Button
              aria-label={t('panes.document-list-pane.sort.aria-label')}
              data-testid="document-list-sort-control"
              icon={SortIcon}
              mode="bleed"
              text={
                selectedOrdering
                  ? t('panes.document-list-pane.sort.label', {
                      order: getI18nText(selectedOrdering).title,
                    })
                  : t('panes.document-list-pane.sort.label-unordered')
              }
            />
          }
          id={sortMenuId}
          menu={
            <Menu>
              {orderings.map((item) => (
                <SortMenuItem
                  key={getSearchOrderingId(item)}
                  menuItem={item}
                  onSelect={handleSelectOrdering}
                  selected={item === selectedOrdering}
                />
              ))}
            </Menu>
          }
          popover={MENU_POPOVER}
        />
      )}

      <MenuButton
        button={
          <Button
            aria-label={t('panes.document-list-pane.filter.aria-label')}
            data-testid="document-list-filter-control"
            icon={FilterIcon}
            mode="bleed"
            selected={filterActive}
            text={
              filterActive
                ? t('panes.document-list-pane.filter.label-active', {count: activeFilterCount})
                : t('panes.document-list-pane.filter.label')
            }
            tone={filterActive ? 'primary' : 'default'}
          />
        }
        id={filterMenuId}
        menu={
          <Menu>
            <MenuItem
              onClick={() => onStatusFilterChange('any')}
              pressed={statusFilter === 'any'}
              text={t('panes.document-list-pane.filter.status.any')}
            />
            <MenuItem
              onClick={() => onStatusFilterChange('edited')}
              pressed={statusFilter === 'edited'}
              text={t('panes.document-list-pane.filter.status.edited')}
            />
            <MenuItem
              onClick={() => onStatusFilterChange('published')}
              pressed={statusFilter === 'published'}
              text={t('panes.document-list-pane.filter.status.published')}
            />

            {showTypeFacet && (
              <>
                <MenuDivider />
                {availableTypes.map((typeName) => (
                  <MenuItem
                    key={typeName}
                    onClick={() => toggleType(typeName)}
                    pressed={typeFilter.includes(typeName)}
                    text={schema.get(typeName)?.title ?? typeName}
                  />
                ))}
              </>
            )}

            {/* tier-2: facets declared by (or inferred from) the schema */}
            {fieldFacets.map((facet) => (
              <Box key={facet.name}>
                <MenuDivider />
                <Box padding={2} paddingBottom={1}>
                  <Label muted size={0}>
                    {facet.title}
                  </Label>
                </Box>
                {facet.options.map((option) => (
                  <MenuItem
                    key={String(option.value)}
                    onClick={() => toggleFieldValue(facet.name, option.value)}
                    pressed={(fieldFilters[facet.name] ?? []).includes(option.value)}
                    text={option.title}
                  />
                ))}
              </Box>
            ))}

            {/* confidence prototype: risk-tier facet over pending proposals */}
            {availableTiers.length > 0 && (
              <Box>
                <MenuDivider />
                <Box padding={2} paddingBottom={1}>
                  <Label muted size={0}>
                    {t('panes.document-list-pane.filter.tier.heading')}
                  </Label>
                </Box>
                {availableTiers.map((tier) => (
                  <MenuItem
                    key={tier}
                    onClick={() => toggleTier(tier)}
                    pressed={tierFilter.includes(tier)}
                    text={tier}
                  />
                ))}
              </Box>
            )}

            {filterActive && (
              <>
                <MenuDivider />
                <MenuItem
                  onClick={() => {
                    onStatusFilterChange('any')
                    onTypeFilterChange([])
                    onFieldFiltersChange({})
                    onTierFilterChange([])
                  }}
                  text={t('panes.document-list-pane.filter.clear')}
                />
              </>
            )}
          </Menu>
        }
        popover={MENU_POPOVER}
      />
    </Flex>
  )
})
