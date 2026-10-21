import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {Card, Flex, Text} from '@sanity/ui'
import {type ReactElement, useEffect, useState} from 'react'

import {SegmentDivider} from '../../../packages/sanity/src/core/variants/plugin/components/PerspectiveFilter.css'
// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit c9557870aa, lib/explorations/variants-2-0/perspective/AddressRow.tsx).
// Changes: imports point at this monorepo and ./model. LIVE: the Stage setting (open beta = one dimension, no
// "Add dimension", no pending chip) and the removed fixture `world`; marked "LIVE:" below.
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {useOption, useOptionState} from '../options/store'
import {CHIP_SHAPE} from './Controls'
import {DimensionIcon} from './dimensionIcons'
import {valueTitle} from './model'
import {Picker} from './Picker'
import {usePerspectiveState} from './state'
import {DimensionButton, StateMenu, VersionGlyph} from './StateMenu'

// Flush segments: the buttons inside the chip have no radius of their own; the chip's outer radius clips their hover fill.
/** How far the chevron sits from the end of its button when the chip has extra horizontal room. */
const CHEVRON_INSET = 4
const chipInner = (height: number) =>
  ({borderRadius: 0, height: height - 2, minHeight: height - 2}) as const

/**
 * An address chip, built as the real `PerspectiveFilter` pill is: one `Card` (radius 2 = 3px, 1px
 * border) holding the main button, the real `SegmentDivider`, and the remove button, all one 25px
 * control. The main button shows the dimension's icon and the value, with a chevron; the dimension's
 * name is in its accessible name ("Market: United Kingdom"). A click on it opens the picker on that
 * dimension; the cross removes it. `PerspectiveFilter` itself is not used: it adds a text prefix
 * before the pill, which a chip does not have. The library's Address Chip is not in the Studio
 * source yet.
 */
export function AddressChip(props: {
  text: string
  accessibleName: string
  icon?: ReactElement
  testId: string
  onOpen: () => void
  onRemove: () => void
  removeLabel: string
  removeTestId: string
  captureEl?: (el: HTMLElement | null) => void
  /** Outer height in px including the border: 25 in the row, 33 in the navbar (the stock state pill). */
  height?: number
  /** Extra horizontal padding in px on each button (the navbar pill is roomier than the row chip). */
  paddingX?: number
}) {
  const {
    text,
    accessibleName,
    icon,
    testId,
    onOpen,
    onRemove,
    removeLabel,
    removeTestId,
    captureEl,
    height = 25,
    paddingX,
  } = props
  // The room is between the icons and the edges: the main button has it on the left (its chevron stays at the right end), the cross on both sides.
  const inner = chipInner(height)
  const mainStyle =
    paddingX === undefined ? inner : {...inner, paddingLeft: paddingX, paddingRight: CHEVRON_INSET}
  const crossStyle =
    paddingX === undefined ? inner : {...inner, paddingLeft: paddingX, paddingRight: paddingX}
  return (
    // UI-CONSISTENCY section 2: 25px including the 1px border, so the buttons inside are 23px.
    <Card
      border
      data-testid={testId}
      radius={CHIP_SHAPE === 'round' ? 'full' : 2}
      ref={captureEl}
      style={{height, overflow: 'hidden'}}
    >
      <Flex align="center">
        <Button
          aria-label={accessibleName}
          icon={icon}
          iconRight={ChevronDownIcon}
          mode="bleed"
          onClick={onOpen}
          style={mainStyle}
          text={text}
          tooltipProps={null}
        />
        <div className={SegmentDivider} />
        <Button
          aria-label={removeLabel}
          data-testid={removeTestId}
          icon={CloseIcon}
          mode="bleed"
          onClick={onRemove}
          style={crossStyle}
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
/** The shell of the row: a card under the navbar, or (navLayout C) a plain inline group inside the navbar. */
function RowShell(props: {inline: boolean; children: React.ReactNode}) {
  if (props.inline)
    return (
      <div
        data-testid="address-row-inline"
        style={{alignItems: 'center', display: 'flex', minWidth: 0}}
      >
        {props.children}
      </div>
    )
  return (
    <Card borderBottom data-testid="address-row" paddingX={3} paddingY={2}>
      {props.children}
    </Card>
  )
}

export function AddressRow({inline = false}: {inline?: boolean} = {}) {
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
  const {stage, rowLayout: rowLayoutOption} = useOptionState()
  // navLayout C puts the whole perspective in the navbar: left aligned, no width cap, no Showing label and no action group (Add dimension lives in the menu).
  const rowLayout = inline ? 'left' : rowLayoutOption
  const rowWidth = useOption('rowWidth')
  const maxWidth = rowWidth === 'a' ? undefined : rowWidth === 'c' ? 880 : 1200
  const openBeta = stage === 'open-beta'
  const only = dimensions[0]

  // The extra menu row ("Add a dimension…" or "View as…") raises the pending chip; its picker opens on it.
  useEffect(() => {
    // Deferred one tick: the menu row sets `pending` in the shared state, and this row follows it with its own picker state.
    const id = window.setTimeout(() => {
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
    }, 0)
    return () => window.clearTimeout(id)
  }, [pendingEl, addEl, openBeta, s])

  // LIVE: the fixture's `world.variantsEnabled` is gone; the host only mounts this row when the design is on.
  if (!s.rowShown && !inline) return null

  const close = () => setOpen(false)
  const remove = (name: string) => {
    const next = {...chosen}
    delete next[name]
    s.setChosen(next)
  }
  return (
    <RowShell inline={inline}>
      <Flex
        align="center"
        data-layout={rowLayout}
        data-testid="address-row-layout"
        gap={2}
        style={{
          ...(rowLayout === 'centered'
            ? {display: 'grid', gridTemplateColumns: '1fr auto 1fr'}
            : null),
          marginInline: inline ? undefined : 'auto',
          maxWidth: inline ? undefined : maxWidth,
        }}
        wrap="wrap"
      >
        {rowLayout === 'centered' ? <div /> : null}
        <Flex
          align="center"
          data-testid="address-row-group"
          gap={2}
          style={{flex: rowLayout === 'actionsRight' ? 1 : undefined}}
          wrap="wrap"
        >
          {inline ? null : (
            <Text muted size={1}>
              Showing
            </Text>
          )}
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
                  const el = document.querySelector<HTMLElement>(`[data-testid="chip-${d.name}"]`)
                  // A second click on the chip that opened the picker closes it, like the Drafts pill.
                  if (open && anchor === el) return close()
                  setAnchor(el)
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
                    if (open && anchor === addEl) return close()
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
                if (open && anchor === pendingEl) return close()
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
              captureEl={setPendingEl}
              testId="chip-pending"
              text="Pick a dimension"
            />
          ) : null}
        </Flex>
        {inline ? null : (
          <Flex
            align="center"
            data-testid="address-row-actions"
            gap={2}
            justify="flex-end"
            style={{marginLeft: rowLayout === 'actionsRight' ? 'auto' : undefined}}
          >
            {!openBeta && !s.pending ? (
              <div ref={setAddEl}>
                <Button
                  data-testid="row-add"
                  disabled={allSet}
                  icon={AddIcon}
                  mode="bleed"
                  onClick={() => {
                    // Add dimension raises the pending chip and its picker; a second click takes both away again.
                    if (s.pending) {
                      s.setPending(false)
                      close()
                    } else s.setPending(true)
                  }}
                  text="Add dimension"
                  tooltipProps={null}
                />
              </div>
            ) : null}
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
        )}
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
    </RowShell>
  )
}
