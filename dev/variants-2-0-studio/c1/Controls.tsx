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
 * Option A's pill-click rule is still Faheem's call. The Figma agent's lean, implemented here: the pill ALWAYS opens
 * the menu, and the menu holds "Narrow by dimension…", "Show the variants row" and "Hide the variants row". The
 * Storybook exploration's rule (a click on the pill minimises the row when a variant is set) is not implemented,
 * because the real pill belongs to stock Studio's navbar.
 */
export const PILL_ALWAYS_OPENS_MENU = true

/**
 * C1 OPTION A (one control): the stock version pill, extended through the PROPOSED `PerspectiveMenuExtensionProvider`.
 * Its menu gains the row actions, and the pill shows the chosen values after "Drafts".
 * Must be a stable function: the Studio calls it as a hook.
 */
export function useOptionAExtension(): PerspectiveMenuExtension | undefined {
  const option = useOption('c1')
  const s = usePerspectiveState()
  if (option !== 'a') return undefined

  const narrowed = Object.keys(s.chosen).length > 0
  const text = s.rowShown ? 'Hide the variants row' : narrowed ? 'Show the variants row' : 'Narrow by dimension…'
  return {
    extraRows: (
      <MenuItem
        data-testid="narrow-by-dimension"
        icon={RhombusIcon}
        onClick={() => {
          if (s.rowShown) {
            s.setRowShown(false)
            return
          }
          s.setRowShown(true)
          if (!narrowed) s.setPending(true)
        }}
        text={text}
      />
    ),
    labelSuffix: s.valueTitles.length ? (
      <Text data-testid="pill-values" muted size={1} style={{marginLeft: -4, whiteSpace: 'nowrap'}}>
        , {s.valueTitles.join(', ')}
      </Text>
    ) : null,
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
