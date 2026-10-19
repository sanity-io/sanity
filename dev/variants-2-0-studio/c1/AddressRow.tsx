// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 2700f4cf07, lib/explorations/variants-2-0/perspective/AddressRow.tsx).
// Changes: imports point at this monorepo and ./model; LIVE: marks the few places that read live data.
import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'

import {AddIcon} from '@sanity/icons/Add'
import {CloseIcon} from '@sanity/icons/Close'
import {Card, Flex, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'

import {valueTitle} from './model'
import {DimensionIcon} from './dimensionIcons'
import {Picker} from './Picker'
import {usePerspectiveState} from './state'
import {DimensionButton, StateMenu, VersionGlyph} from './StateMenu'

/**
 * An address chip: the dimension and its value in one pill, a click opens the picker on that
 * dimension, the cross removes it. Composed from the real `Chip` and `Button`: the library's Address
 * Chip is not in the Studio source yet.
 */
function AddressChip(props: {
  label: string
  dimension: string
  testId: string
  onOpen?: () => void
  onRemove: () => void
  removeLabel: string
  setRef?: (el: HTMLElement | null) => void
}) {
  return (
    <Flex align="center" data-testid={props.testId} ref={props.setRef} style={{gap: 0}}>
      <Chip
        icon={<DimensionIcon name={props.dimension} />}
        mode="ghost"
        onClick={props.onOpen}
        style={{borderRadius: 3}}
        text={props.label}
      />
      <Button
        aria-label={props.removeLabel}
        data-testid={`${props.testId}-remove`}
        icon={CloseIcon}
        mode="bleed"
        onClick={props.onRemove}
        style={{borderRadius: 3}}
        tooltipProps={null}
      />
    </Flex>
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

  // "Narrow by dimension…" in the menu raises the pending chip; its picker opens on it.
  useEffect(() => {
    if (s.pending && pendingEl) {
      setAnchor(pendingEl)
      setStart(undefined)
      setOpen(true)
    }
  }, [s.pending, pendingEl])

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
              testId="row-version"
              text={s.versionLabel}
            />
          }
        />
        {dimensions
          .filter((d) => chosen[d.name])
          .map((d) => (
            <AddressChip
              key={d.name}
              dimension={d.name}
              label={`${d.title}: ${valueTitle(d, chosen[d.name])}`}
              onOpen={(event?: unknown) => {
                void event
                setAnchor(document.querySelector(`[data-testid="chip-${d.name}"]`))
                setStart(d.name)
                setOpen(true)
              }}
              onRemove={() => remove(d.name)}
              removeLabel={`Remove ${d.title}`}
              setRef={undefined}
              testId={`chip-${d.name}`}
            />
          ))}
        {s.pending ? (
          <Flex align="center" data-testid="chip-pending" ref={setPendingEl} style={{gap: 0}}>
            <Chip
              mode="ghost"
              style={{borderRadius: 3}}
              onClick={() => {
                setAnchor(pendingEl)
                setStart(undefined)
                setOpen(true)
              }}
              text="Pick a dimension"
            />
            <Button
              aria-label="Cancel"
              data-testid="pending-cancel"
              icon={CloseIcon}
              mode="bleed"
              onClick={() => {
                s.setPending(false)
                close()
              }}
              style={{borderRadius: 3}}
              tooltipProps={null}
            />
          </Flex>
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
