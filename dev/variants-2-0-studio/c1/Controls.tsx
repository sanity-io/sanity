import {type PerspectiveMenuExtension} from 'sanity'
import {useState} from 'react'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Flex, Text} from '@sanity/ui'

import {STOCK_OPTION, useOption} from '../options/store'
import {Picker} from './Picker'
import {usePerspectiveState} from './state'
import {DimensionButton} from './StateMenu'

/**
 * The names that fit the control (about 200px of label), else "N variants".
 * (Storybook exploration, perspective/TopRight.tsx @ 2700f4cf07.)
 */
export const FIT_CHARS = 26
export function variantsLabel(titles: string[]): string {
  if (!titles.length) return 'Variants'
  const names = titles.join(', ')
  return names.length <= FIT_CHARS ? names : `${titles.length} variants`
}

/**
 * Option A's pill rules. RULE v2 (Faheem, via the Figma agent): with nothing set the stock pill is unchanged, the
 * chevron opens the version menu, and the extra row (first in the list's bottom card) opens the composed-address row
 * and the panel. With something set, clicking the LABEL (the summary, e.g. "Drafts, Returning visitors") shows or
 * hides the row, and the chevron still opens the version menu. Version stays one click; show/hide is one click and
 * never a menu item.
 * Set to false to compare with the earlier rule: no label toggle, and the menu carries "Show / Hide the variants row".
 */
export const PILL_LABEL_TOGGLES_ROW = true

/**
 * Copy of the extra row. Alternatives the Figma agent listed: 'View as…', 'Variants…', 'Choose dimensions…'.
 * (The earlier wording was 'Narrow by dimension…'.)
 */
export const ADD_DIMENSION_COPY = 'Add a dimension…'

/**
 * Kept from the earlier rule: the pill ALWAYS opens the menu on its chevron. The Storybook exploration's rule (a
 * click on the pill minimises the row) is not implemented, because the real pill belongs to stock Studio's navbar.
 */
export const PILL_ALWAYS_OPENS_MENU = true

/**
 * C1 OPTION A (one control): the stock version pill, extended through the PROPOSED `PerspectiveMenuExtensionProvider`.
 * Its menu gains the first row of the bottom card, and the pill shows the chosen values after "Drafts".
 * Must be a stable function: the Studio calls it as a hook.
 */
export function useOptionAExtension(): PerspectiveMenuExtension | undefined {
  const option = useOption('c1')
  const s = usePerspectiveState()
  if (option !== 'a') return undefined

  const narrowed = Object.keys(s.chosen).length > 0
  const addDimension = () => {
    s.setRowShown(true)
    s.setPending(true)
  }
  const toggleRow = () => {
    if (s.rowShown) s.setRowShown(false)
    else s.setRowShown(true)
  }

  const rows = PILL_LABEL_TOGGLES_ROW ? (
    <MenuItem data-testid="add-dimension" icon={RhombusIcon} onClick={addDimension} text={ADD_DIMENSION_COPY} />
  ) : (
    // The earlier rule: one row that adds, or shows or hides the row.
    <MenuItem
      data-testid="narrow-by-dimension"
      icon={RhombusIcon}
      onClick={() => (s.rowShown ? s.setRowShown(false) : narrowed ? s.setRowShown(true) : addDimension())}
      text={s.rowShown ? 'Hide the variants row' : narrowed ? 'Show the variants row' : ADD_DIMENSION_COPY}
    />
  )

  return {
    extraRows: rows,
    labelSuffix: s.valueTitles.length ? (
      <Text data-testid="pill-values" muted size={1} style={{marginLeft: -4, whiteSpace: 'nowrap'}}>
        , {s.valueTitles.join(', ')}
      </Text>
    ) : null,
    // Only once something is set does the label do anything.
    ...(PILL_LABEL_TOGGLES_ROW && narrowed
      ? {
          onLabelClick: toggleRow,
          labelExpanded: s.rowShown,
          labelTitle: s.rowShown ? 'Hide the variants row' : 'Show the variants row',
        }
      : {}),
  }
}

/**
 * C1 OPTION B (two controls): the stock state pill stays where it is; this is the second one, "Variants", added
 * through the navbar's own `__internal_actions` slot (location topbar). The chevron shows or hides the row once
 * something is chosen; before that it opens the panel.
 */
export function VariantsControl() {
  const option = useOption('c1')
  const s = usePerspectiveState()
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null)
  const [panel, setPanel] = useState(false)
  if (option !== 'b') return null

  const narrowed = Object.keys(s.chosen).length > 0
  return (
    <Flex align="center" gap={2}>
      <div ref={setPanelEl}>
        <DimensionButton
          aria-expanded={narrowed ? s.rowShown : panel}
          icon={<RhombusIcon />}
          onClick={() => (narrowed ? s.setRowShown(!s.rowShown) : setPanel(!panel))}
          open={narrowed && s.rowShown}
          testId="variants-button"
          text={variantsLabel(s.valueTitles)}
        />
      </div>
      <Picker
        anchor={panelEl}
        chosen={s.chosen}
        dimensions={s.dimensions}
        onClear={() => s.setChosen({})}
        onClose={() => setPanel(false)}
        onPick={(dimension, key) => {
          const next = {...s.chosen}
          if (key === null) delete next[dimension]
          else next[dimension] = key
          s.setChosen(next)
          setPanel(false)
        }}
        open={panel && !narrowed}
        placement="bottom-end"
        testId="variants-panel"
      />
    </Flex>
  )
}

export {STOCK_OPTION}
