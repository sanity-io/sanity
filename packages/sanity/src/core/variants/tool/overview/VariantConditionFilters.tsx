import {AddIcon} from '@sanity/icons/Add'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CloseIcon} from '@sanity/icons/Close'
import {FilterIcon} from '@sanity/icons/Filter'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Stack, Text, TextInput, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Popover} from '../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantConditionIcon} from '../detail/variantConditionIcons'
import {type ConditionFacet} from '../util'

// Condition keys are authored strings ("brand", "market", …); present them title-cased.
function facetLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * The single entry point for adding a filter — an "Add filter" button that opens a two-level menu:
 * a searchable list of dimensions, then the values for the chosen dimension (multi-select, so the
 * menu stays open). Scales to any number of dimensions without overflowing the lane, unlike a
 * dropdown-per-dimension row.
 */
function AddFilterMenu({
  facets,
  value,
  onToggleValue,
}: {
  facets: ConditionFacet[]
  value: Record<string, string[]>
  onToggleValue: (key: string, val: string) => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [open, setOpen] = useState(false)
  const [dimensionKey, setDimensionKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [buttonEl, setButtonEl] = useState<HTMLButtonElement | null>(null)
  const [popoverEl, setPopoverEl] = useState<HTMLElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setDimensionKey(null)
    setQuery('')
  }, [])

  useClickOutsideEvent(close, () => [buttonEl, popoverEl])

  const activeFacet = facets.find((facet) => facet.key === dimensionKey)

  const matchingFacets = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return facets
    return facets.filter((facet) => facetLabel(facet.key).toLowerCase().includes(normalized))
  }, [facets, query])

  const content = activeFacet ? (
    <Stack padding={1} space={1}>
      <Button
        icon={ArrowLeftIcon}
        justify="flex-start"
        mode="bleed"
        onClick={() => setDimensionKey(null)}
        text={facetLabel(activeFacet.key)}
        tone="default"
      />
      {activeFacet.values.map((val) => {
        const isSelected = (value[activeFacet.key] ?? []).includes(val)
        return (
          <Button
            key={val}
            iconRight={isSelected ? CheckmarkIcon : undefined}
            justify="flex-start"
            mode="bleed"
            onClick={() => onToggleValue(activeFacet.key, val)}
            selected={isSelected}
            text={val}
          />
        )
      })}
    </Stack>
  ) : (
    <Stack padding={1} space={1}>
      <Box paddingBottom={1}>
        <TextInput
          fontSize={1}
          icon={SearchIcon}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={t('overview.filter.find-dimension')}
          value={query}
        />
      </Box>
      {matchingFacets.length === 0 ? (
        <Box padding={2}>
          <Text muted size={1}>
            {t('overview.filter.no-dimensions')}
          </Text>
        </Box>
      ) : (
        matchingFacets.map((facet) => {
          const count = (value[facet.key] ?? []).length
          return (
            <Button
              key={facet.key}
              icon={getVariantConditionIcon(facet.key)}
              iconRight={ChevronRightIcon}
              justify="flex-start"
              mode="bleed"
              onClick={() => {
                setDimensionKey(facet.key)
                setQuery('')
              }}
              text={count > 0 ? `${facetLabel(facet.key)} (${count})` : facetLabel(facet.key)}
            />
          )
        })
      )}
    </Stack>
  )

  return (
    <Popover ref={setPopoverEl} content={content} open={open} placement="bottom-start" portal>
      <Button
        ref={setButtonEl}
        icon={AddIcon}
        mode="ghost"
        onClick={() => (open ? close() : setOpen(true))}
        selected={open}
        text={t('overview.filter.add')}
      />
    </Popover>
  )
}

/** A single active filter value, shown as a removable chip carrying its dimension icon. */
function FilterChip({
  icon: Icon,
  label,
  onRemove,
}: {
  icon: ComponentType
  label: string
  onRemove: () => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  return (
    <Card border padding={1} radius={2} style={{flex: 'none'}} tone="primary">
      <Flex align="center" gap={1}>
        <Box paddingLeft={1}>
          <Text size={1}>
            <Icon />
          </Text>
        </Box>
        <Text muted size={1}>
          {label}
        </Text>
        <Button
          icon={CloseIcon}
          mode="bleed"
          onClick={onRemove}
          tooltipProps={{content: t('overview.filter.remove-value')}}
        />
      </Flex>
    </Card>
  )
}

/**
 * Faceted filter bar for the variant definitions overview, rendered in the shared DocumentTable's
 * filter-tabs slot. A bordered "Filters" group with a single "Add filter" entry point (a searchable
 * dimension menu, derived from the data) and a removable chip per active value. Selecting narrows the
 * list — OR within a dimension, AND across dimensions. The single entry point scales to any number of
 * dimensions without overflowing the lane.
 *
 * @internal
 */
export function VariantConditionFilters({
  facets,
  value,
  onChange,
}: {
  facets: ConditionFacet[]
  value: Record<string, string[]>
  onChange: (next: Record<string, string[]>) => void
}): React.JSX.Element | null {
  const {t} = useTranslation(variantsLocaleNamespace)

  const activeChips = Object.entries(value).flatMap(([key, values]) =>
    values.map((val) => ({key, val})),
  )
  const hasActive = activeChips.length > 0

  const toggleValue = useCallback(
    (key: string, val: string) => {
      const current = value[key] ?? []
      const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
      const updated = {...value}
      if (next.length > 0) updated[key] = next
      else delete updated[key]
      onChange(updated)
    },
    [onChange, value],
  )

  if (facets.length === 0) return null

  return (
    <Card border padding={1} radius={2} style={{flex: 'none'}}>
      <Flex align="center" gap={2} wrap="nowrap">
        <Flex align="center" gap={1} paddingX={1} style={{flex: 'none'}}>
          <Text muted size={1}>
            <FilterIcon />
          </Text>
          <Text muted size={1} weight="medium">
            {t('overview.filter.label')}
          </Text>
        </Flex>

        <Box style={{flex: 'none'}}>
          <AddFilterMenu facets={facets} onToggleValue={toggleValue} value={value} />
        </Box>

        {hasActive && (
          <>
            {/* Thin rule separating the add control from the active-value chips. */}
            <Box
              style={{flex: 'none', width: 1, height: 20, background: 'var(--card-border-color)'}}
            />
            {activeChips.map(({key, val}) => (
              <FilterChip
                icon={getVariantConditionIcon(key)}
                key={`${key}:${val}`}
                label={val}
                onRemove={() => toggleValue(key, val)}
              />
            ))}
            <Box style={{flex: 'none'}}>
              <Button
                icon={CloseIcon}
                mode="bleed"
                onClick={() => onChange({})}
                text={t('overview.filter.clear-all')}
                tone="primary"
              />
            </Box>
          </>
        )}
      </Flex>
    </Card>
  )
}
