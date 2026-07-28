import {AddIcon} from '@sanity/icons/Add'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {FilterIcon} from '@sanity/icons/Filter'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Stack, Text, TextInput, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Popover} from '../../../../ui-components/popover/Popover'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
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

  // Master-detail: dimensions on the left, the selected dimension's values on the right — both panes
  // visible at once, so choosing a dimension and toggling its values needs no back-and-forth.
  const content = (
    <Stack space={0} style={{width: 520}}>
      <Box padding={2} style={{borderBottom: '1px solid var(--card-border-color)'}}>
        <TextInput
          fontSize={1}
          icon={SearchIcon}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={t('overview.filter.find-dimension')}
          radius={2}
          value={query}
        />
      </Box>
      <Flex>
        {/* Left: dimensions — icon + label grouped left (flex-start); the highlighted row and the
            live value pane convey the drill, so no trailing chevron is needed. */}
        <Box style={{width: 240, borderRight: '1px solid var(--card-border-color)'}}>
          <Stack padding={2} space={1}>
            {matchingFacets.length === 0 ? (
              <Box padding={3}>
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
                    justify="flex-start"
                    mode="bleed"
                    onClick={() => setDimensionKey(facet.key)}
                    selected={facet.key === dimensionKey}
                    text={count > 0 ? `${facetLabel(facet.key)} (${count})` : facetLabel(facet.key)}
                  />
                )
              })
            )}
          </Stack>
        </Box>
        {/* Right: values of the selected dimension — a muted header names the dimension, then the
            values (text left, selected checkmark pinned right via space-between). */}
        <Box style={{flex: 1}}>
          {activeFacet ? (
            <Stack padding={2} space={1}>
              <Box paddingBottom={1} paddingTop={1} paddingX={2}>
                <Text muted size={0} weight="medium">
                  {facetLabel(activeFacet.key)}
                </Text>
              </Box>
              {activeFacet.values.map((val) => {
                const isSelected = (value[activeFacet.key] ?? []).includes(val)
                return (
                  <Button
                    key={val}
                    iconRight={isSelected ? CheckmarkIcon : undefined}
                    justify="space-between"
                    mode="bleed"
                    onClick={() => onToggleValue(activeFacet.key, val)}
                    selected={isSelected}
                    text={val}
                  />
                )
              })}
            </Stack>
          ) : (
            <Flex align="center" height="fill" justify="center" padding={4}>
              <Text align="center" muted size={1}>
                {t('overview.filter.pick-dimension-hint')}
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Stack>
  )

  return (
    <Popover ref={setPopoverEl} content={content} open={open} placement="bottom-start" portal>
      <Button
        ref={setButtonEl}
        icon={AddIcon}
        mode="ghost"
        onClick={() => {
          if (open) {
            close()
          } else {
            // Default to the first dimension so the value pane is populated on open.
            setDimensionKey((prev) => prev ?? facets[0]?.key ?? null)
            setOpen(true)
          }
        }}
        selected={open}
        text={t('overview.filter.add')}
      />
    </Popover>
  )
}

const NOOP = (): void => {}

interface ActiveChip {
  key: string
  val: string
  icon: ComponentType
  /** The value, shown as the chip text. */
  label: string
  /** "Dimension: value", used as the tooltip (and the only cue when collapsed to an icon). */
  title: string
}

/**
 * A single active filter value, shown as a removable chip carrying its dimension icon. When
 * `iconOnly` (the overflow-collapsed state) it drops the value text and surfaces it via a tooltip.
 */
function FilterChip({
  chip,
  iconOnly,
  onRemove,
}: {
  chip: ActiveChip
  iconOnly: boolean
  onRemove: () => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const Icon = chip.icon
  const body = (
    <Card border padding={1} radius={2} style={{flex: 'none'}} tone="primary">
      <Flex align="center" gap={2}>
        <Box paddingLeft={1}>
          <Text size={1}>
            <Icon />
          </Text>
        </Box>
        {!iconOnly && (
          <Text muted size={1} style={{whiteSpace: 'nowrap'}}>
            {chip.label}
          </Text>
        )}
        <Button
          icon={CloseIcon}
          mode="bleed"
          onClick={onRemove}
          tooltipProps={{content: t('overview.filter.remove-value')}}
        />
      </Flex>
    </Card>
  )

  // Collapsed chips are just an icon; the tooltip carries the dimension + value.
  return iconOnly ? (
    <Tooltip content={<Text size={1}>{chip.title}</Text>} portal>
      <Box style={{flex: 'none'}}>{body}</Box>
    </Tooltip>
  ) : (
    body
  )
}

/**
 * The active filter chips, in a flexible zone that never scrolls: a hidden, always-expanded copy is
 * measured against the visible zone's width, and when the full chips would overflow they all collapse
 * to icon-only (tooltip-labelled). The zone flexes, so "Add filter" and "Clear filters" beside it stay
 * pinned and always visible.
 */
function ActiveChips({
  chips,
  onRemove,
}: {
  chips: ActiveChip[]
  onRemove: (key: string, val: string) => void
}): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => {
      setCollapsed(measure.scrollWidth > container.clientWidth)
    })
    observer.observe(container)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [])

  return (
    <Box
      flex={1}
      ref={containerRef}
      style={{minWidth: 0, overflow: 'hidden', position: 'relative'}}
    >
      <Flex align="center" gap={2} wrap="nowrap">
        {chips.map((chip) => (
          <FilterChip
            chip={chip}
            iconOnly={collapsed}
            key={`${chip.key}:${chip.val}`}
            onRemove={() => onRemove(chip.key, chip.val)}
          />
        ))}
      </Flex>
      {/* Hidden, always-expanded copy — measured to decide whether the visible chips must collapse. */}
      <Flex
        aria-hidden
        gap={2}
        ref={measureRef}
        style={{
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          visibility: 'hidden',
        }}
        wrap="nowrap"
      >
        {chips.map((chip) => (
          <FilterChip
            chip={chip}
            iconOnly={false}
            key={`measure-${chip.key}:${chip.val}`}
            onRemove={NOOP}
          />
        ))}
      </Flex>
    </Box>
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

  const activeChips: ActiveChip[] = Object.entries(value).flatMap(([key, values]) =>
    values.map((val) => ({
      key,
      val,
      icon: getVariantConditionIcon(key),
      label: val,
      title: `${facetLabel(key)}: ${val}`,
    })),
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
    // Fill the lane when there are chips (so Clear pins right and the chips zone can measure its
    // available width); shrink to content when there are none, so the empty bar stays compact.
    <Card border padding={1} radius={2} style={hasActive ? undefined : {display: 'inline-flex'}}>
      <Flex align="center" gap={2} wrap="nowrap">
        <Box paddingX={1} style={{flex: 'none'}}>
          <Text muted size={1}>
            <FilterIcon />
          </Text>
        </Box>

        <Box style={{flex: 'none'}}>
          <AddFilterMenu facets={facets} onToggleValue={toggleValue} value={value} />
        </Box>

        {hasActive && (
          <>
            {/* Thin rule separating the add control from the active-value chips. */}
            <Box
              style={{flex: 'none', width: 1, height: 20, background: 'var(--card-border-color)'}}
            />
            <ActiveChips chips={activeChips} onRemove={toggleValue} />
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
