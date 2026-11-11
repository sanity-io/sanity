import {AddIcon} from '@sanity/icons/Add'
import {useMemo, useState} from 'react'
import {type VariantFilterAddControlProps} from 'sanity'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {type Chosen, type DimensionSpec} from './model'
import {Picker} from './Picker'

// The Variants tool's "Add filter" (the stock two-level menu) drawn with the SAME picker the perspective bar uses: one search, the dimension rail
// with its icons, the values, the hint and Clear. Through the PROPOSED `VariantFilterAddControlProvider`. Differences from the bar:
//  - the tool's filter is MANY values per dimension (OR within a dimension), so a click toggles a value and the panel stays open;
//  - the picker marks one value per dimension as chosen: the last one added (the chips beside the control list them all).

const title = (key: string) => key.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

function PickerAddFilter({facets, value, onToggleValue, onClear}: VariantFilterAddControlProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const dimensions = useMemo<DimensionSpec[]>(
    () =>
      facets.map((facet) => ({
        name: facet.key,
        title: title(facet.key),
        values: facet.values.map((v) => [v, title(v)] as const),
      })),
    [facets],
  )
  const chosen: Chosen = Object.fromEntries(
    Object.entries(value)
      .filter(([, values]) => values.length > 0)
      .map(([key, values]) => [key, values[values.length - 1]]),
  )
  return (
    <>
      <span ref={setAnchor} style={{display: 'inline-flex'}}>
        <Button
          data-testid="variant-filter-add"
          icon={AddIcon}
          mode="ghost"
          onClick={() => setOpen((o) => !o)}
          selected={open}
          text="Add filter"
        />
      </span>
      <Picker
        anchor={anchor}
        chosen={chosen}
        dimensions={dimensions}
        onClear={() => {
          onClear()
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
        onPick={(dimension, key) => {
          // The Default row (`null`) clears the dimension: toggle off everything it holds.
          if (key === null) (value[dimension] ?? []).forEach((v) => onToggleValue(dimension, v))
          else onToggleValue(dimension, key)
        }}
        open={open}
        testId="variant-filter-picker"
      />
    </>
  )
}

/** The function the Variants tool calls to draw its Add filter control. */
export const renderPickerAddFilter = (props: VariantFilterAddControlProps) => (
  <PickerAddFilter {...props} />
)
