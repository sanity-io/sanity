import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {FilterIcon} from '@sanity/icons/Filter'
import {Box, Flex, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Popover} from '../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {type ConditionFacet} from '../util'

// Condition keys are authored strings ("brand", "market", …); present them title-cased.
function facetLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * A single condition dimension rendered as a dropdown of its values. Multi-select (each value
 * toggles independently), so the popover stays open while choosing; a trailing count on the trigger
 * signals how many values are active.
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

  const label = facetLabel(facet.key)

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
        iconRight={ChevronDownIcon}
        mode={selected.length > 0 ? 'ghost' : 'bleed'}
        onClick={() => setOpen((prev) => !prev)}
        selected={open}
        text={selected.length > 0 ? `${label} · ${selected.length}` : label}
        tone={selected.length > 0 ? 'primary' : 'default'}
      />
    </Popover>
  )
}

/**
 * Faceted filter bar for the variant definitions overview: one dropdown per condition key, derived
 * from the data. Selecting values narrows the list (OR within a dimension, AND across dimensions).
 * Rendered in the shared DocumentTable's filter-tabs slot.
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

  const hasActive = Object.values(value).some((values) => values.length > 0)

  const setFacet = useCallback(
    (key: string, next: string[]) => {
      const updated = {...value}
      if (next.length > 0) updated[key] = next
      else delete updated[key]
      onChange(updated)
    },
    [onChange, value],
  )

  if (facets.length === 0) return null

  // nowrap keeps the whole lane on one row — the command lane's own overflow-x scrolls it (with a
  // fade cue) when there are many dimensions, so a widening trigger or the Clear button never wraps
  // to a second line and lurches the rows below. A leading filter glyph marks the zone.
  return (
    <Flex align="center" gap={2} wrap="nowrap">
      <Box paddingX={1} style={{flex: 'none'}}>
        <Text muted size={1}>
          <FilterIcon />
        </Text>
      </Box>
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
        <Box style={{flex: 'none'}}>
          <Button
            icon={CloseIcon}
            mode="ghost"
            onClick={() => onChange({})}
            text={t('overview.filter.clear-all')}
            tone="primary"
          />
        </Box>
      )}
    </Flex>
  )
}
