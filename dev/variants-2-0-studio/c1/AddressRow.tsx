// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit c9557870aa, lib/explorations/variants-2-0/perspective/AddressRow.tsx).
// Changes: imports point at this monorepo and ./model. LIVE: the Stage setting (open beta = one dimension, no
// "Add dimension", no pending chip) and the removed fixture `world`; marked "LIVE:" below.
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'

import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {RemoveIcon} from '@sanity/icons/Remove'
import {Card, Flex, Text} from '@sanity/ui'
import {type ReactElement, useEffect, useState} from 'react'

import {SegmentDivider} from '../../../packages/sanity/src/core/variants/plugin/components/PerspectiveFilter.css'
import {valueTitle} from './model'
import {DimensionIcon} from './dimensionIcons'
import {Picker} from './Picker'
import {useOptionState} from '../options/store'
import {usePerspectiveState} from './state'
import {CHIP_SHAPE} from './Controls'
import {DimensionButton, StateMenu, VersionGlyph} from './StateMenu'

const CHIP_INNER = {height: 23, minHeight: 23} as const

/**
 * An address chip, built as the real `PerspectiveFilter` pill is: one `Card` (radius 2 = 3px, 1px
 * border) holding the main button, the real `SegmentDivider`, and the remove button, all one 25px
 * control. The main button shows the dimension's icon and the value, with a chevron; the dimension's
 * name is in its accessible name ("Market: United Kingdom"). A click on it opens the picker on that
 * dimension; the cross removes it. `PerspectiveFilter` itself is not used: it adds a text prefix
 * before the pill, which a chip does not have. The library's Address Chip is not in the Studio
 * source yet.
 */
function AddressChip(props: {
  text: string
  accessibleName: string
  icon?: ReactElement
  testId: string
  onOpen: () => void
  onRemove: () => void
  removeLabel: string
  removeTestId: string
  setRef?: (el: HTMLElement | null) => void
}) {
  return (
    // UI-CONSISTENCY section 2: 25px including the 1px border, so the buttons inside are 23px.
    <Card border data-testid={props.testId} radius={CHIP_SHAPE === 'round' ? 'full' : 2} ref={props.setRef} style={{height: 25}}>
      <Flex align="center">
        <Button
          aria-label={props.accessibleName}
          icon={props.icon}
          iconRight={ChevronDownIcon}
          mode="bleed"
          onClick={props.onOpen}
          radius={CHIP_SHAPE === 'round' ? 'full' : undefined}
          style={CHIP_INNER}
          text={props.text}
          tooltipProps={null}
        />
        <div className={SegmentDivider} />
        <Button
          aria-label={props.removeLabel}
          data-testid={props.removeTestId}
          icon={RemoveIcon}
          mode="bleed"
          onClick={props.onRemove}
          radius={CHIP_SHAPE === 'round' ? 'full' : undefined}
          style={CHIP_INNER}
          tooltipProps={null}
        />
      </Flex>
    </Card>
  )
}

/**
 * The row, shared by both options: the composed address under the navbar. "Showing [version]", one
 * chip per dimension value, "Add dimension" and "Clear". It pushes the studio down (it is in the flow, not
 * an overlay). The same state drives the pill, the Variants control and the document pane.
 */
