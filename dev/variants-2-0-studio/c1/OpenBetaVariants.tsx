import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card} from '@sanity/ui'
import {useState} from 'react'
import {useSetVariant} from 'sanity'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {AddressChip} from './AddressRow'
import {DimensionIcon} from './dimensionIcons'
import {valueTitle} from './model'
import {Picker} from './Picker'
import {usePerspectiveState} from './state'
import {useVariantDefinitions} from './world'

/** The stock state pill's height (33px with its border): the two controls are the same size. */
const NAVBAR_HEIGHT = 33
/** The chips inside the grey section (4 px of base around them). */
const SECTION_HEIGHT = 25
/** Padding between the icons and the pill's edges, so it is as roomy as the stock pill; the chevron stays at the right end. */
const PADDING_X = 14
const CHEVRON_INSET = 4
/** The icon's own margin is -6px each side; a little less on the right gives the label more room. */
const ICON_STYLE = {marginRight: -2} as const
/** What the control says when no variant is picked: the same word as the first row of its list. */
const RESTING_LABEL = 'Default'

/**
 * The open beta navbar's second control (C1 option B, Figma 192:3139): the Variants control, next to the stock state control. Nothing else.
 * It owns no state. The router's `variant` param is the only copy of the choice: this reads it (through `chosen`, derived from it in the locked
 * navbar) and writes it. Open beta has one dimension, so the picker is one flat list with a Default row; a click always opens it.
 */
export function OpenBetaVariants({inSection = false}: {inSection?: boolean}) {
  // In the navbar's grey section the control is a white chip without an outline, 29 px tall, like the state control beside it.
  const height = inSection ? SECTION_HEIGHT : NAVBAR_HEIGHT
  const {chosen, dimensions} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const setVariant = useSetVariant()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const dimension = dimensions[0]
  if (!dimension) return null

  const value = chosen[dimension.name]
  // `null` is the Default row and the cross: no variant. A value is the one definition that names only that value.
  const choose = (key: string | null) => {
    const definition =
      key === null
        ? undefined
        : definitions.find((d) => {
            const entries = Object.entries(d.conditions)
            return entries.length === 1 && d.conditions[dimension.name] === key
          })
    setVariant({variantId: definition?._id as never})
    setOpen(false)
  }

  return (
    <div data-testid="open-beta-variants" ref={setAnchor} style={{display: 'inline-flex'}}>
      {value ? (
        <AddressChip
          accessibleName={`${dimension.title}: ${valueTitle(dimension, value)}`}
          borderless={inSection}
          height={height}
          icon={<DimensionIcon name={dimension.name} style={ICON_STYLE} />}
          paddingX={PADDING_X}
          onOpen={() => setOpen(true)}
          onRemove={() => choose(null)}
          removeLabel={`Remove ${dimension.title}`}
          removeTestId="variants-chip-remove"
          testId="variants-chip"
          text={valueTitle(dimension, value)}
        />
      ) : (
        // Resting: the same outlined capsule as the applied control and the stock state pill, with nothing in it but the label.
        <Card border={!inSection} radius="full" style={{height, overflow: 'hidden'}}>
          <Button
            data-testid="variants-button"
            icon={<DimensionIcon name={dimension.name} style={ICON_STYLE} />}
            iconRight={ChevronDownIcon}
            mode="bleed"
            onClick={() => setOpen(true)}
            style={{
              borderRadius: 0,
              height: inSection ? height : height - 2,
              minHeight: inSection ? height : height - 2,
              paddingLeft: PADDING_X,
              paddingRight: CHEVRON_INSET,
            }}
            text={RESTING_LABEL}
            tooltipProps={null}
          />
        </Card>
      )}
      <Picker
        anchor={anchor}
        chosen={chosen}
        dimensions={dimensions}
        onClear={() => choose(null)}
        onClose={() => setOpen(false)}
        onPick={(_dimension, key) => choose(key)}
        open={open}
      />
    </div>
  )
}
