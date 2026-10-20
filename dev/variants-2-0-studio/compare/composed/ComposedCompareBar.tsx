// Adapter for the studio: mounts the ported Storybook `ComposedAddressBar` (./composedAddress.tsx) on the studio's own address
// model, with no Storybook in the way. New in this repo (no Storybook source). The mapping lives in ./composedModel.ts (pure,
// checked by journeys/verify-composed-model.mts); this file only wires it to React.
//
//   <ComposedCompareBar
//     anchor={{bundle: 'drafts', values: {audience: 'members'}}}      // the Showing side
//     counterpart={{bundle: 'published', values: {audience: 'members'}}}  // the Against side, when comparing
//     facets={facets} variants={definitions} bundles={[{id: 'drafts', label: 'Draft'}, ...]}
//     onAnchorChange={...} onCounterpartChange={...} layout="tiers" maxCompared={1} onRefuse={toast} />
import {useCallback, useMemo} from 'react'

import {VARIANT_DOCUMENTS_PATH} from '../../../../packages/sanity/src/core/variants/store/constants'
import {type ConditionFacet} from '../../../../packages/sanity/src/core/variants/tool/util'
import {type SystemVariant} from '../../../../packages/sanity/src/core/variants/types'
import {ComposedAddressBar, LADDER, type StructuralAxis} from './composedAddress'
import {
  BUNDLE_KEY,
  type BundleOption,
  DEFAULT_BUNDLES,
  fromBar,
  shortVariantId,
  type Side,
  toBar,
  type VariantDefinition,
} from './composedModel'

export type {BundleOption, Side, VariantDefinition} from './composedModel'

/** A variant definition as the dataset holds it. Only `_id` and `conditions` are required; `metadata.title` labels a value. */
export interface CompareBarVariant extends VariantDefinition {
  priority?: number
  metadata?: {title?: string}
}

export interface ComposedCompareBarProps {
  /** One facet per condition key with its values (`buildConditionFacets(variants)` from core, or any `{key, values[]}[]`). */
  facets: ConditionFacet[]
  /** The variant definitions, for value titles. A single-condition definition's title becomes the label of its value. */
  variants: CompareBarVariant[]
  /** The side being shown: a bundle id (`published`, `drafts` or a release id) and a value per condition key. */
  anchor: Side
  /** The side compared against. Omit when not comparing. */
  counterpart?: Side
  onAnchorChange: (next: Side) => void
  /** Called with the new Against side, or `undefined` when the comparison is cleared. */
  onCounterpartChange: (next: Side | undefined) => void
  /** The bundles on offer: Draft, Published and the active releases. Defaults to Draft and Published. */
  bundles?: BundleOption[]
  layout: 'inline' | 'tiers'
  reserveSecondRow?: boolean
  rowLabel?: boolean
  clearable?: boolean
  comparable?: boolean
  /** Cap on compared keys. Open beta: `1`. Default unlimited. */
  maxCompared?: number
  onRefuse?: (reason: string) => void
  rung?: number
  onRung?: (n: number) => void
  /** Namespaces the test ids when several bars share a page. */
  instanceId?: string
}

const byKey = (a: [string, string], b: [string, string]) => a[0].localeCompare(b[0])

const sameSide = (a: Side | undefined, b: Side | undefined) =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.bundle === b.bundle &&
    JSON.stringify(Object.entries(a.values).sort(byKey)) ===
      JSON.stringify(Object.entries(b.values).sort(byKey)))

export function ComposedCompareBar(props: ComposedCompareBarProps) {
  const {
    facets,
    variants,
    anchor,
    counterpart,
    onAnchorChange,
    onCounterpartChange,
    bundles = DEFAULT_BUNDLES,
    layout,
    reserveSecondRow,
    rowLabel,
    clearable,
    comparable,
    maxCompared,
    onRefuse,
    rung,
    onRung,
    instanceId,
  } = props

  const values = useMemo(() => toBar(anchor, counterpart, bundles), [anchor, counterpart, bundles])

  const structuralAxes = useMemo<StructuralAxis[]>(
    () => [
      {
        key: BUNDLE_KEY,
        label: 'Bundle',
        values: bundles.map((bundle) => bundle.label),
        versionIds: Object.fromEntries(bundles.map((bundle) => [bundle.label, bundle.id])),
      },
    ],
    [bundles],
  )

  // The bar types a definition as the core `SystemVariant` document; the studio holds the three fields it reads.
  const barVariants = useMemo<SystemVariant[]>(
    () =>
      variants.map((variant) => ({
        _type: 'system.variant',
        _createdAt: '',
        _updatedAt: '',
        _rev: '',
        priority: 0,
        ...variant,
        _id: `${VARIANT_DOCUMENTS_PATH}.${shortVariantId(variant._id)}`,
      })),
    [variants],
  )

  const onChange = useCallback(
    (next: Record<string, string[]>) => {
      const read = fromBar(next, bundles)
      if (!sameSide(read.anchor, anchor)) onAnchorChange(read.anchor)
      if (!sameSide(read.counterpart, counterpart)) onCounterpartChange(read.counterpart)
    },
    [anchor, bundles, counterpart, onAnchorChange, onCounterpartChange],
  )

  return (
    <ComposedAddressBar
      address={values}
      affordance="AC"
      clearable={clearable}
      comparable={comparable}
      facets={facets}
      instanceId={instanceId}
      layout={layout}
      maxCompared={maxCompared}
      mode="composed"
      onChange={onChange}
      onRefuse={onRefuse}
      onRung={onRung ? (next) => onRung(LADDER.indexOf(next)) : undefined}
      reserveSecondRow={reserveSecondRow}
      rowLabel={rowLabel}
      rung={rung === undefined ? undefined : LADDER[rung]}
      sentence={false}
      structuralAxes={structuralAxes}
      variants={barVariants}
    />
  )
}