export function AddressRow() {
  const s = usePerspectiveState()
  const {chosen, dimensions} = s
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [start, setStart] = useState<string | undefined>(undefined)
  const [pendingEl, setPendingEl] = useState<HTMLElement | null>(null)
  const [addEl, setAddEl] = useState<HTMLElement | null>(null)
  const narrowed = Object.keys(chosen).length > 0
  const allSet = dimensions.every((d) => chosen[d.name])
  // LIVE: open beta has exactly one dimension and no Add dimension button or pending chip.
  const openBeta = useOptionState().stage === 'open-beta'
  const only = dimensions[0]

  // The extra menu row ("Add a dimension…" or "View as…") raises the pending chip; its picker opens on it.
  useEffect(() => {
    if (s.pending && pendingEl && !openBeta) {
      setAnchor(pendingEl)
      setStart(undefined)
      setOpen(true)
    }
    // LIVE: in open beta the menu's extra row asks for the one list; it opens on the dimension button, no chip.
    if (s.pending && openBeta && addEl) {
      setAnchor(addEl)
      setStart(undefined)
      setOpen(true)
      s.setPending(false)
    }
  }, [s.pending, pendingEl, addEl, openBeta, s])

  // LIVE: the fixture's `world.variantsEnabled` is gone; the host only mounts this row when the design is on.
  if (!s.rowShown) return null

  const close = () => setOpen(false)
  const remove = (name: string) => {
    const next = {...chosen}
    delete next[name]
    s.setChosen(next)
  }
  return (
    <Card borderBottom data-testid="address-row" paddingX={3} paddingY={2}>
      <Flex align="center" gap={2} wrap="wrap">
        <Text muted size={1}>
          Showing
        </Text>
        <StateMenu
          trigger={
            <DimensionButton
              icon={<VersionGlyph version={s.version} />}
              shape={CHIP_SHAPE}
              testId="row-version"
              text={s.versionLabel}
            />
          }
        />
        {dimensions
          .filter((d) => chosen[d.name])
          .map((d) => (
            <AddressChip
              accessibleName={`${d.title}: ${valueTitle(d, chosen[d.name])}`}
              icon={<DimensionIcon name={d.name} />}
              key={d.name}
              onOpen={() => {
                setAnchor(document.querySelector(`[data-testid="chip-${d.name}"]`))
                setStart(d.name)
                setOpen(true)
              }}
              onRemove={() => remove(d.name)}
              removeLabel={`Remove ${d.title}`}
              removeTestId={`chip-${d.name}-remove`}
              testId={`chip-${d.name}`}
              text={valueTitle(d, chosen[d.name])}
            />
          ))}
        {openBeta ? (
          // LIVE: open beta. With nothing chosen the one dimension is a button that opens its flat list; once a
          // value is chosen the chip above is the control. No "Add dimension", no pending chip.
          !narrowed && only ? (
            <div ref={setAddEl}>
              <Button
                data-testid="row-choose"
                icon={<DimensionIcon name={only.name} />}
                iconRight={ChevronDownIcon}
                mode="ghost"
                onClick={() => {
                  setAnchor(addEl)
                  setStart(undefined)
                  setOpen(true)
                }}
                text={only.title}
                tooltipProps={null}
              />
            </div>
          ) : null
        ) : s.pending ? (
          <AddressChip
            accessibleName="Pick a dimension"
            onOpen={() => {
              setAnchor(pendingEl)
              setStart(undefined)
              setOpen(true)
            }}
            onRemove={() => {
              s.setPending(false)
              close()
            }}
            removeLabel="Cancel"
            removeTestId="pending-cancel"
            setRef={setPendingEl}
            testId="chip-pending"
            text="Pick a dimension"
          />
        ) : (
          <div ref={setAddEl}>
            <Button
              data-testid="row-add"
              disabled={allSet}
              icon={AddIcon}
              mode="bleed"
              onClick={() => {
                s.setPending(true)
              }}
              text="Add dimension"
              tooltipProps={null}
            />
          </div>
        )}
        {narrowed ? (
          <Button
            data-testid="row-clear"
            mode="bleed"
            onClick={() => {
              s.setChosen({})
              s.setPending(false)
            }}
            text="Clear"
            tooltipProps={null}
          />
        ) : null}
      </Flex>
      <Picker
        anchor={anchor ?? addEl}
        chosen={chosen}
        dimensions={dimensions}
        onClose={close}
        onClear={() => {
          s.setChosen({})
          s.setPending(false)
          close()
        }}
        onPick={(dimension, key) => {
          const next = {...chosen}
          if (key === null) delete next[dimension]
          else next[dimension] = key
          s.setChosen(next)
          s.setPending(false)
          close()
        }}
        open={open}
        start={start}
      />
    </Card>
  )
}
