import {useState} from 'react'
import {useSetVariant} from 'sanity'

import {useOption} from '../options/store'
import {type Chosen} from './model'
import {Picker} from './Picker'
import {usePerspectiveState} from './state'
import {DimensionButton} from './StateMenu'
import {useVariantDefinitions} from './world'
import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {CONTROL_SHAPE, variantsLabel} from './Controls'

/**
 * The C1 dimension control inside the Presentation preview header (through the PROPOSED
 * `PreviewHeaderExtensionProvider`). Choosing a value sets the router's variant param, which the preview reads, and the
 * same chosen values as the rest of the C1 design. Shown for C1 A and B (A's row does not exist in Presentation, so
 * both use the Variants-button panel there).
 */
export function PresentationVariantControl() {
  const option = useOption('c1')
  const s = usePerspectiveState()
  const setVariant = useSetVariant()
  const definitions = useVariantDefinitions()
  const [el, setEl] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  if (option !== 'a' && option !== 'b') return null

  const apply = (next: Chosen) => {
    s.setChosen(next)
    const entries = Object.entries(next)
    const exact = entries.length
      ? definitions.find((v) => {
          const own = Object.entries(v.conditions)
          return own.length === entries.length && own.every(([name, key]) => next[name] === key)
        })
      : undefined
    setVariant({variantId: exact?._id as never})
  }

  return (
    <div ref={setEl}>
      <DimensionButton
        aria-expanded={open}
        icon={<RhombusIcon />}
        onClick={() => setOpen(!open)}
        open={open}
        shape={CONTROL_SHAPE}
        testId="presentation-variants-button"
        text={variantsLabel(s.valueTitles)}
      />
      <Picker
        anchor={el}
        chosen={s.chosen}
        dimensions={s.dimensions}
        onClear={() => apply({})}
        onClose={() => setOpen(false)}
        onPick={(dimension, key) => {
          const next = {...s.chosen}
          if (key === null) delete next[dimension]
          else next[dimension] = key
          apply(next)
          setOpen(false)
        }}
        open={open}
        placement="bottom-end"
        testId="presentation-variants-panel"
      />
    </div>
  )
}
