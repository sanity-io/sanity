import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card} from '@sanity/ui'
import {type MouseEvent, useState} from 'react'
import {useSetVariant} from 'sanity'
import {useStateLink} from 'sanity/router'

import {CreateVariantDialog} from '../../../packages/sanity/src/core/variants/components/dialog/CreateVariantDialog'
import {type SystemVariant} from '../../../packages/sanity/src/core/variants/types'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {useBaseNames} from '../c15/baseName'
import {AddressChip} from './AddressRow'
import {DimensionIcon, VariantDiamond} from './dimensionIcons'
import {valueTitle} from './model'
import {Picker} from './Picker'
import {usePerspectiveState} from './state'
import {reloadVariantDefinitions, useVariantDefinitions} from './world'

/** The stock state pill's height (33px with its border): the two controls are the same size. */
const NAVBAR_HEIGHT = 33
/** The chips inside the grey section (4 px of base around them). */
const SECTION_HEIGHT = 25
/** The room before the icon: the left edge to the diamond's ink is 14px, as the chevron's ink to the right edge is (27 Oct, Faheem: the
 * pill was 22px on the left and 14px on the right, measured on screen). */
const PADDING_X = 6
const CHEVRON_INSET = 4
/** The icon's own margin is -6px each side; a little less on the right gives the label more room. */
const ICON_STYLE = {marginRight: -2} as const

const isVariantId = (id: string): id is SystemVariant['_id'] => id.startsWith('_.variants.')

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
  const basePill = useBaseNames().pill
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [creating, setCreating] = useState(false)
  // The Releases menu's two footer rows, for variants: the tool, and the tool's own create dialog.
  const viewAll = useStateLink({state: {tool: 'variants'}})
  const dimension = dimensions[0]
  if (!dimension) return null

  const value = chosen[dimension.name]
  // A click on the control opens the menu, and a second click closes it (a press outside closes it too; the anchor is not outside).
  const toggle = () => setOpen((wasOpen) => !wasOpen)
  // `null` is the Default row and the cross: no variant. A value is the one definition that names only that value.
  const choose = (key: string | null) => {
    const definition =
      key === null
        ? undefined
        : definitions.find((d) => {
            const entries = Object.entries(d.conditions)
            return entries.length === 1 && d.conditions[dimension.name] === key
          })
    setVariant({variantId: definition && isVariantId(definition._id) ? definition._id : undefined})
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
          onOpen={toggle}
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
            aria-label={`${dimension.title}: ${basePill}`}
            data-testid="variants-button"
            icon={<DimensionIcon name={dimension.name} style={ICON_STYLE} />}
            iconRight={ChevronDownIcon}
            mode="bleed"
            onClick={toggle}
            style={{
              borderRadius: 0,
              height: inSection ? height : height - 2,
              minHeight: inSection ? height : height - 2,
              paddingLeft: PADDING_X,
              paddingRight: CHEVRON_INSET,
            }}
            // The value, as the state control says "Drafts" and not "Perspective"; the dimension titles the menu. No tooltip, as on the
            // state control (Faheem, 22 Oct): the label says what is chosen, and the accessible name carries the dimension.
            text={basePill}
            tooltipProps={null}
          />
        </Card>
      )}
      <Picker
        anchor={anchor}
        chosen={chosen}
        dimensions={dimensions}
        idOf={(name, key) =>
          definitions
            .find((d) => Object.keys(d.conditions).length === 1 && d.conditions[name] === key)
            ?._id.replace(/^_\.variants\./, '')
        }
        onClear={() => choose(null)}
        footer={
          <>
            <MenuItem
              as="a"
              data-testid="variants-view-all"
              href={viewAll.href}
              icon={VariantDiamond}
              onClick={(event: MouseEvent<HTMLElement>) => {
                setOpen(false)
                viewAll.onClick(event)
              }}
              text="View all"
            />
            <MenuItem
              data-testid="variants-create-new"
              icon={AddIcon}
              onClick={() => {
                setOpen(false)
                setCreating(true)
              }}
              text={`New ${dimension.title.toLowerCase()}`}
            />
          </>
        }
        onClose={() => setOpen(false)}
        onPick={(_dimension, key) => choose(key)}
        open={open}
      />
      {creating ? (
        // As New release selects the release it made, New audience selects the variant it made.
        <CreateVariantDialog
          onCancel={() => setCreating(false)}
          onSubmit={(id) => {
            setCreating(false)
            // The new definition is not in the loaded list yet: reload it, so the navbar names the new variant at once (no page reload).
            reloadVariantDefinitions()
            if (isVariantId(id)) setVariant({variantId: id})
          }}
        />
      ) : null}
    </div>
  )
}
