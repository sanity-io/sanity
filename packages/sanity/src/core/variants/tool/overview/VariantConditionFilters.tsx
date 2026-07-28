import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {FilterIcon} from '@sanity/icons/Filter'
import {Box, Card, Flex, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, useCallback, useState} from 'react'

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
 * One condition dimension as a dropdown of its values. Multi-select (each value toggles
 * independently, so the popover stays open); the trigger highlights when the dimension has any
 * active values. The specific active values are shown as removable chips beside the dropdowns, so
 * the trigger stays a stable width and doesn't carry a count that shifts its neighbours.
 */
function ConditionFacetFilter({
  facet,
  selected,
  onChange,
}: {
  facet: ConditionFacet
  selected: string[]
  onChange: (next: string[]) => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [open, setOpen] = useState(false)
  const [buttonEl, setButtonEl] = useState<HTMLButtonElement | null>(null)
  const [popoverEl, setPopoverEl] = useState<HTMLElement | null>(null)

  useClickOutsideEvent(
    () => setOpen(false),
    () => [buttonEl, popoverEl],
  )

  const toggle = useCallback(
    (value: string) => {
      onChange(
        selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
      )
    },
    [onChange, selected],
  )

  return (
    <Popover
      ref={setPopoverEl}
      content={
        <Stack padding={1} space={1}>
          {facet.values.map((value) => {
            const isSelected = selected.includes(value)
            return (
              <Button
                key={value}
                iconRight={isSelected ? CheckmarkIcon : undefined}
                justify="flex-start"
                mode="bleed"
                onClick={() => toggle(value)}
                selected={isSelected}
                text={value}
              />
            )
          })}
          {selected.length > 0 && (
            <Button
              mode="bleed"
              onClick={() => onChange([])}
              text={t('overview.filter.clear')}
              tone="critical"
            />
          )}
        </Stack>
      }
      open={open}
      placement="bottom-start"
      portal
    >
      <Button
        ref={setButtonEl}
        icon={getVariantConditionIcon(facet.key)}
        iconRight={ChevronDownIcon}
        mode={selected.length > 0 ? 'ghost' : 'bleed'}
        onClick={() => setOpen((prev) => !prev)}
        selected={open}
        text={facetLabel(facet.key)}
        tone={selected.length > 0 ? 'primary' : 'default'}
      />
    </Popover>
  )
}

/** A single active filter value, shown as a removable chip (the #2 "active filter" representation). */
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
 * filter-tabs slot. A bordered "Filters" group holds one dropdown per condition key (derived from the
 * data) plus removable chips for each active value. Selecting narrows the list — OR within a
 * dimension, AND across dimensions. Everything stays on one row (the lane scrolls horizontally when
 * it overflows) so nothing wraps and lurches the table.
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

  const setFacet = useCallback(
    (key: string, next: string[]) => {
      const updated = {...value}
      if (next.length > 0) updated[key] = next
      else delete updated[key]
      onChange(updated)
    },
    [onChange, value],
  )

  const removeChip = useCallback(
    (key: string, val: string) => {
      setFacet(
        key,
        (value[key] ?? []).filter((v) => v !== val),
      )
    },
    [setFacet, value],
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

        {facets.map((facet) => (
          <Box key={facet.key} style={{flex: 'none'}}>
            <ConditionFacetFilter
              facet={facet}
              onChange={(next) => setFacet(facet.key, next)}
              selected={value[facet.key] ?? []}
            />
          </Box>
        ))}

        {hasActive && (
          <>
            {/* Thin rule separating the dimension dropdowns from the active-value chips. */}
            <Box
              style={{flex: 'none', width: 1, height: 20, background: 'var(--card-border-color)'}}
            />
            {activeChips.map(({key, val}) => (
              <FilterChip
                icon={getVariantConditionIcon(key)}
                key={`${key}:${val}`}
                label={val}
                onRemove={() => removeChip(key, val)}
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
