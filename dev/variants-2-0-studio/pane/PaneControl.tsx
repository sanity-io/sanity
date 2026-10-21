import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {useMemo, useState} from 'react'
import {ReleaseAvatarIcon} from 'sanity'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {type Chosen, type DimensionSpec} from '../c1/model'
import {Picker} from '../c1/Picker'
import {useDimensions, useVariantDefinitions} from '../c1/world'
import {
  valuesForVariant,
  variantForValues,
  type VariantDefinition,
} from '../compare/composed/composedModel'
import {useVersionList} from '../data/useVersionList'
import {layerLabel, usePaneAddress} from './PaneAddress'

// Option `paneControl` (E9, Figma E10 D1 455:3372 Follows global, D2 455:4558 column menu scoped to the pane, D3 455:6226 Local).
// A pane's own control for its local perspective: one chip in the pane header. Not held: "Follows global" (D1). Held: the pane's address
// (D3). Click opens the SAME column picker as the global bar (D2), scoped to this pane; its Clear is "Follow global perspective".
// The state is the pane params `localPerspective` and `localVariant` (core: DocumentPerspectiveProvider, PROPOSED), as the local row.

const LAYER = 'layer'
const NONE = 'none'

export function PaneControl(props: {documentId: string}) {
  const {held, local, differs, set} = usePaneAddress()
  const versions = useVersionList(props.documentId)
  const definitions = useVariantDefinitions()
  // The same dimensions the global bar offers (the stage and the Config limit apply), plus the layer.
  const variantDimensions = useDimensions()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const dimensions = useMemo<DimensionSpec[]>(() => {
    const releases = [
      ...new Map(
        (versions ?? [])
          .filter(
            (v) =>
              v.bundleId && v.bundleId !== 'drafts' && v.bundleId !== 'published' && !v.variantId,
          )
          .map((v) => [v.bundleId as string, v.release ?? (v.bundleId as string)]),
      ).entries(),
    ]
    const layer: DimensionSpec = {
      name: LAYER,
      title: 'Version',
      values: [['published', 'Published'], ['drafts', 'Drafts'], ...releases],
    }
    return [layer, ...variantDimensions]
  }, [versions, variantDimensions])

  const defs: VariantDefinition[] = definitions.map((d) => ({_id: d._id, conditions: d.conditions}))
  const values = valuesForVariant(local.variant, defs)
  const chosen: Chosen = {[LAYER]: local.perspective, ...values}

  const variantTitle =
    local.variant === NONE
      ? null
      : (definitions.find((d) => d._id.replace(/^_\.variants\./, '') === local.variant)?.metadata
          ?.title ?? local.variant)
  const text = held
    ? `Local · ${layerLabel(local.perspective)}${variantTitle ? ` · ${variantTitle}` : ''}`
    : 'Follows global'

  return (
    <>
      <span ref={setAnchor} style={{display: 'inline-flex'}}>
        <Chip
          data-differs={differs ? '' : undefined}
          data-held={held ? '' : undefined}
          data-testid="pane-control"
          icon={
            held ? (
              <ReleaseAvatarIcon
                release={local.perspective === 'published' ? 'published' : 'drafts'}
              />
            ) : undefined
          }
          iconRight={ChevronDownIcon}
          mode={held ? 'default' : 'ghost'}
          onClick={() => setOpen((o) => !o)}
          tone={differs ? 'caution' : undefined}
          selected={open}
          text={text}
        />
      </span>
      <Picker
        anchor={anchor}
        chosen={chosen}
        dimensions={dimensions}
        onClear={() => {
          set(null)
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
        onPick={(dimension, key) => {
          if (dimension === LAYER) {
            set({...local, perspective: key ?? 'drafts'})
            return
          }
          const next = {...values}
          if (key === null) delete next[dimension]
          else next[dimension] = key
          // A set of values no single definition matches is a composite; the pane then keeps only the value just picked.
          const variant =
            variantForValues(next, defs) ??
            variantForValues(key === null ? {} : {[dimension]: key}, defs)
          set({...local, variant: variant ?? NONE})
        }}
        open={open}
        placement="bottom-end"
        testId="pane-control-picker"
      />
    </>
  )
}
