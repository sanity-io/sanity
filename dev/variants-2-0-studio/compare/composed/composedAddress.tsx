import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ClockIcon} from '@sanity/icons/Clock'
import {CloseIcon} from '@sanity/icons/Close'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {EditIcon} from '@sanity/icons/Edit'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PublishIcon} from '@sanity/icons/Publish'
import {SearchIcon} from '@sanity/icons/Search'
import {TransferIcon} from '@sanity/icons/Transfer'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {
  type CSSProperties,
  type ComponentType,
  createContext,
  Fragment,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook-variants-2-0, branch
// explorations/variants-2-0, commit 0c9f1e058e, lib/explorations/comparison-surfaces/composedAddress.tsx).
// Changes: see ./README.md. In short: imports point at this monorepo and the studio's c1/ pieces; the fixture world is
// replaced by props (`fallbackVariants` only when none are passed); the bundle axis takes its values from a prop
// (`structuralAxes`) instead of the fixed four; `maxCompared` and `onRefuse` cap compared keys; the Storybook shape token
// is the CSS variable `--v2-pill-radius`. Everything else is verbatim.
import {RhombusIcon} from '../../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {AnimatedTextWidth} from '../../../../packages/sanity/src/core/perspective/navbar/AnimatedTextWidth'
import {ReleaseAvatarIcon} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {PerspectiveFilter} from '../../../../packages/sanity/src/core/variants/plugin/components/PerspectiveFilter'
import {
  buildConditionFacets,
  type ConditionFacet,
} from '../../../../packages/sanity/src/core/variants/tool/util'
import {type SystemVariant} from '../../../../packages/sanity/src/core/variants/types'
// The studio's own wrappers, not raw `@sanity/ui`: these enforce popover animation, button
// tooltip consistency and the size vocabulary the rest of Studio uses.
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Popover} from '../../../../packages/sanity/src/ui-components/popover/Popover'
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {DimensionIcon} from '../../c1/dimensionIcons'
import {VersionGlyph} from '../../c1/StateMenu'
import {type Affordance, AffordanceValueList, COMPARE_ACTION_WIDTH} from './addressAffordance'
import {axisIcon} from './axisIcons'
import {candidateLayerCount, fallbackVariants, RESOLUTION_LIMITS} from './comparisonFixtures'
import {chipHeightFor, useCsChrome, useRowActionMode} from './csChrome'

/** The shape token (options/ShapeStyles.tsx, options/registry.ts): the Design options window sets `--v2-pill-radius`. Round = 999px. */
const PILL_RADIUS = 'var(--v2-pill-radius, 999px)'

/**
 * The COMPOSED address: one control, two renderings.
 *
 * ## Why this file exists beside `comparisonAddress.tsx`
 *
 * That file models an address as `Record<string, string>` — one value per axis, one chip per axis,
 * every chip always rendered. That is correct for a world where a variant definition carries every
 * condition, which is the world Studio ships as of 2026-08-27.
 *
 * It is wrong for the world this design targets. There, a definition carries ONE condition and a
 * document references several (`_system.variants[]`), so:
 *
 * - the address is assembled from parts, and the composed point has **no title**, because its
 *   reference deliberately does not resolve to a document
 * - a condition key carries one value, or **two** when it is the axis being compared (D18, reversed
 *   2026-08-27), so a chip renders either a coordinate or `anchor ⇄ counterpart`
 * - the number of chips is unbounded, so they cannot all always render
 * - most addresses have **no document behind them**, because n definitions produce 2ⁿ−1 layers
 *
 * Full mechanism: `docs/initiatives/content-variants/EXPLAINER-variant-resolution.md`.
 * Decisions: `STAGE-1-compare-versions.md` §10b.
 *
 * ## The two renderings, and why both exist
 *
 * ```
 *   'single'                                'composed'
 *   ────────                                ──────────
 *   Version [Draft ▾]  Variant [Nordics ▾]  [＋ Add] │ ⛭Market: DACH ✕ │ ⌘Locale: de-DE ✕ │ ⋯2
 *
 *   what Studio ships today, exactly         what the target state needs
 * ```
 *
 * 🔴 **`single` is not a fallback, it is the argument.** The engineer who reviews this work argued
 * against a data model that looks composable but never composes, comparing it to `slug.current`.
 * That argument lands on a CONTROL too. The defence is that with one value per axis this renders as
 * the two-filter bar Studio already has, visibly and not merely in principle. So `single` is built
 * from the same `PerspectiveFilter` the shipped `VariantsStudioNavbar` uses, with the same prefixes.
 *
 * ## What is real here and what is not
 *
 * REAL, imported rather than reimplemented:
 * - `buildConditionFacets` — derives one facet per condition key from the definitions. Shipped, used
 *   by the variants tool overview
 * - `getVariantConditionIcon` — 30 dimension keys to glyphs, with a neutral fallback for anything
 *   else. Shipped. Reached through `axisIcon` in `lib/axisIcons.ts`, which fills the gaps the
 *   shipped map leaves and cannot change an answer the shipped map gives
 * - `PerspectiveFilter` — the labelled chip the perspective bar is made of. Shipped
 * - the two-pane add menu, and the measure-then-collapse overflow behaviour, are both modelled on
 *   the shipped `VariantConditionFilters`
 *
 * ENVISIONED: composing an address out of facets, the ceiling warning, and the empty-address state.
 * Nothing in Studio does any of these.
 */

// --- the address -------------------------------------------------------------------------------

/**
 * An address, as a value per condition key.
 *
 * 🔴 **The invariant, per D18 as reversed 2026-08-27.** A key holds **one** value, shared by both
 * sides of a comparison — or **two**, which are the anchor and the counterpart. Never more.
 *
 * ```
 *   locale       de-DE  ⇄  fr-FR        ← compared: [anchor, counterpart]
 *   audience     subscriber             ← shared: [one value]
 *   channel      web                    ← shared: [one value]
 *
 *   side one  (de-DE, subscriber, web)      side two  (fr-FR, subscriber, web)
 * ```
 *
 * Any number of keys may hold two. That is D12's *"comparing across both"* and it is still **two**
 * addresses, never four: the pairing is positional, so side one takes every anchor and side two
 * takes every counterpart.
 *
 * It stays an array rather than becoming `string | [string, string]` because the compared axis is
 * genuinely a pair and index carries the role. What changed is the CEILING, from unbounded to two,
 * and the meaning of position, from insertion order to anchor-then-counterpart.
 *
 * ⚠️ Why the earlier version allowed a list, so the reasoning is not repeated: it cited the shipped
 * `VariantConditionFilters`, which multi-selects within one facet. That control is a **filter**, and
 * a filter legitimately takes a set — *every definition matching de-DE or de-AT*. An address must be
 * a **point**, because a comparison is two points. Same control shape, different job.
 *
 * A union on one axis is almost always a missing level of hierarchy: `locale: de` already serves
 * de-DE, de-AT and de-CH through the specificity search. Full reasoning and the minority case in
 * `STAGE-1-compare-versions.md` §D18.
 */
export type ComposedValues = Record<string, string[]>

/**
 * Namespace a test id by bar instance.
 *
 * 🔴 **The bar was written as a singleton and a rack instantiates N of it.** Measured on the
 * three-pane story with the global bar shown — four bars on one page — **60 test ids appeared four
 * times each**: `chip-zone`, `composed-add-dimension`, `chip-trigger-locale`, every
 * `aff-AC-chip-pane-locale-row-*`, all of it.
 *
 * That is not cosmetic. It is the same fault `AffordanceValueListProps.idPrefix` was added to fix one
 * level down, arriving one level up: a probe clicking `composed-add-dimension` lands on whichever the
 * DOM returns first, so **the pane bars are unreachable to the gates** and a passing check would be
 * checking the global bar three extra times.
 *
 * ⚠️ No duplicate DOM `id`s, checked separately — `@sanity/ui` generates those. So nothing is broken for
 * a user today, which is exactly why it would have shipped.
 *
 * `undefined` yields the bare id, so every existing story, gate and probe is untouched.
 */
function namespaced(instanceId: string | undefined) {
  return (id: string) => (instanceId ? `${instanceId}-${id}` : id)
}

/** The two roles a value can hold on a key. Index 0 is the anchor, index 1 the counterpart. */
export const ANCHOR = 0
export const COUNTERPART = 1

/** Whether a key is being compared, which is the only reason it holds two values. */
export function isCompared(values: string[] | undefined): boolean {
  return (values?.length ?? 0) === 2
}

/**
 * How many variant DEFINITIONS one SIDE of a comparison references, which is what drives the 2ⁿ−1
 * layer count.
 *
 * ⚠️ Structural axes are excluded, and this is a correctness point rather than tidiness. Publication
 * and release are not variant definitions: they select which bundle to read, they do not enter the
 * specificity search the backend performs over matching definitions. Counting them would inflate
 * the layer count and trip the ceiling warning on an address with no variants in it at all.
 *
 * 🔴 Counts **keys, not values**, which is a correctness fix from the D18 reversal. An earlier
 * version summed values, so opening a comparison on one axis appeared to add a definition and
 * inflated the layer count on every comparison. It does not: both sides carry the same coordinates
 * and differ only in which value sits on the compared key. So a compared pair costs `2 × (2ⁿ−1)`,
 * not `2ⁿ⁺¹−1`, and this function reports the per-side `n`.
 */
export function definitionCount(address: ComposedValues): number {
  return Object.keys(address).filter(
    (key) => !STRUCTURAL_KEYS.has(key) && (address[key]?.length ?? 0) > 0,
  ).length
}

/** How many sides the address describes: two when anything is compared, otherwise one. */
export function sideCount(address: ComposedValues): 1 | 2 {
  return Object.values(address).some((values) => values.length === 2) ? 2 : 1
}

/**
 * Where an address sits against the resolution ceiling.
 *
 * `layers` is 2ⁿ−1, so each definition added roughly DOUBLES it. That is why this cannot be a
 * linear meter: the step from five to six axes is bigger than the step from one to five.
 */
export interface CeilingState {
  definitions: number
  /** 2 while anything is compared, because both sides resolve. A multiplier, not a definition. */
  sides: 1 | 2
  layers: number
  limit: number
  /** Fraction of the ceiling used, clamped to 1. For a visual, not for a decision. */
  ratio: number
  /** Past this, the interface says something. Below it, it stays quiet. */
  near: boolean
  /** Adding one more definition would cross the ceiling. */
  full: boolean
}

export function ceilingFor(address: ComposedValues): CeilingState {
  const definitions = definitionCount(address)
  // 🔴 A comparison resolves BOTH sides, so it does twice the work at the same `n`. Wired in from the
  // D18 reversal: the count is over keys, and the pair is a multiplier on the outside rather than an
  // extra definition on the inside. `2 × (2ⁿ−1)`, not `2ⁿ⁺¹−1`.
  //
  // It matters because the two are not the same number and one of them is wrong:
  //
  //   n = 4, comparing     2 × 15 = 30      what actually resolves
  //                        2⁵ − 1 = 31      what summing values reported
  //
  // Close at four, and they diverge as n grows. More importantly the OLD version attributed the cost
  // to the wrong thing, so removing a dimension looked like it would help as much as stopping the
  // comparison, and it does not.
  const sides = sideCount(address)
  const layers = sides * candidateLayerCount(definitions)
  const limit = RESOLUTION_LIMITS.totalPermutations
  const nextLayers = sides * candidateLayerCount(definitions + 1)

  return {
    definitions,
    sides,
    layers,
    limit,
    ratio: Math.min(1, layers / limit),
    // ⚠️ Count STEPS REMAINING, not proportion used.
    //
    // The obvious threshold is "past half the ceiling", and it does not work here. Because the
    // count doubles, being at half the ceiling means being exactly ONE step from exceeding it, so a
    // proportional warning and the refusal arrive together and the warning is never seen on its own:
    //
    //   4 dimensions   15 of 63    24%  ← proportionally comfortable
    //   5 dimensions   31 of 63    49%  ← still under half
    //   6 dimensions   63 of 63   100%  ← at the ceiling, from "under half", in one click
    //
    // So `near` asks a different question: would TWO more dimensions exceed the limit? That gives a
    // real intermediate state one step before the refusal, which is the only place a warning can do
    // any good.
    near: sides * candidateLayerCount(definitions + 2) > limit,
    full: nextLayers > limit,
  }
}

/**
 * Move where you are on one key.
 *
 * Replaces the old `toggleValue`, which appended and so could grow a key without limit. Under D18
 * there is no state to toggle INTO: a value is either where you are, or what you are compared
 * against, and those are set by different actions.
 */
export function setAnchorAt(address: ComposedValues, key: string, value: string): ComposedValues {
  const current = address[key] ?? []
  const counterpart = current[COUNTERPART]
  const updated = {...address}
  // Moving ONTO the counterpart collapses the comparison rather than swapping, so one click never
  // both moves you and silently keeps a comparison you no longer asked for.
  updated[key] = counterpart && counterpart !== value ? [value, counterpart] : [value]
  return updated
}

/** Set, clear, or refuse a counterpart on one key. A value cannot be compared with itself. */
export function setCounterpartAt(
  address: ComposedValues,
  key: string,
  value: string,
): ComposedValues {
  const current = address[key] ?? []
  const anchor = current[ANCHOR]
  const updated = {...address}
  if (!anchor) {
    updated[key] = [value]
  } else if (anchor === value || current[COUNTERPART] === value) {
    updated[key] = [anchor]
  } else {
    updated[key] = [anchor, value]
  }
  return updated
}

/** Drop a key from the address entirely. Structural keys cannot be dropped; the caller enforces it. */
export function removeKey(address: ComposedValues, key: string): ComposedValues {
  const updated = {...address}
  delete updated[key]
  return updated
}

// --- facets, derived from the definitions ------------------------------------------------------

/**
 * One facet per condition key, read out of the definitions by the shipped function. Nothing in this
 * file lists an audience, a market or a locale: change `comparisonFixtures.ts` and the control
 * changes. That is the executable form of the claim that the axes are the customer's, not ours.
 */
export function useFacets(variants: SystemVariant[] = fallbackVariants): ConditionFacet[] {
  return useMemo(() => buildConditionFacets(variants), [variants])
}

/** ⚠️ Exported for the rack header, which names axes without rendering a chip for them. */
export function facetLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Display labels for condition values, built from the definitions that carry exactly one condition.
 *
 * Worth spelling out, because it is a consequence of the change that is easy to miss. A condition
 * value is an authored slug: `dach`, `de-DE`, `partner-portal`. Today that slug is never shown,
 * because the definition carrying it has a title and the bar shows the title.
 *
 * In the target state a definition carries one condition, so its title becomes, in effect, **the
 * label for that value**: `{conditions: {market: 'dach'}, metadata: {title: 'DACH market'}}`. So the
 * label is available after all, and a chip can read `DACH market` rather than `dach`.
 *
 * The shipped `VariantConditionFilters` shows the raw value, which is correct for a filter over
 * definitions and wrong for an address: a filter says which slug to match, an address says where the
 * reader is standing. Two keys can map to the same slug, so this is keyed `${key}=${value}`.
 *
 * ⚠️ A value only has a label if some definition names exactly it. A composed address can reach
 * combinations no definition covers, and those fall back to the slug. That is not a gap to paper
 * over: it is the same "no title for a composite" property one level down.
 */
export function useValueLabels(variants: SystemVariant[] = fallbackVariants): Map<string, string> {
  return useMemo(() => {
    const labels = new Map<string, string>()
    for (const variant of variants) {
      const conditions = Object.entries(variant.conditions)
      if (conditions.length !== 1) continue
      const title = variant.metadata?.title
      if (!title) continue
      const [key, value] = conditions[0]
      labels.set(`${key}=${value}`, title)
    }
    return labels
  }, [variants])
}

/**
 * The definition whose conditions are exactly this address, if one exists.
 *
 * This is the whole difference between the two states, in one function.
 *
 * In the shipped state an address always names a definition, so there is always a title, and the
 * bar shows it (`getVariantTitle(selectedVariant)`). In the target state an address is usually a
 * COMPOSITION of several definitions, so no single definition matches, so there is no title. The
 * composed reference is deliberately unresolvable: *"having the variant reference not resolve into
 * anything is an ok way of indicating to users the variant is a composite."*
 *
 * Returning `undefined` is therefore not a lookup failure. It is the target state working as
 * designed, and it is why the composed rendering shows values and glyphs rather than a name.
 */
export function definitionTitleFor(
  address: ComposedValues,
  variants: SystemVariant[],
): string | undefined {
  // 🔴 `address` always carries the structural keys (`publication`, `release`) via
  // `initialComposedAddress()`, but no variant definition's `conditions` ever names them. Comparing
  // key counts unfiltered meant `conditions.length !== keys.length` was true for every address, so a
  // match could never be found once structural keys existed — this is what forced the `single`
  // rendering's variantLabel into its "list the values" fallback even for a plain, uncomposed pick.
  const keys = Object.keys(address).filter((key) => !STRUCTURAL_KEYS.has(key))
  // A key carrying two values cannot be one definition, by construction.
  if (keys.some((key) => address[key].length !== 1)) return undefined

  const match = variants.find((variant) => {
    const conditions = Object.entries(variant.conditions)
    if (conditions.length !== keys.length) return false
    return conditions.every(([key, value]) => address[key]?.[0] === value)
  })

  return match?.metadata?.title
}

// --- the add menu ------------------------------------------------------------------------------

/**
 * A single entry point that opens a two-pane menu: dimensions on the left, the chosen dimension's
 * values on the right, both visible at once. Modelled on the shipped `AddFilterMenu`, whose own
 * comment states the reason it exists in this shape:
 *
 * \> "Scales to any number of dimensions without overflowing the lane, unlike a dropdown-per-dimension row."
 *
 * That is the same conclusion the layout review reached independently, which is why the layout work
 * is adaptation rather than invention. What is added here and not in the shipped control: the value
 * pane refuses selection once the address is at the ceiling, and says why.
 */
function AddDimensionMenu({
  facets,
  address,
  ceiling,
  onSetValues,
  valueLabels,
  affordance = 'AC',
  comparable = true,
  instanceId,
  inert = false,
  remembered,
  onToggleAxis,
}: {
  facets: ConditionFacet[]
  address: ComposedValues
  ceiling: CeilingState
  onSetValues: (key: string, next: string[]) => void
  valueLabels: Map<string, string>
  /**
   * The last values each axis held before it was switched off, so switching it back on restores them
   * rather than guessing. See `ComposedAddressBar`.
   */
  remembered: Record<string, RememberedAxis>
  onToggleAxis: (key: string) => void
  /**
   * Renders the button alone, for the invisible copy row two uses to hold the Add column open.
   * Without it the ghost would duplicate `composed-add-dimension`, and a duplicated test id is how
   * three separate measurements went wrong yesterday.
   */
  inert?: boolean
  /**
   * The Add menu has the SAME problem as the structural chips, and Faheem named it separately: a
   * tick cannot express "and compare against this one". So whichever affordance wins has to work
   * here too, on an axis of forty values reached through a search field.
   */
  affordance?: Affordance
  comparable?: boolean
  instanceId?: string
}) {
  const rowActionMode = useRowActionMode()
  const ns = namespaced(instanceId)
  const [open, setOpen] = useState(false)
  const [dimensionKey, setDimensionKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [, setButtonEl] = useState<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setDimensionKey(null)
    setQuery('')
  }, [setOpen, setDimensionKey])

  useDismissOnOutside(open, close)

  // Structural axes have permanent chips, so offering them here would give them two homes.
  const addable = useMemo(() => facets.filter((facet) => !STRUCTURAL_KEYS.has(facet.key)), [facets])

  const activeFacet = addable.find((facet) => facet.key === dimensionKey)

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return addable
    // Match the dimension name OR any of its values, so typing "de-DE" finds the locale axis. The
    // shipped filter menu matches the dimension name only, which means a 40-value locale axis is
    // unreachable by typing the thing you are actually looking for.
    return addable.filter(
      (facet) =>
        facetLabel(facet.key).toLowerCase().includes(needle) ||
        facet.values.some(
          (value) =>
            value.toLowerCase().includes(needle) ||
            (valueLabels.get(`${facet.key}=${value}`) ?? '').toLowerCase().includes(needle),
        ),
    )
  }, [addable, query, valueLabels])

  // Within the chosen dimension, narrow by the same query. A 40-value axis needs this: scrolling
  // 40 rows to find `de-DE` is the case the fixture's locale axis exists to expose.
  const values = useMemo(() => {
    if (!activeFacet) return []
    const needle = query.trim().toLowerCase()
    if (!needle) return activeFacet.values
    const narrowed = activeFacet.values.filter((value) => value.toLowerCase().includes(needle))
    return narrowed.length > 0 ? narrowed : activeFacet.values
  }, [activeFacet, query])

  /**
   * 🔴 THE VALUE PANE HAS ONE WIDTH, MEASURED ACROSS EVERY AXIS.
   *
   * ⚠️ `width: max-content` was worse than the fixed width it replaced. Reported: *"the right column
   * keeps jumping around, so my hover target keeps jumping underneath me."*
   *
   * Which is the same defect as the peek jump and the hover push, arriving a third time by a new
   * route: a control that moves while the reader is aiming at it. Intrinsic width made the popover a
   * function of whichever axis happened to be selected, so `Plan` and `Locale` produced different
   * geometry and switching between them slid the rows sideways.
   *
   *     "I think we should choose stability of the UI surface over optimizing width"
   *
   * Agreed, and it generalises: a surface whose size depends on its content is only stable while its
   * content never changes. So the width is measured ONCE from the widest label across ALL axes, and
   * every axis then renders at that width. Some panes end up wider than they need to be, which is the
   * price and is invisible; nothing moves, which is the point.
   *
   * The two longest labels per axis are measured rather than all of them: within one axis the longest
   * string is almost always the widest, and taking two makes the exception safe without rendering 150
   * hidden strings to find out.
   */
  const widestCandidates = useMemo(
    () =>
      addable.flatMap((facet) =>
        [...facet.values]
          .map((value) => valueLabels.get(`${facet.key}=${value}`) ?? value)
          .sort((a, b) => b.length - a.length)
          .slice(0, 2),
      ),
    [addable, valueLabels],
  )

  const measureRef = useRef<HTMLDivElement | null>(null)
  const [valuePaneWidth, setValuePaneWidth] = useState<number | null>(null)

  useEffect(() => {
    const element = measureRef.current
    // STUDIO: the measuring copy lives in the popover, so there is nothing to measure while it is closed.
    if (!open || !element) return
    const widest = Math.max(
      0,
      ...[...element.children].map((child) =>
        child instanceof HTMLElement ? child.offsetWidth : 0,
      ),
    )
    setValuePaneWidth(Math.ceil(widest) + COMPARE_ACTION_WIDTH + 40)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `widestCandidates` is the trigger: the measuring copy re-renders when the labels change
  }, [widestCandidates, open])

  const content = (
    /*
      Intrinsic width, bounded. The VALUE pane is the part that varies — `Plan` has short names and
      `Locale` has "English (United Kingdom)" — so it is capped rather than free, and floored so the
      popover does not visibly resize each time the reader switches axis. Stability across a switch is
      worth more than tightness on any one axis.
    */
    <Stack gap={0} style={{position: 'relative', width: 'max-content'}}>
      <Box padding={2} style={{borderBottom: '1px solid var(--card-border-color)'}}>
        <TextInput
          fontSize={1}
          icon={SearchIcon}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Find a dimension or a value"
          radius={2}
          value={query}
        />
      </Box>

      {/*
        The hidden block the width is measured from. Absolutely positioned so it cannot affect layout,
        `nowrap` so each candidate reports its true single-line width, and `aria-hidden` because it is
        a ruler rather than content.
      */}
      <Box
        aria-hidden
        ref={measureRef}
        style={{
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {widestCandidates.map((candidate) => (
          <div key={candidate} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
            <Text size={1}>{candidate}</Text>
          </div>
        ))}
      </Box>

      <Flex>
        {/* ⚠️ `max-content`, not a fixed width. *"Let's make the left column a bit more compact... it
            should be just as wide as it needs to be."* It holds six short axis names and their two
            state glyphs, and a fixed 240px was mostly margin. The list of axes does not change, so an
            intrinsic width here is STABLE — it will not jitter as the reader moves around. */}
        <Box
          style={{
            borderRight: '1px solid var(--card-border-color)',
            flex: 'none',
            width: 'max-content',
          }}
        >
          <Stack padding={2} gap={1}>
            {matching.length === 0 ? (
              <Box padding={3}>
                <Text muted size={1}>
                  Nothing matches
                </Text>
              </Box>
            ) : (
              matching.map((facet) => {
                const held = address[facet.key] ?? []
                return (
                  <Flex align="center" gap={1} key={facet.key}>
                    <Box flex={1}>
                      <Button
                        data-testid={ns(`composed-dimension-${facet.key}`)}
                        icon={axisIcon(facet.key)}
                        justify="flex-start"
                        mode="bleed"
                        onClick={() => setDimensionKey(facet.key)}
                        selected={facet.key === dimensionKey}
                        /*
                          ⚠️ `width="fill"`, so the row's highlight spans the pane exactly as the value
                          rows on the right do. Without it a `Button` shrink-wraps its text, so
                          `Audience` and `Channel` got different-sized highlights and the two panes
                          used two different hover shapes. Reported: *"in the right lane all of the
                          blocks get the same width on hover... but on the left column each one gets
                          its own bounding to its text."*

                          🔴 NO COUNT. It used to read `Audience (2)`.

                          *"I don't understand what this number is representing... It's always going
                          to be either one or two, so why does it matter? Maybe we just need to show
                          that there is a comparison on for it."*

                          Exactly right, and the mistake is a modelling one rather than a copy one:
                          under D18 a key holds one value or two, so the count has three possible
                          renderings — absent, 1, 2 — of which only the first and last carry
                          information. It was a BOOLEAN dressed as a number, and a number invites the
                          reader to wonder what 3 would mean.

                          So the same two glyphs the value rows use, meaning the same two things:
                          you are standing somewhere on this axis, and this axis is compared. One
                          vocabulary for both panes rather than two encodings of one fact.
                        */
                        text={facetLabel(facet.key)}
                        width="fill"
                      />
                    </Box>
                    {/*
                      🔴 A TOGGLE, not a state glyph.

                      *"making the left column a toggle makes sense... The closed eye glyph on closed
                      axes could be cool if its persistence is scoped to the last compared value... you
                      want to quickly see what something looks like in a different perspective, but you
                      don't want to have to come and select all of that again."*

                      The memory is what makes this possible, and it dissolves the objection I had to
                      the enable half. Turning a dimension OFF is one unambiguous act; turning it ON
                      needs a value, because an axis in the address must have one — and a control that
                      picks a value for the reader is guessing. Remembering the value they last used is
                      not guessing.

                      ⚠️ It also designs out a defect rather than mitigating one. I had expected the
                      glyph to VANISH when the dimension was removed — the control disappearing under
                      the cursor, which is the family of bug this bar has hit three times. With memory
                      it does not vanish, it FLIPS: open eye becomes closed eye in the same slot.

                      ONE glyph, three readings, and the two open ones stay distinguishable:
                        ⇄        open and compared      click to switch off
                        👁       open                   click to switch off
                        👁-shut  off, with a memory     click to restore what it held
                        (empty)  never opened           nothing to restore; pick a value in the row
                    */}
                    <Flex align="center" justify="center" style={{flex: 'none', width: 28}}>
                      {held.length > 0 ? (
                        <Button
                          data-testid={ns(`composed-toggle-${facet.key}`)}
                          icon={held.length === 2 ? TransferIcon : EyeOpenIcon}
                          mode="bleed"
                          onClick={() => onToggleAxis(facet.key)}
                          tooltipProps={{content: `Switch off ${facetLabel(facet.key)}`}}
                        />
                      ) : (remembered[facet.key]?.values ?? []).length > 0 ? (
                        <Button
                          data-testid={ns(`composed-toggle-${facet.key}`)}
                          /*
                            🔴 NOT `ceiling.full`. A restore is an UNDO, not an addition.
                            The address held this axis a moment ago, so returning to it cannot be
                            refused for want of room — refusing it made every removal one-way and
                            trapped the reader, which is what was reported.
                            The one case still refused: the freed room has since been spent on a
                            different axis, so putting this one back would go somewhere new.
                          */
                          disabled={
                            ceiling.definitions >= (remembered[facet.key]?.dimensionsThen ?? 0)
                          }
                          icon={EyeClosedIcon}
                          mode="bleed"
                          onClick={() => onToggleAxis(facet.key)}
                          tooltipProps={{
                            content:
                              ceiling.definitions >= (remembered[facet.key]?.dimensionsThen ?? 0)
                                ? `The room ${facetLabel(facet.key)} freed has been used for another dimension`
                                : `Switch ${facetLabel(facet.key)} back on — ${(
                                    remembered[facet.key]?.values ?? []
                                  )
                                    .map(
                                      (value) => valueLabels.get(`${facet.key}=${value}`) ?? value,
                                    )
                                    .join(' against ')}`,
                          }}
                        />
                      ) : null}
                    </Flex>
                  </Flex>
                )
              })
            )}
          </Stack>
        </Box>

        <Box
          style={{
            flex: 'none',
            maxHeight: 320,
            overflowY: 'auto',
            width: valuePaneWidth ?? 280,
          }}
        >
          {activeFacet ? (
            <Stack padding={2} gap={1}>
              <Box paddingBottom={1} paddingTop={1} paddingX={2}>
                <Text muted size={0} weight="medium">
                  {`${facetLabel(activeFacet.key)} · ${values.length} of ${activeFacet.values.length}`}
                </Text>
              </Box>
              {/*
                Wrapped in a `Menu` for the same reason as the structural chip: options that use
                `MenuItem` rows would throw without the context.

                🔴 There is no multi-tick branch any more. A tick could not express "and compare
                against this one", which was the complaint — and under the D18 reversal there is no
                set for a tick to express either.
              */}
              <Menu padding={0}>
                <AffordanceValueList
                  affordance={affordance}
                  comparable={comparable}
                  idPrefix={activeFacet.key}
                  /*
                    🔴 THE CEILING BLOCKS OPENING A NEW AXIS, NOT CHANGING AN OPEN ONE.

                    ⚠️ Reported as *"why is it that everything is grayed out? I'm not able to actually
                    do anything with anything in this menu."* — and it was every value on every axis,
                    including axes already in the address.

                    The rule was `!values.includes(value)`: anything not already selected was blocked.
                    Which reads plausibly and is wrong, because it confuses two different questions.
                    Switching `de-DE` to `fr-FR` on an axis that is ALREADY OPEN does not add a
                    dimension — the layer count is `2ⁿ` in the number of AXES, not in the values on
                    them — so it cannot take the address past a ceiling it is already at.

                    What actually costs a dimension is opening an axis that is currently closed. That
                    is the only thing worth refusing, and refusing more than that made the menu look
                    broken at exactly the moment it needed to be usable: at the ceiling, the one
                    remedy available is to change your mind about a dimension you already have.
                  */
                  isBlocked={() => ceiling.full && (address[activeFacet.key] ?? []).length === 0}
                  labelFor={(value) => valueLabels.get(`${activeFacet.key}=${value}`) ?? value}
                  onChange={(next) => onSetValues(activeFacet.key, next)}
                  options={values}
                  values={address[activeFacet.key] ?? []}
                />
              </Menu>
            </Stack>
          ) : (
            <Flex align="center" height="fill" justify="center" padding={4}>
              <Text align="center" muted size={1}>
                Pick a dimension to see its values
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>

      {/*
        ⚠️ `width: 0; minWidth: 100%` so this card FILLS the popover without SETTING its width.

        Reported: *"why do we have such a wide block with this empty column on the right?... The
        callout itself can be scoped to the width of whatever it is, and if it's three lines instead of
        two, that's fine, but we shouldn't introduce this empty negative space."*

        Exactly the bug, and it was a consequence of moving the card to the bottom. The shell is
        `width: max-content`, and `max-content` takes the widest child — which became this card's
        longest line of prose. So the popover grew to fit a sentence and the panes, sized separately,
        left a column of nothing beside them.

        A child with zero width and a 100% minimum contributes nothing to the parent's intrinsic width
        and then fills whatever the parent turns out to be. So the PANES decide the width and the prose
        wraps into it, which is the right way round: the panes are the content, the card is a note
        about it.
      */}
      <Box style={{minWidth: '100%', width: 0}}>
        {/*
        ⚠️ AT THE BOTTOM, not between the search field and the panes.

        *"any of those tooltips should go to the bottom, not to the top, so the component looks the
        same regardless of what state it is in."* Right — a card appearing above the panes pushed them
        down, so the menu's shape depended on whether the address happened to be at the ceiling.
        Below them, the top of the popover is in the same place in every state, which is the property
        that lets a reader aim at it.
      */}
        {/*
        🔴 The ONLY place the resolution ceiling is ever mentioned, per R1 (2026-08-27). Nothing
        warns on the way here, so this is the first an editor hears of a limit — and it has to be
        read cold, by someone mid-task who was not expecting it.

        So it leads with what it means for them and what to do, not with the arithmetic. The old copy
        opened `This address already resolves 63 of a possible 63 combinations`, which assumes the
        reader already has a model of combinations to slot 63 into. Removing the ambient meter
        removed the only thing that could have built that model, so the numbers moved to last, as
        supporting detail for whoever wants them.

        ⚠️ The comparison line matters more than it looks. It is the one lever that costs the editor
        NOTHING — no dimension given up, same address — and it used to live in the readout tooltip,
        which is gone. Without it the only advice this card can give is "remove a dimension", which
        means giving up something you wanted.
      */}
        {ceiling.full ? (
          <Card padding={3} tone="caution" borderBottom>
            <Flex align="flex-start" gap={3}>
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Stack gap={2}>
                <Text size={1} weight="medium">
                  As specific as this address can get
                </Text>
                {/*
                ⚠️ Shortened after review: the first version was four paragraphs and read as an
                essay in a dropdown. It said everything true about the ceiling, which is the wrong
                target — this is a dialogue, and a dialogue that explains the whole model before
                telling you what to do has already lost the reader mid-task.

                What survived the cut is the ONE actionable line and the numbers. What went is the
                explanation of why doubling happens: it is the reason for the limit, not a thing the
                reader can act on, and the story's own ladder card teaches it far better than a
                sentence in a popover can.
              */}
                <Text muted size={1}>
                  {ceiling.sides === 2
                    ? 'Stop the comparison to make room, or remove a dimension to add a different one.'
                    : 'Remove a dimension to add a different one.'}
                </Text>
                <Text muted size={1}>
                  {ceiling.sides === 2
                    ? `${ceiling.definitions} dimensions across two addresses resolve ${ceiling.layers} of ${ceiling.limit}.`
                    : `${ceiling.definitions} dimensions resolve ${ceiling.layers} of ${ceiling.limit}.`}
                </Text>
              </Stack>
            </Flex>
          </Card>
        ) : null}
      </Box>
    </Stack>
  )

  if (inert) return <Button icon={AddIcon} mode={rowActionMode} text="Add dimension" />

  return (
    <Popover
      // A plain `div`: `Box` does not forward its ref, which silently disabled click-outside.
      content={<div data-pane-part="">{content}</div>}
      open={open}
      placement="bottom-start"
      portal
    >
      <Button
        ref={setButtonEl}
        data-testid={ns('composed-add-dimension')}
        icon={AddIcon}
        mode={rowActionMode}
        onClick={() => {
          if (open) {
            close()
          } else {
            setDimensionKey((previous) => previous ?? addable[0]?.key ?? null)
            setOpen(true)
          }
        }}
        selected={open}
        // "Add", alone, in a row of things you are standing on, does not say what it adds. It is the
        // only remaining hint of what the empty variant zone is for now that the sentence has gone.
        text="Add dimension"
      />
    </Popover>
  )
}

// --- the chip ----------------------------------------------------------------------------------

export interface Chip {
  key: string
  values: string[]
  /** Display labels per value, in the same order. Falls back to the raw value. */
  labels?: string[]
  /** The compared axis is the one that differs between two addresses. It never fully collapses. */
  compared?: boolean
}

/**
 * One condition key as a chip. Carries its dimension glyph, and drops to glyph-only when the row
 * would overflow, with the full reading in a tooltip.
 *
 * The glyph is not decoration here. In the target state the composed address is a weak reference to
 * a document that deliberately does not exist, so it has **no title** to shorten. Glyphs are the
 * only compression available, which is why the layout review's "glyph step" moved from an optional
 * rung to a requirement.
 */
/**
 * How much of a chip is drawn. A rung of the overflow ladder decides it, never the chip itself.
 *
 * `compact` drops the value text and keeps the glyph. On a COMPARED chip it also keeps the `⇄`,
 * which is the one mark worth spending width on: D12 says whichever dimension differs is what names
 * the comparison, so a compared chip stripped to a bare glyph stops answering the only question the
 * bar exists to answer. `⌘ ⇄` still says "this axis is what differs"; `⌘` alone does not.
 */
type ChipDensity = 'full' | 'compact'

/**
 * Chip height, measured off the SHIPPED PERSPECTIVE BAR's pill rather than chosen.
 *
 * ⚠️ 27px, up from 25. It was 25 because I measured the `Add` BUTTON, which is the wrong reference —
 * `Add` is an action in the row, not one of the pills the row is made of. Reported as the bar being
 * "a bit too compressed… follow the same spacing that the existing perspective bar has", and the
 * shipped `PerspectiveFilter`'s Card measures exactly 27. So this is the house metric rather than a
 * preference: the pills are now the height of the ones already shipping.
 *
 * ⚠️ Reported in review: the chips wanted "the same height as the Add button and the same kind of
 * spacing". Measured, they were 25px against 19px, so they sat 6px short and read as a different
 * class of thing sharing a row with the buttons. The compact ones were a 23px square around a 16px
 * glyph, which is why four of them looked like a dense little block rather than four controls.
 *
 * 🔴 Not derivable from the padding scale: content is 11px, so matching 25px needs 7px each side and
 * the scale steps 4 → 8. Hence an explicit floor plus `paddingX={2}`, which is the horizontal
 * breathing room, and `minWidth` so a glyph-only chip stays square instead of collapsing narrower
 * than it is tall.
 */
/**
 * ⚠️ Exported for the per-pane bar, so a pane's chips are exactly as tall as the bar's.
 * That matters behaviourally, not cosmetically: if the per-pane bars are different heights,
 * focusing a pane shifts the row and reintroduces the movement the reserved second row fixed.
 */
export const CHIP_HEIGHT = 27

/** See `AxisPane`. Below this many values, a filter is a control to look past. */
const FILTER_FROM = 10

/**
 * Width of the row's leading label, `Showing` or `Against`.
 *
 * Fixed rather than intrinsic, because the two rows must start their first chip at the same x. An
 * intrinsic width would set that from the label text, and "Showing" and "Against" are not the same
 * width — which would knock every column out by a few pixels and quietly undo the alignment the
 * layout depends on.
 */
/**
 * ⚠️ Exported so the rack header's two bands line up with the bar's own rows.
 *
 * The pane bar turns this OFF (`rowLabel={false}`) because 72px is a fifth of a narrow column — but
 * the rack header is full width and sits above every pane, so it is the one place the gutter is
 * affordable, and reusing the number is what makes `Held still` and `Varying` read as the same two
 * bands the two-row bar drew.
 */
export const ROW_LABEL_WIDTH = 72

/**
 * The hairline that links a chip on row one to its counterpart on row two.
 *
 * 🔴 Reported: *"we need some kind of indicator that shows that the top is being compared against the
 * bottom, even at the individual chip level. Imagine that you only see this... you should be able to
 * see that the top one is being compared against the bottom."*
 *
 * Right — alignment alone says "these are in the same column", not "these two are a pair". Two chips
 * in a column could as easily be two unrelated things stacked.
 *
 * ⚠️ NOT invented. Studio already has this idiom: `PerspectiveLayerIndicator` links menu items in a
 * range with a 1px rule at a fixed left offset in `--card-border-color`, with rounded caps at the
 * ends. Same problem — "these entries belong together" — so the same mark, at the chip's glyph
 * column rather than a menu's.
 *
 * The offset lands under the glyph on purpose: the glyph is what identifies the axis, so the line
 * hangs from the thing the pair have in common.
 */
// Measured, not chosen: the glyph's centre sits 13.5px from the card's left edge — border 1px, then
// `paddingX={2}`, then half of a 21px icon — and it is the same for structural and variant chips, so
// one constant serves both. It was 18px, which is why the line looked *nearly* right and therefore
// wrong: an offset of 4.5px reads as a mistake where 20px would read as a deliberate inset.
const PAIR_LINK_LEFT = 13

/**
 * 🔴 ONE SURFACE FOR EVERY CHIP IN THE BAR.
 *
 * ⚠️ This replaces three separate patches at the same problem, and the problem was never hover — it
 * was that the two kinds of chip were built from different primitives:
 *
 *     structural   Card \> Studio `Button mode="bleed"`   its own hover background, its own text
 *                                                       colour shift, its own focus ring
 *     variant      Card \> a Flex of `Text` nodes         none of those
 *
 * So every behaviour that a Button brings for free had to be matched by hand on the other one, and
 * three rounds of reports followed: the hover background covered only part of the card, then a CSS
 * rule meant to switch it off silently matched nothing, then the label brightened on hover for one
 * kind and not the other. Each fix was correct and none of them could be the last, because the
 * divergence was structural.
 *
 * Reported as exactly that: *"let's just look at this whole thing systematically, and let's fix it at
 * the source properly."*
 *
 * The surface is a `Card` for the visuals and a NATIVE `<button>` for the behaviour, with
 * `all: unset` on the button. That removes every user-agent and inherited style — hover background,
 * text colour, focus ring, font — so the only appearance the chip has is the one this file gives it,
 * and there is nothing left that could differ between the two kinds.
 *
 * A native button rather than a div with `role="button"`: keyboard activation, form semantics and
 * accessibility come with the element, and `all: unset` costs only the focus ring, which is put back
 * deliberately below.
 */
/**
 * ⚠️ Rendered ONCE by the bar, not once per chip.
 *
 * It was inside `ChipSurface`, so every chip carried its own copy — n identical rules for one
 * declaration, and the rule text turned up inside each chip's `textContent`. Found by a probe reading
 * a chip's text and getting the CSS back, which is a good sign the same thing would reach a screen
 * reader or a copy-paste.
 */
const CHIP_FOCUS = `
[data-chip-surface] > button:focus-visible {
  outline: 2px solid var(--card-focus-ring-color, #2276fc);
  outline-offset: -2px;
  border-radius: 2px;
}

/*
  🔴 Collapses the line box inside \`AnimatedTextWidth\`, which is what put the label 1.67px below the
  glyph on every variant chip.

  That component renders \`motion.div{display:inline-block}\` around an inner
  \`div{display:inline-block; vertical-align:middle}\`. The inner div is 19px tall inside a 9px line
  box, so \`vertical-align: middle\` resolves the 10px of overflow asymmetrically and the text sits low.
  A wrapper cannot reach it — the offset is computed one level deeper than any parent can govern.

  Measured against four candidates: \`vertical-align: top\`, \`baseline\`, and making the motion div a
  flex container all left the drift at 1.66px. \`line-height: 0\` took it to −0.01px, because with no
  line box there is no overflow to resolve. Width still animates; only height is affected, and this
  component animates width.

  ⚠️ Selector keyed on OUR \`data-chip-label\` plus the DOM shape, not on their class names or inline
  styles — the lesson from the hover rule that silently matched nothing all morning.
*/
[data-chip-label] > div {
  line-height: 0;
}
`

function ChipSurface({
  children,
  Glyph,
  hovered,
  onHoverChange,
  onClick,
  chevron = true,
  testId,
  compared = false,
  style,
  buttonRef,
  text,
  studioGlyph,
}: {
  children?: ReactNode
  /**
   * What the chip reads, as one string. Studio chrome draws it through the studio `Button`, which
   * takes text only, so every caller gives it alongside its `children`. Classic ignores it.
   */
  text?: string
  /** The Variants 2.0 icon of the chip (dimension icon or version glyph). Studio chrome only. */
  studioGlyph?: ReactElement
  /** The dimension or value icon, as a component: the chip renders it, so it is never created during a parent's render. */
  Glyph: ComponentType
  hovered: boolean
  onHoverChange: (hovered: boolean) => void
  onClick?: () => void
  chevron?: boolean
  testId?: string
  compared?: boolean
  style?: CSSProperties
  buttonRef?: (element: HTMLButtonElement | null) => void
}) {
  const chrome = useCsChrome()
  const height = chipHeightFor(chrome)
  if (chrome === 'studio' && text !== undefined) {
    // The Variants 2.0 chip (`AddressRow`'s `AddressChip`): one Card with the shape token's radius and
    // a 1px border, everything clipped to it, holding a flush 23px studio Button (the Card's border
    // makes the control 25px). The Button brings its own hover, press and focus, so the classic hover
    // overlay and focus rule are not used. Hover still drives the hover card through `onHoverChange`.
    return (
      <Card
        border
        data-chip-surface=""
        data-compared={compared || undefined}
        data-testid={testId}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        style={{
          borderRadius: PILL_RADIUS,
          boxSizing: 'border-box',
          flex: 'none',
          height,
          minWidth: height,
          overflow: 'hidden',
          position: 'relative',
          ...style,
        }}
        tone="default"
      >
        <Button
          icon={studioGlyph}
          iconRight={chevron ? ChevronDownIcon : undefined}
          justify="flex-start"
          mode="bleed"
          onClick={onClick}
          ref={buttonRef}
          style={{
            borderRadius: 0,
            cursor: onClick ? 'pointer' : 'default',
            height: height - 2,
            minHeight: height - 2,
            width: '100%',
          }}
          text={text}
          tooltipProps={null}
        />
      </Card>
    )
  }
  return (
    <Card
      border
      data-chip-surface=""
      data-compared={compared || undefined}
      data-testid={testId}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      radius={2}
      style={{
        boxSizing: 'border-box',
        flex: 'none',
        height,
        minWidth: height,
        position: 'relative',
        ...style,
      }}
      tone="default"
    >
      {/* The bar's ONLY hover feedback, over the whole surface, identical everywhere. */}
      {hovered ? (
        <Box
          aria-hidden
          style={{
            background: 'currentColor',
            inset: 0,
            opacity: 0.07,
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />
      ) : null}

      <button
        onClick={onClick}
        ref={buttonRef}
        style={{
          // `all: unset` FIRST, then only what this file wants. Order matters: anything before it is
          // discarded.
          all: 'unset',
          alignItems: 'center',
          boxSizing: 'border-box',
          cursor: onClick ? 'pointer' : 'default',
          display: 'flex',
          gap: 8,
          height: '100%',
          padding: '0 8px',
          width: '100%',
        }}
        type="button"
      >
        <Text size={1}>
          <Glyph />
        </Text>
        {children}
        {chevron ? (
          <>
            <Box flex={1} />
            <Text muted size={1}>
              <ChevronDownIcon />
            </Text>
          </>
        ) : null}
      </button>
    </Card>
  )
}

/**
 * What an axis held when it was switched off, and what the address cost at that moment.
 *
 * 🔴 `dimensionsThen` exists because of a trap reported in review: on a fixture that starts with six
 * compared dimensions, switching one off and then failing to switch it back on.
 *
 *     6 dimensions, compared      126 of 63     already OVER the ceiling before anything is touched
 *     switch off locale            62 of 63     now under it
 *     restore locale              126 of 63     over again, so `ceiling.full` refused it
 *
 * So every removal was ONE-WAY, out of a state that should not have been reachable. ⚠️ That is DEFECT
 * 13 surfacing as a trap rather than a new bug: comparing doubles the layer count and nothing guards
 * it, so an address can begin past the ceiling — and once past it, `full` is permanently true and
 * every door out is one-way.
 *
 * The rule that is right regardless of how 13 is eventually fixed: **a restore is an undo, not an
 * addition.** The ceiling refuses arriving somewhere NEW; the address demonstrably held this axis a
 * moment ago, so returning to it cannot be refused on grounds of room.
 *
 * ⚠️ With one guard, which is why the count is stored rather than the restore being simply always
 * allowed: if the reader spends the freed room on a DIFFERENT axis in between, putting this one back
 * would take them somewhere they have never been. So a restore is allowed while the address is no
 * larger than it was when the axis left it.
 */
interface RememberedAxis {
  values: string[]
  dimensionsThen: number
}

/** The gap between the rows, which the connector bridges. */
const PAIR_LINK_HEIGHT = 8

/**
 * The glyph for one value of a structural axis.
 *
 * 🔴 Fixes a real fidelity bug. Both structural chips were drawing
 * `ReleaseAvatarIcon releaseType="scheduled"`, which is the RELEASE-TYPE icon — a clock. So the
 * publication chip read `⏱ Draft`, and a clock does not mean draft, it means *scheduled release*.
 * The bar was quietly asserting something false about the axis it was labelling.
 *
 * The mapping now borrows Studio's own vocabulary rather than inventing one:
 *
 *   Draft        EditIcon      the pencil the document header uses for unpublished edits
 *   Published    PublishIcon   the icon `PublishAction` and a published release both use
 *   a release    ClockIcon     `scheduled`, per `renderReleaseTypeIcon`
 *
 * ⚠️ The release glyph is fabricated in one respect: a real workspace knows each release's type, so
 * `asap` would be a bolt. The fixture has no types, so everything scheduled-shaped gets a clock.
 */
/**
 * ⚠️ Exported for `lib/nComparison.tsx`'s per-pane bar. That bar rebuilds the chip's RENDERING —
 * it needs no chevron, no hover pane, no popover, no compared state — but it must not invent its
 * own glyph vocabulary. Which icon a structural value gets is meaning, not decoration, and two
 * surfaces disagreeing about it is exactly the drift a shared function prevents.
 */
export function structuralValueIcon(_axisKey: string, value: string) {
  if (value === 'Draft') return EditIcon
  if (value === 'Published') return PublishIcon
  // Anything else is a release. ⚠️ Always a clock here because the fixture has no release TYPES; a
  // real workspace knows them, so `asap` would be a bolt and an undecided one a dot.
  return ClockIcon
}

/**
 * Everything you can do with one axis of the address: move where you are on it, compare against a
 * value on it, or drop it.
 *
 * 🔴 ONE definition, used by the chip itself and by the folded `+N`. That is the point of extracting
 * it. Two review rounds were spent discovering that a chip reached one way could do less than the
 * same chip reached another way — first the folded chips could only be removed, then only the folded
 * ones could switch. Both were the same bug: the affordance lived at the call site instead of with
 * the axis.
 *
 * Remove sits ABOVE the values and outside the scroll, because on a 27-value axis a Remove at the
 * foot of the list is below the fold and effectively absent. It is not the first row of the value
 * list either — the values are what the pane is for and what a keyboard lands in, so a destructive
 * action as row one is a different kind of mistake.
 */
/**
 * ⚠️ Exported for the per-pane bar in `lib/nComparisonBars.tsx`.
 *
 * 🔴 This is the component whose absence made a per-pane bar draw forty locales as a flat list. A
 * hand-rolled value menu was built instead of using this, and the search field at `FILTER_FROM` — the
 * whole reason the global bar's locale axis is usable — went with it. Reported as *"the perspective bar
 * for languages shows a long list, and it's not the way I imagined it, not the way we built it before."*
 *
 * ⚠️ Its `facet` prop is typed `ConditionFacet | null` and the body dereferences `facet.values`
 * unconditionally, so null throws. The type is wrong rather than the code; callers pass a facet. A
 * structural axis has no `ConditionFacet`, so `nComparisonBars` synthesises one from `STRUCTURAL_AXES`.
 */
export function AxisPane({
  chip,
  facet,
  affordance,
  comparable = true,
  valueLabels,
  onSetValues,
  onRemove,
  idPrefix,
}: {
  chip: Chip
  facet: ConditionFacet | null
  affordance: Affordance
  comparable?: boolean
  instanceId?: string
  valueLabels: Map<string, string>
  onSetValues: (key: string, next: string[]) => void
  onRemove: () => void
  idPrefix: string
}) {
  /**
   * Where a filter starts earning its place. From the value-count analysis in
   * `The Menus / When a filter earns its place`, with counts measured rather than asserted: bundle 4,
   * plan 12, audience 14, market 14, locale 40. A filter helps from roughly ten onward and is a
   * control to look past below it.
   */
  const [query, setQuery] = useState('')
  const removeButton = (
    <Button
      data-testid={`${idPrefix}-remove-${chip.key}`}
      icon={CloseIcon}
      justify="flex-start"
      mode="bleed"
      onClick={onRemove}
      text={`Remove ${facetLabel(chip.key)}`}
      tone="critical"
      width="fill"
    />
  )

  /**
   * 🔴 The route to the documents lives HERE, in the click menu, not in the hover card.
   *
   * It was in the hover card, and reported as unreachable — correctly: the card closes on
   * `mouseleave`, so moving toward the link dismisses the thing containing it. A hover reveal cannot
   * hold a target.
   *
   *   "since click is an action that we are taking anyway, perhaps we just nest the link inside the
   *    dropdown that appears so that you can go directly to those pages"
   *
   * Which sorts the whole collision out along one line: **hover reads, click acts.** Everything you
   * can DO with an axis is in one place, reachable, and nothing competes for the same gesture.
   *
   * ⚠️ Envisioned — there is no such page in this prototype.
   */
  const actions = (
    <Stack gap={1}>
      <Button
        // ⚠️ `idPrefix`, not a literal `chip-pane-` — the literal was the last id a rack duplicated.
        data-testid={`${idPrefix}-documents-${chip.key}`}
        icon={DocumentsIcon}
        justify="flex-start"
        mode="bleed"
        /*
          ⚠️ `iconRight` says it LEAVES. Reported: *"maybe that can have an outward-facing link icon or
          some sort of thing that tells you that this will open in a new window, because it shouldn't
          shift the entire studio context into that. You lose the view that you're in."*

          Right, and the icon is doing real work rather than decorating. Every other control in this
          menu changes where you are standing; this one changes what you are looking at entirely. A
          reader who clicks it expecting the former loses the address they had composed, which on a
          six-dimension address is seven actions of work.
        */
        iconRight={LaunchIcon}
        text="Documents at this coordinate"
        tooltipProps={{content: 'Envisioned — opens in a new tab, so this view is not lost'}}
        width="fill"
      />
      {removeButton}
    </Stack>
  )

  if (!facet) {
    // Reachable whenever a caller renders an address wider than the facet list it passes. Remove
    // still has to work: the chip is real even when the axis behind it is not described.
    return (
      <Stack gap={3} padding={3} style={{width: 260}}>
        <Text muted size={1}>
          {`No values are described for ${facetLabel(chip.key)}, so there is nothing to switch to here.`}
        </Text>
        {actions}
      </Stack>
    )
  }

  /*
    🔴 OPTION C, chosen 2026-08-28 from four candidates in `The Menus / The chip's menu · options`:
    values first, actions in a FOOTER, and the filter above them.

        "I agree option C is good, and D is too much… The destructive action is also at the bottom,
         so that's nice."

    D — one menu with two entry points — lost for being too much everywhere: it makes a chip's menu
    420px wide to choose among three releases.

    ⚠️ The filter is CONDITIONAL, which is C combined with the threshold analysis rather than C alone:
    *"When a filter earns its place makes a lot of sense. Follow that logic."* So the filter appears
    only past `FILTER_FROM` values. On a 3-value release axis a filter is a control to look past; on a
    40-value locale axis it is the only way to reach the end.

    ⚠️ Actions moving to the foot reverses a decision made this morning, and the reason it is safe now
    is that the footer is OUTSIDE the scroll. The earlier move put Remove above the values precisely
    because a Remove at the foot of a 27-row list was below the fold. A fixed footer is always visible,
    so it keeps that property while giving the value list a top that does not move per axis.
  */
  const rule = '1px solid var(--card-border-color)'
  /*
    Matches the LABEL a reader can see AND the authored SLUG underneath it.

    ⚠️ It matched the label only until 2026-08-31, and the asymmetry was invisible because both halves
    look correct on their own. The chip pane matched labels, so `German` found the three German
    locales and `de-DE` found nothing. The Add menu, twenty lines up, matches slugs, so `de-DE` found
    the locale axis and `German` did not narrow it. **Two search fields on the same axis, each
    answering the half of the question the other refused.**

    Page 1 named the Developer as the one role that thinks in slugs — `market: dach`, not `DACH
    market` — and a localizer as the one who lives in a forty-value list of titles. Matching both
    costs nothing and is the only version where neither role has to learn the other's vocabulary.

    The slug is still not DISPLAYED. Whether it should be is an open question with its own story,
    `6 · Where the slug lives`, because showing it costs width on all forty rows.
  */
  const filtered = query.trim()
    ? facet.values.filter((value) => {
        const needle = query.trim().toLowerCase()
        const shown = (valueLabels.get(`${facet.key}=${value}`) ?? value).toLowerCase()
        return shown.includes(needle) || value.toLowerCase().includes(needle)
      })
    : facet.values

  return (
    <Stack gap={0} style={{width: 260}}>
      {facet.values.length >= FILTER_FROM ? (
        <Box padding={2} style={{borderBottom: rule}}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            /*
              ⚠️ Was `Find a ${label}`, which read "Find a audience" on every vowel-initial axis —
              Audience, Account type, Industry, Environment. Naming the axis here was redundant
              anyway: the pane hangs off a chip that names it and the footer's Remove names it again.
              This is the Add menu's own placeholder narrowed to one axis — same verb, same noun.
            */
            placeholder="Find a value"
            radius={2}
            value={query}
          />
        </Box>
      ) : null}

      <Box padding={2} style={{maxHeight: 300, overflowY: 'auto'}}>
        {filtered.length === 0 ? (
          <Box padding={2}>
            <Text muted size={1}>
              Nothing matches
            </Text>
          </Box>
        ) : (
          <AffordanceValueList
            affordance={affordance}
            comparable={comparable}
            idPrefix={`${idPrefix}-${facet.key}`}
            labelFor={(value) => valueLabels.get(`${facet.key}=${value}`) ?? value}
            onChange={(next) => onSetValues(facet.key, next)}
            options={filtered}
            values={chip.values}
          />
        )}
      </Box>

      <Box padding={2} style={{borderTop: rule}}>
        {actions}
      </Box>
    </Stack>
  )
}

function AddressChip({
  chip,
  density,
  onRemove,
  facet = null,
  affordance = 'AC',
  comparable = true,
  instanceId,
  valueLabels,
  onSetValues,
  interactive = false,
  side,
  labelAxis = false,
  hoverExpand = true,
}: {
  chip: Chip
  density: ChipDensity
  /** Clears the whole dimension. Reached from inside the chip's own pane, not from a ✕ on the chip. */
  onRemove?: (value: null) => void
  /**
   * Which end of a compared axis to draw, when the caller is drawing one row per side.
   *
   * 🔴 This is what makes the two-tier layout say what the sentence used to say. A chip rendered
   * `A ⇄ B` describes a comparison in one box; two chips rendered `A` and `B`, one under the other,
   * describe two ADDRESSES — which is the thing that is actually true and the thing a single row of
   * chips can never claim honestly.
   */
  side?: typeof ANCHOR | typeof COUNTERPART
  /**
   * Name the axis in the chip, not just glyph it.
   *
   * Decision C: the sentence read *"Comparing **Audience** New Visitors against Returning
   * Customers"*, and the chip only hinted at the axis with a glyph. Used on compared chips, where
   * the pair has to be legible without the reader already knowing what 👥 means. The ladder strips
   * it at the first rung, because it is the cheapest text on the chip.
   */
  labelAxis?: boolean
  facet?: ConditionFacet | null
  affordance?: Affordance
  comparable?: boolean
  instanceId?: string
  valueLabels?: Map<string, string>
  onSetValues?: (key: string, next: string[]) => void
  /**
   * ⚠️ Measurement copies pass `false`. A popover trigger inside a hidden measurement row is the
   * eager-mount collision this file has now hit three times — and the whole chip must still measure
   * identically, which it does because the same `body` renders either way.
   */
  interactive?: boolean
  /** False on the expanded copy itself, so it cannot expand again. */
  hoverExpand?: boolean
}) {
  const ns = namespaced(instanceId)
  /**
   * 🔴 Hover opens a CARD. It does not resize the chip, and it does not cover the row.
   *
   * Three goes at this, and the third is the one that holds:
   *
   *   1. a tooltip                    text to read, in a different shape, somewhere else
   *   2. a portalled expanded chip    "it hides everything else in that row"
   *   3. expand in flow, pushing      "quite jumpy. The whole UI jumps around"
   *
   * Attempt 3 was a fair reading of attempt 2's complaint and still wrong, because the objection to
   * covering was never "make it move instead" — it was that a reveal should not destroy the reader's
   * picture of the row. Reflowing five chips to read one destroys it just as thoroughly, and adds
   * motion on top.
   *
   * So the chip stays exactly as it is, and the reveal is a card beside it. That also lets the reveal
   * carry more than the chip ever could: *"an actual hover element that shows you what that market is
   * and what conditions there are, and potentially takes you to that page where you can see all
   * documents linked to that... that way we have a short route to get to the detail page itself."*
   *
   * Which reframes the whole thing. A tooltip answers "what does this glyph say?" — a small question,
   * and the reason attempts 1–3 all felt thin. A card answers "what IS this dimension, and where do I
   * go next?", and the second half of that is a route nothing else in the bar offers.
   */
  const [hovered, setHovered] = useState(false)
  const {openKey, setOpenKey} = useContext(OpenPaneContext)
  const paneKey = `${chip.key}#${side ?? 'x'}`
  const paneOpen = openKey === paneKey
  /**
   * The open action lives on the chip now, not on a wrapper around it.
   *
   * `ChipSurface` is a real `<button>`, so it should be the thing that is clicked. Previously the
   * click was on a `Box` wrapped around the chip by `ChipPane`, which worked by bubbling and meant the
   * semantic control and the clickable region were different elements.
   */
  const onOpen = useCallback(
    () => setOpenKey(paneOpen ? null : paneKey),
    [paneKey, paneOpen, setOpenKey],
  )
  const shownDensity: ChipDensity = density

  const shown = chip.labels ?? chip.values

  // 🔴 Two values on a key means ONE thing now, and that is the point of the D18 reversal.
  //
  // It used to mean two things at once — "match either of these", a set; or "here against there", a
  // comparison — with the same data shape carrying opposite meanings, and the chip had to guess
  // which from a separate `compared` flag. That ambiguity is gone: an address is a point, so two
  // values can only ever be the anchor and the counterpart.
  //
  //     ⌘ de-DE ⇄ fr-FR     the only reading two values can have
  //
  // ⚠️ `chip.compared` is therefore DERIVED, not asserted. A caller passing `compared` on a
  // single-valued chip is describing a state that cannot exist, and honouring it would put a `⇄`
  // beside one value.
  // What the axis holds, versus what THIS chip draws. A row-per-side caller draws one end.
  const axisIsCompared = shown.length === 2
  const drawn = side === undefined ? shown : [shown[side]].filter((value) => value !== undefined)
  const isComparison = drawn.length === 2
  const reading = axisIsCompared
    ? `${facetLabel(chip.key)}: ${shown[0]} against ${shown[1]}`
    : `${facetLabel(chip.key)}: ${shown[0] ?? ''}`

  // A single coordinate. The `N values` summary that used to live here has no state left to
  // describe: past two values was a set, and sets are no longer addresses. Fanning out across four
  // locales is a PANE COUNT, which was the third job this chip had quietly been doing.
  const summary = drawn[0] ?? ''

  /** What the chip currently reads. Changing it is what makes the pill spring to its new width. */
  const animatedText =
    shownDensity === 'compact'
      ? ''
      : [labelAxis && facetLabel(chip.key), ...drawn].filter(Boolean).join(' ')

  const body = (
    <ChipSurface
      // 🔴 The same surface the structural chips use. One primitive, so there is nothing left that
      // could hover, focus or colour its text differently between the two kinds of chip.
      chevron={shownDensity === 'full'}
      compared={axisIsCompared}
      Glyph={axisIcon(chip.key)}
      hovered={hovered}
      onHoverChange={setHovered}
      onClick={interactive ? onOpen : undefined}
      studioGlyph={<DimensionIcon name={chip.key} />}
      style={{width: '100%'}}
      text={
        shownDensity === 'compact'
          ? ''
          : [
              labelAxis && facetLabel(chip.key),
              isComparison ? `${drawn[0]} ⇄ ${drawn[1]}` : summary,
            ]
              .filter(Boolean)
              .join(' ')
      }
      testId={ns(`address-chip-${chip.key}`)}
    >
      {labelAxis && shownDensity === 'full' ? (
        <Text muted size={1} style={{whiteSpace: 'nowrap'}} weight="medium">
          {facetLabel(chip.key)}
        </Text>
      ) : null}

      {shownDensity === 'compact' ? null : (
        /*
          🔴 A FLEX WRAPPER, because `AnimatedTextWidth` is an inline-block and it pushed the label off
          centre.

          Reported as a regression in "the position of the text in relation to the icon". Measured: on
          variant chips the label sat 1.67px BELOW the chip's centre while the glyph sat exactly on it,
          and structural chips were fine — which is what pointed here, since only variant chips use
          this component.

          The mechanism, from the ancestor chain:

              motion.div   display: inline-block   vertical-align: middle   height 9
              its text                                                     height 19

          The text overflows its own box by 10px, and `vertical-align: middle` on a block parent
          resolves that overflow asymmetrically. Inside a FLEX parent `vertical-align` does not apply at
          all and `align-items: center` governs instead — so wrapping it is the entire fix, and the
          shipped component is left untouched.
        */
        <Box data-chip-label="" style={{alignItems: 'center', display: 'flex'}}>
          <AnimatedTextWidth text={animatedText}>
            <Flex align="center" gap={2}>
              {isComparison ? (
                <Flex align="center" gap={2}>
                  <Text size={1} style={{whiteSpace: 'nowrap'}}>
                    {drawn[0]}
                  </Text>
                  {/* The swap glyph survives `compact`, where the values do not. */}
                  <Text size={1} style={{whiteSpace: 'nowrap'}} weight="semibold">
                    {'⇄'}
                  </Text>
                  <Text size={1} style={{whiteSpace: 'nowrap'}}>
                    {drawn[1]}
                  </Text>
                </Flex>
              ) : (
                <Text muted size={1} style={{whiteSpace: 'nowrap'}}>
                  {summary}
                </Text>
              )}
            </Flex>
          </AnimatedTextWidth>
        </Box>
      )}
    </ChipSurface>
  )

  // A tooltip whenever the chip is not showing everything it holds: collapsed to a glyph, or
  // summarised to a count.
  const abbreviated = shownDensity === 'compact'

  /**
   * ⚠️ THE TOOLTIP IS GONE WHEREVER THE CARD EXISTS.
   *
   * Reported as three things colliding on one gesture: the tooltip, the hover card, and the link
   * inside it. The tooltip was the redundant one — it said strictly less than the card and appeared
   * in the same moment at the same place. It survives only where no card can open: measurement
   * copies and inert renders, which have no hover at all.
   */
  const canCard = interactive && hoverExpand
  const withReveal =
    abbreviated && !canCard ? (
      <Tooltip content={<Text size={1}>{reading}</Text>} portal>
        <Box style={{flex: 'none'}}>{body}</Box>
      </Tooltip>
    ) : (
      body
    )

  /**
   * What the card says. Deliberately more than the chip could hold at any width:
   *
   *   the axis, named          the thing a glyph only hints at
   *   the value, titled        `DACH market`
   *   the condition, raw       `market: dach` — the authored slug, which is what a developer debugs
   *   a route out              every document at this coordinate
   *
   * The last line is the one that earns the card. Nothing else in the bar offers a way OUT of the
   * bar, and a dimension you can see but not follow is a dead end. ⚠️ The route is envisioned — there
   * is no such page in this prototype.
   */
  /**
   * What the card says, after a round of cutting.
   *
   * ⚠️ It used to carry the raw condition — `audience: new-visitors / returning-customers` — and
   * reported: *"I don't think it needs to repeat the key. It just needs to show the values, and
   * perhaps it's not even necessary to show that condition because the titles show them themselves.
   * Perhaps condition only shows up on the detail page anyway, because what matters here is brevity,
   * not verbosity."*
   *
   * Both true. The slug repeats the key that is already the card's heading, and it repeats values the
   * titles already say — so it was the longest line and the least informative. It belongs where
   * someone is debugging, which is the detail page the click menu now links to, not in a reveal whose
   * whole job is to be read at a glance.
   *
   * Type sizes go up with the cutting. There is less to fit, so nothing has to be small.
   */
  const hoverCard = (
    <Box style={{maxWidth: 300}}>
      <Stack gap={3} padding={3}>
        <Text muted size={1} weight="medium">
          {facetLabel(chip.key)}
        </Text>
        <Stack gap={2}>
          {shown.map((value, index) => (
            <Flex align="center" gap={3} key={value}>
              {axisIsCompared ? (
                <Box style={{flex: 'none', width: 64}}>
                  <Text muted size={1}>
                    {index === ANCHOR ? 'Showing' : 'Against'}
                  </Text>
                </Box>
              ) : null}
              <Text size={2}>{value}</Text>
            </Flex>
          ))}
        </Stack>
      </Stack>
    </Box>
  )

  const hoverable = canCard ? (
    <Popover
      content={hoverCard}
      // `bottom-start` so the card hangs under the chip's own left edge: the reader's eye is
      // already there, and it cannot cover the chip it describes.
      //
      // Never while a pane is open — including this chip's own. Once you have clicked in, the card
      // is a smaller version of what is already in front of you.
      open={hovered && openKey === null}
      placement="bottom-start"
      portal
    >
      <Box
        data-testid={ns(`chip-hover-${chip.key}`)}
        /*
            🔴 NO AUTO-CLOSE ON HOVER. This used to read:

                if (openKey && openKey !== paneKey) setOpenKey(null)

            and it is what made the chip pane vanish the moment you clicked its search field.
            Reported as an Against-row bug; measured, it happened on both rows, and the instrumented
            event log shows why:

                mousedown on INPUT  inPopover=true     ← the click was correctly inside
                enter:chip-hover-audience  ×9          ← mouseenter flooding

            A compared axis has a chip on BOTH rows. Opening row one's pane sets `openKey` to
            `audience#0`; any `mouseenter` on row two's chip — same axis, different pane key — then
            satisfied `openKey !== paneKey` and cleared it. And those events were not the reader
            moving: opening the popover changes what sits under the cursor, so the enter/leave churn
            fired repeatedly on its own.

            ⚠️ Removing it loses nothing, because the thing it was protecting against is already
            handled. The hover card is suppressed whenever any pane is open — `open={hovered &&
            openKey === null}` — so a card can never draw underneath a pane regardless. The auto-close
            was solving a problem the suppression had already solved, and paying for it with a state
            change triggered by pointer noise.

            A pane now closes on a click outside it, on Escape, or on clicking its own chip again.
            None of those can fire by accident.
          */
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        // Clicking opens the axis pane, so the card gets out of the way. Without this the two
        // stacked on top of each other — the card sitting over the value list it was supposed to
        // be introducing.
        onMouseDown={() => setHovered(false)}
        style={{flex: 'none'}}
      >
        {withReveal}
      </Box>
    </Popover>
  ) : (
    withReveal
  )

  if (!interactive || !onRemove || !valueLabels || !onSetValues) return hoverable

  return (
    <ChipPane
      affordance={affordance}
      comparable={comparable}
      instanceId={instanceId}
      chip={chip}
      facet={facet}
      onRemove={() => onRemove(null)}
      onSetValues={onSetValues}
      side={side}
      valueLabels={valueLabels}
    >
      {hoverable}
    </ChipPane>
  )
}

/**
 * The popover a chip opens. Separate from `AddressChip` only because it needs hooks and the chip is
 * rendered in measurement rows where those must not run.
 */
function ChipPane({
  chip,
  facet,
  affordance,
  comparable = true,
  instanceId,
  valueLabels,
  onSetValues,
  onRemove,
  children,
  side,
}: {
  chip: Chip
  /** Part of the pane's identity: the same axis appears on both rows and they are not one control. */
  side?: typeof ANCHOR | typeof COUNTERPART
  facet: ConditionFacet | null
  affordance: Affordance
  comparable?: boolean
  instanceId?: string
  valueLabels: Map<string, string>
  onSetValues: (key: string, next: string[]) => void
  onRemove: () => void
  children: ReactNode
}) {
  const ns = namespaced(instanceId)
  const {openKey, setOpenKey} = useContext(OpenPaneContext)
  const paneKey = `${chip.key}#${side ?? 'x'}`
  const open = openKey === paneKey
  const close = useCallback(() => setOpenKey(null), [setOpenKey])
  useDismissOnOutside(open, close)

  // Escape closes it, like every other menu in Studio. `useClickOutsideEvent` only watches pointers,
  // so without this the only way out was clicking elsewhere.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, open])

  return (
    <Popover
      content={
        /*
          ⚠️ A PLAIN `div`, not a `Box`. @sanity/ui's `Box` does not forward its ref in this version, so
          `ref={setContentEl}` left `contentEl` null — verified by logging it: every close reported
          `{trigger: true, content: false}`. With a null in its element list, `useClickOutsideEvent`
          treats the entire portalled popover as outside, so ANY click in it closed the pane. That is
          what made the search field appear to dismiss its own menu.
        */
        <div data-pane-part="">
          <AxisPane
            affordance={affordance}
            comparable={comparable}
            instanceId={instanceId}
            chip={chip}
            facet={facet}
            idPrefix={ns('chip-pane')}
            onRemove={() => {
              onRemove()
              close()
            }}
            onSetValues={(key, next) => {
              onSetValues(key, next)
              // Closes on selection, like every other menu in the bar. Left open, a chip that had just
              // been changed needed TWO clicks to reopen — one to close the stale pane and one to open
              // it again — because the trigger toggles. Building a comparison from a chip therefore
              // costs two opens; the Add menu stays the place to assemble one in a single pass.
              close()
            }}
            valueLabels={valueLabels}
          />
        </div>
      }
      open={open}
      placement="bottom-start"
      portal
    >
      {/*
        ⚠️ NO `onClick` HERE. The chip inside is a real `<button>` and owns the open action; this Box is
        only the popover's anchor and its click-outside reference.

        An earlier edit meant to remove this handler and silently did not match, so BOTH the button and
        this wrapper were toggling `openKey` on one click. The two cancelled, and what survived depended
        on which element the pointer actually landed on — which is why the pane's behaviour looked
        inconsistent between rows when it was really inconsistent between pixels.

        The test id is deliberately not `address-chip-open-…`: a prefix selector for `address-chip-`
        would match both this and the chip inside it, and double-count every chip.
      */}
      <Box data-pane-part="" data-testid={ns(`chip-trigger-${chip.key}`)} style={{flex: 'none'}}>
        {children}
      </Box>
    </Popover>
  )
}

/**
 * The overflow ladder. Decisions R3 and R4, both taken 2026-08-27.
 *
 * ⚠️ Reported in review as chips truncating with nothing to scroll. There WAS an overflow strategy —
 * collapse to glyph-only when the row does not fit — and it had one exemption:
 *
 *     `iconOnly={collapsed && !chip.compared}`      the old rule
 *
 * A compared chip reads `value ⇄ value`, so it is roughly twice the width of a held-still one, and
 * it was the chip held immune from collapsing. **The rule spared exactly the chips that were
 * widest.** So the more axes were compared, the less the strategy could do, and past a point it did
 * nothing at all and the row clipped silently under `overflow: hidden`.
 *
 * The guarantee that replaces it: **the bar never silently hides where you are standing.** Content
 * may be abbreviated, moved behind a count, or given a tooltip. It may not be cut off.
 *
 * That guarantee needs more than one step, because one step runs out. So degradation is a LADDER,
 * ordered cheapest-information-first, and the row descends only as far as it must:
 *
 *     0  everything, in full                       1235px
 *     1  held-still chips lose their text            620    ⌘ ⧉ 🌐 ⚑  New ⇄ Returning
 *     2  held-still chips fold into a count          ~240   +4  New ⇄ Returning
 *     3  compared chip loses its text too            ~118   +4  ⌘ ⇄
 *     4  everything folds into a count                33    +5
 *
 * Ordering is the whole design, and ⚠️ THE FIRST ORDERING WAS WRONG. It stripped the compared chip's
 * text at rung 2 and only folded the held-still chips at rung 3, so the row gave up the most
 * valuable thing on screen before the least valuable. Reported in review as looking like an error —
 * `⌘ ⇄` with the values only in a tooltip, at a width with room to spare.
 *
 * The test that settles the order is: **what does the reader lose least by losing?**
 *
 *   five glyphs whose values are IDENTICAL on both sides    already textless, nearly redundant
 *   the two values of the axis that DIFFERS                 the entire answer to "what changed"
 *
 * Under D12 the differing dimension is what names the comparison, so its values are the last text
 * worth spending width on, not the first. Folding four glyphs into `+4` buys ~165px; stripping the
 * compared values buys ~200px. Similar money, wildly different cost, so the glyphs go first and the
 * compared values now survive two rungs longer than they did.
 */
/**
 * ⚠️ Exported for the rack, which takes the NARROWEST rung any pane reported and hands it to all of
 * them. That needs the order, and the alternative was a second copy of this array in
 * `nComparisonBars.tsx` — where I wrote one from memory and got three of five members wrong. A rung
 * added here now reaches the rack for free.
 */
export const LADDER = [
  'full',
  'compact-held-still',
  'fold-held-still',
  'compact-compared',
  'fold-everything',
] as const
/** ⚠️ Exported because a rack lifts this out of `ChipZone` to keep its panes on one rung. */
export type Rung = (typeof LADDER)[number]

/** What a rung draws: the chips still shown, at what density, and how many are folded away. */
interface RungPlan {
  shown: {chip: Chip; density: ChipDensity}[]
  hidden: Chip[]
}

/**
 * 🔴 One function, used by BOTH the visible row and every hidden measurement row.
 *
 * Not a tidiness point. The previous version measured a hidden copy that was always fully expanded
 * and then rendered something else, so the measurement answered "would the FULL row fit?" while the
 * render asked "what should this row look like?" — two different questions, and the mismatch is why
 * a row could be measured as overflowing, collapse, and still overflow. Deriving both from one
 * function makes a measurement a statement about the thing actually drawn.
 */
function planFor(chips: Chip[], rung: Rung): RungPlan {
  const heldStill = chips.filter((chip) => !chip.compared)
  const compared = chips.filter((chip) => chip.compared)

  switch (rung) {
    case 'full':
      return {shown: chips.map((chip) => ({chip, density: 'full'})), hidden: []}
    case 'compact-held-still':
      return {
        shown: chips.map((chip) => ({chip, density: chip.compared ? 'full' : 'compact'})),
        hidden: [],
      }
    case 'fold-held-still':
      // 🔴 The compared chip is still FULL here. This is the rung that changed: the held-still
      // glyphs fold away while the values that answer "what differs" are still readable.
      return {shown: compared.map((chip) => ({chip, density: 'full'})), hidden: heldStill}
    case 'compact-compared':
      // Held-still chips stay folded rather than returning: the ladder only ever descends, so a
      // rung never restores what an earlier one gave up.
      return {shown: compared.map((chip) => ({chip, density: 'compact'})), hidden: heldStill}
    default:
      // `fold-everything`, the last rung.
      return {shown: [], hidden: chips}
  }
}

/**
 * The count that stands in for folded chips, with the full reading of each behind it — and each one
 * removable on its own.
 *
 * ⚠️ Built read-only first, and that was wrong. The reasoning was that this control's job is the
 * guarantee — nothing hidden without being reachable — and that a menu whose rows delete on click is
 * a trap for someone who only opened it to read. Both halves of that are true and the conclusion did
 * not follow.
 *
 * Reported in review: at rungs 3 and 4 every variant chip is folded in here, so the ONLY remaining
 * way to drop one dimension is `Clear`, which drops all of them. The claim that a dimension can
 * always be removed "from its own chip, one width-change away" quietly assumed the reader can widen
 * the window. On a narrow one they cannot, and the capability is simply gone.
 *
 * 🔴 So the principle the ladder actually has to hold is stronger than the one it was built on:
 *
 *     a degradation may abbreviate WHAT YOU SEE.
 *     it may never take away WHAT YOU CAN DO.
 *
 * A `+5` that cannot be unpicked fails that the same way a clipped chip fails the first guarantee —
 * silently, and worse at exactly the width where the reader has fewest options.
 *
 * The trailing ✕ on every row is what makes the destructive action legible, since the row itself
 * carries it. Whether that is enough to stop an accidental removal by someone who opened the menu to
 * read is a real question and an open one — recorded on review page 1 rather than settled here.
 */
function OverflowChip({
  chips,
  facets,
  valueLabels,
  onSetValues,
  onRemove,
  affordance = 'AC',
  comparable = true,
  instanceId,
  measureOnly = false,
}: {
  chips: Chip[]
  facets: ConditionFacet[]
  valueLabels: Map<string, string>
  onSetValues: (key: string, next: string[]) => void
  onRemove: (key: string) => void
  affordance?: Affordance
  comparable?: boolean
  instanceId?: string
  /**
   * ⚠️ A measurement copy renders the BUTTON ONLY — no popover, no rows.
   *
   * `MenuButton` mounted its menu eagerly, so the two hidden rungs that fold chips were each
   * mounting a full menu: three copies of every row, three elements sharing one `id`, three sharing
   * each row's test id. A click resolved to three elements and refused.
   *
   * **Anything inside a measurement row must be inert, not merely invisible.** Hidden is a property
   * of the pixels; the DOM does not know about it, and neither do ids. Third time this collision has
   * appeared in this file.
   */
  measureOnly?: boolean
}) {
  const rowActionMode = useRowActionMode()
  const ns = namespaced(instanceId)
  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [, setButtonEl] = useState<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setActiveKey(null)
  }, [setOpen])
  useDismissOnOutside(open, close)

  const label = `+${chips.length}`

  if (measureOnly) {
    return (
      <Button
        mode={rowActionMode}
        text={label}
        tooltipProps={{content: `${chips.length} more dimensions in this address`}}
      />
    )
  }

  const activeChip = chips.find((chip) => chip.key === activeKey) ?? null
  const activeFacet = facets.find((facet) => facet.key === activeKey) ?? null

  const content = (
    <Flex style={{width: 400}}>
      {/* 156px, down from 220. The left pane holds one dimension name per row and nothing else, so
          the extra width was pure margin — reported as the pattern being good but able to be more
          compact, "because the labels on the left don't need that much space". */}
      <Box style={{width: 156, borderRight: '1px solid var(--card-border-color)'}}>
        <Stack gap={1} padding={2}>
          {chips.map((chip) => {
            const shown = chip.labels ?? chip.values
            const Icon = axisIcon(chip.key)
            return (
              <Button
                data-testid={`chip-overflow-open-${chip.key}`}
                icon={Icon}
                justify="flex-start"
                key={chip.key}
                mode="bleed"
                onClick={() => setActiveKey(chip.key)}
                selected={chip.key === activeKey}
                text={facetLabel(chip.key)}
                // The value goes in the subtitle slot the Button does not have, so it rides along in
                // the tooltip. The dimension NAME is what you scan this list for.
                tooltipProps={{
                  content:
                    shown.length === 2 ? `${shown[0]} against ${shown[1]}` : (shown[0] ?? ''),
                }}
              />
            )
          })}
        </Stack>
      </Box>

      <Box flex={1}>
        {activeChip ? (
          <AxisPane
            affordance={affordance}
            comparable={comparable}
            instanceId={instanceId}
            chip={activeChip}
            facet={activeFacet}
            idPrefix={ns('chip-overflow')}
            onRemove={() => {
              onRemove(activeChip.key)
              close()
            }}
            onSetValues={onSetValues}
            valueLabels={valueLabels}
          />
        ) : (
          <Box padding={4}>
            <Text muted size={1}>
              Pick a dimension to change where you are standing on it, or to remove it.
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  )

  return (
    <Popover
      // A plain `div`: `Box` does not forward its ref, which silently disabled click-outside.
      content={<div data-pane-part="">{content}</div>}
      open={open}
      placement="bottom-start"
      portal
    >
      <Button
        data-testid="chip-overflow"
        mode={rowActionMode}
        onClick={() => (open ? close() : setOpen(true))}
        ref={setButtonEl}
        selected={open}
        text={label}
        tooltipProps={{content: `${chips.length} more dimensions in this address`}}
      />
    </Popover>
  )
}

/**
 * The sentence, on demand.
 *
 * ⚠️ Hover, not click: it is a reference rather than an action, and the bar's one rule for reveals is
 * that hover reads and click acts. Clicking it would promise something to do.
 */
function SentenceHint({chips, structural}: {chips: Chip[]; structural: Chip[]}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      content={
        // Wider than the old prose card: the blocks are a grid, and a grid that wraps a value onto a
        // second line loses the alignment that is the whole point of it.
        <Box padding={3} style={{maxWidth: 460}}>
          <ComparisonSentence chips={chips} structural={structural} />
        </Box>
      }
      open={open}
      placement="bottom-end"
      portal
    >
      <Box onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <Button
          data-testid="sentence-hint"
          icon={HelpCircleIcon}
          mode="bleed"
          tooltipProps={null}
        />
      </Box>
    </Popover>
  )
}

/** The 1px rule bridging the gap between a chip and the chip it is compared against. */
function PairLink() {
  return (
    <Box
      aria-hidden
      data-testid="pair-link"
      style={{
        background: 'var(--card-border-color)',
        borderRadius: 1,
        height: PAIR_LINK_HEIGHT,
        left: PAIR_LINK_LEFT,
        position: 'absolute',
        top: -PAIR_LINK_HEIGHT,
        width: 1,
      }}
    />
  )
}

/**
 * 🔴 Which chip's pane is open, shared across both rows.
 *
 * ⚠️ Reported: with one pane open, hovering another chip drew that chip's card UNDERNEATH the open
 * pane — two reveals about two different axes on screen at once, one of them unreadable.
 *
 *   "if you've toggled something open and you move away, either we disable hover or we auto-close"
 *
 * Auto-close, and the reason to prefer it over disabling hover is that a pane you have moved away
 * from is finished. Leaving it open to block hovering makes the reader dismiss something before they
 * can read anything, which is a state the bar puts them in rather than one they chose.
 *
 * ⚠️ The key identifies a CHIP, not an axis — `audience#0` and `audience#1`, not `audience`.
 *
 * Keyed by axis alone, and argued for in this very comment, it caused the bug reported next: a
 * compared axis has a chip on BOTH rows carrying the same key, so `openKey === chip.key` was true for
 * both and clicking one opened two popovers. On screen that read as a doubled menu — "Documents at
 * this coordinate" twice, one pane's header overlapping the other's body.
 *
 * The reasoning was that two panes for one axis is a collision. True, and the fix for that is that
 * only one key is ever set at a time, which a per-chip key gives just as well. Identity and mutual
 * exclusion are different jobs and I had one field doing both.
 */
interface OpenPane {
  openKey: string | null
  setOpenKey: (key: string | null) => void
}
const OpenPaneContext = createContext<OpenPane>({openKey: null, setOpenKey: () => {}})

/**
 * 🔴 DISMISS-ON-OUTSIDE, BY CONTAINMENT RATHER THAN BY REF.
 *
 * ⚠️ Replaces `useClickOutsideEvent(close, () => [trigger, content])`, which silently never worked for
 * a portalled popover here. The element list needs the floating card, and there was no way to get it:
 * a ref on the `Popover` lands elsewhere, and a ref on the content — `Box` or a plain `div` — never
 * fired at all. Logged to be sure rather than assumed: every close reported
 * `{trigger: true, content: false}`, both before and after the pane opened.
 *
 * With a null in its list, `useClickOutsideEvent` treats the ENTIRE popover as outside, so any click
 * inside it dismissed the pane. That is what made the search field appear to dismiss its own menu —
 * reported as an Against-row bug, and true of every click in every pane on both rows.
 *
 * So this asks the DOM the question directly: is the thing you clicked inside something marked as part
 * of this pane? Both the trigger and the content root carry `data-pane-part`, and only one pane is
 * ever open, so one attribute is enough. No refs, nothing to fail silently — and if the markup ever
 * moves, the check breaks loudly rather than dismissing the pane on every click.
 */
function useDismissOnOutside(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      /*
        Two selectors, because the popover's own Card WRAPS the marked content — so a click on the
        card's padding is inside the popover and outside the mark. Measured: with only the mark, the
        input and the footer survived and a click on the card's own padding still dismissed the pane.
      */
      if (target && target.closest('[data-pane-part], [data-ui="Popover"]')) return
      close()
    }
    // Capture, so it settles before any React handler can act on a stale open state.
    document.addEventListener('mousedown', onDown, true)
    return () => document.removeEventListener('mousedown', onDown, true)
  }, [close, open])
}

/** Stable identities so a measurement chip is never re-rendered by a fresh callback each pass. */
const NO_OP_REMOVE = () => {}
const NO_OP_SET = () => {}
const NO_OP_CHIP_REMOVE = () => {}

function ChipZone({
  chips,
  onRemove,
  facets,
  valueLabels,
  onSetValues,
  affordance = 'AC',
  comparable = true,
  instanceId,
  side,
  labelCompared = false,
  ghostUncompared = false,
  rung: controlledRung,
  onRung,
}: {
  chips: Chip[]
  onRemove: (key: string) => void
  /** Threaded through for the folded chips, which now switch values as well as remove them. */
  facets: ConditionFacet[]
  valueLabels: Map<string, string>
  onSetValues: (key: string, next: string[]) => void
  affordance?: Affordance
  comparable?: boolean
  instanceId?: string
  /** Which end of each compared axis to draw. See `AddressChip.side`. */
  side?: typeof ANCHOR | typeof COUNTERPART
  /** Decision C: name the axis on compared chips. */
  labelCompared?: boolean
  /**
   * Row two draws uncompared chips as INVISIBLE SPACERS rather than skipping them, so the compared
   * counterpart lands in the same column as its anchor. The alignment is what carries the meaning:
   * empty space under a chip is the statement "this one is held still", and it is the clause the
   * sentence used to spend a line on.
   *
   * Spacers are non-interactive and `aria-hidden`. The same component renders them, so the column
   * width is exact by construction rather than by arithmetic.
   */
  ghostUncompared?: boolean
  /**
   * 🔴 The rung, when the caller owns it.
   *
   * Two rows drawn from the same address MUST sit at the same rung. Left to measure independently,
   * row two would pick its own — it has different content and a different amount of space, since it
   * carries no `Clear` — and the columns would drift apart at exactly the widths where the alignment
   * is doing the most work. So the bar measures once on row one and hands the answer down.
   *
   * This is the ownership move R5 asked for, arriving early because the two-tier layout needs it.
   */
  rung?: Rung
  onRung?: (rung: Rung) => void
}) {
  const ns = namespaced(instanceId)
  const [measuredRung, setMeasuredRung] = useState<Rung>('full')
  const rung = controlledRung ?? measuredRung
  const setRung = useCallback(
    (next: Rung) => {
      setMeasuredRung(next)
      onRung?.(next)
    },
    [onRung],
  )
  const containerRef = useRef<HTMLDivElement | null>(null)
  const measureRefs = useRef<Map<Rung, HTMLDivElement>>(new Map())

  /**
   * 🔴 R3 IS REVERSED. Collapsing is SPATIAL only — the row does not fit — never semantic.
   *
   * R3 said: while anything is compared, held-still chips give up their text without waiting for the
   * row to overflow. Reported on seeing it live: *"we only see icons. I don't know why. Is that by
   * design?"* It was, and it should not have been.
   *
   * The reasoning for R3 was sound WHEN IT WAS TAKEN and the layout has since moved out from under
   * it. R3 was decided while a compared chip was `A ⇄ B` inside one crowded row, so emphasis on what
   * differs had to come from suppressing its neighbours. With two rows, the held-still chips already
   * have nothing beneath them — **the alignment does the emphasising** — so collapsing them as well
   * is a second mechanism for a job already done, and it costs the reader the ability to see where
   * they are standing at widths with room to spare.
   *
   * One trigger for collapsing, and it is the ladder. A decision worth revisiting when the thing it
   * was reasoning about has changed shape.
   */
  const floor: Rung = 'full'

  useEffect(() => {
    /*
      🔴 A CONTROLLED ROW STILL MEASURES. It used to bail out here, on the reasoning that
      *"a controlled row does not measure — measuring twice is how the rows drift."*

      The drift it feared cannot happen, and the proof is four lines below: **the measurement targets
      the hidden clones, not the rendered row.** A controlled row's `setRung` writes `measuredRung`,
      which `rung` ignores while `controlledRung` is set, so measuring changes nothing about what it
      renders. Measuring and rendering are separable here, and that is what makes a rack possible.

      What the bail did cost: a rack takes the NARROWEST pane's rung and hands it to every pane, so
      every pane is controlled — and if a controlled pane stops measuring, no pane ever reports, and
      the rack has nothing to take a minimum of. It would settle on `full` and stay there.
    */
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return undefined

    const choose = () => {
      const available = container.clientWidth
      const start = LADDER.indexOf(floor)
      for (let index = start; index < LADDER.length; index += 1) {
        const candidate = LADDER[index]
        const element = measureRefs.current.get(candidate)
        // An unmeasured rung is not evidence of fitting, so it is skipped rather than accepted.
        if (!element) continue
        if (element.scrollWidth <= available) {
          setRung(candidate)
          return
        }
      }
      // Nothing fits, including the count on its own. Sit on the last rung: a clipped `+N` is the
      // one clip the guarantee cannot design away, and it is still the smallest thing to clip.
      setRung(LADDER[LADDER.length - 1])
    }

    const observer = new ResizeObserver(choose)
    observer.observe(container)
    // The hidden rows change width when the CHIPS change, not when the rung does, so observing them
    // cannot feed back into the rung it selects.
    for (const element of measureRefs.current.values()) observer.observe(element)
    choose()
    return () => observer.disconnect()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `chips` is the trigger: the hidden rows change width when the chips change, not when the rung does
  }, [floor, chips, setRung])

  const plan = planFor(chips, rung)

  /**
   * 🔴 ONE slot renderer for the visible row and every measurement row.
   *
   * Third time this file has learned the same lesson: `planFor` shares the plan, `AxisPane` shares
   * the affordance, and this shares the geometry. Every time two call sites built the same thing
   * separately, they diverged — and a measurement that renders different props than the render is a
   * measurement of nothing.
   */
  const renderSlot = (chip: Chip, density: ChipDensity, live: boolean) => {
    const ghost = ghostUncompared && !chip.compared
    const draw = (which: typeof ANCHOR | typeof COUNTERPART | undefined, inert: boolean) => (
      <AddressChip
        affordance={affordance}
        comparable={comparable}
        instanceId={instanceId}
        chip={chip}
        density={density}
        facet={facets.find((facet) => facet.key === chip.key) ?? null}
        interactive={live && !inert}
        labelAxis={labelCompared && chip.compared}
        onRemove={live && !inert ? () => onRemove(chip.key) : NO_OP_CHIP_REMOVE}
        onSetValues={onSetValues}
        side={which}
        valueLabels={valueLabels}
      />
    )

    if (ghost) {
      return (
        <Box aria-hidden key={chip.key} style={{flex: 'none', visibility: 'hidden'}}>
          {draw(ANCHOR, true)}
        </Box>
      )
    }

    // A compared slot reserves the width of BOTH ends, stacked in one grid cell, so the column is
    // identical on both rows. Measured: without it, a second compared axis sat 29px off, because the
    // drift is the accumulated width difference of the pairs before it.
    if (chip.compared && side !== undefined) {
      return (
        <Box
          key={chip.key}
          style={{display: 'grid', flex: 'none', justifyItems: 'stretch', position: 'relative'}}
        >
          {/* The compared chip takes THIS branch, so the connector lives here too.

              🔴 `stretch`, after two goes at this. `start` left each card at its own content width,
              and reported back: *"when there are two, one on the top row and one on the bottom row,
              like say release, and their sizes only slightly differ, it looks a bit weird."* Right —
              117px above 113px reads as a mistake, where two identical widths read as a pair. A
              4px difference is worse than a 40px one, because a small mismatch looks like sloppiness
              and a large one looks like content.

              `stretch` makes both ends exactly the reserved width, which is the wider of the two. The
              half-empty look that `start` was avoiding only appeared because one row was stretched
              and the other was not; matched, it reads as deliberate. Contents are left-aligned inside,
              so the glyphs still form a vertical line. */}
          {/* `live` only: the hidden measurement rungs would otherwise each draw one, which is
              harmless on screen and misleading to anything counting them. */}
          {live && side === COUNTERPART ? <PairLink /> : null}
          {([ANCHOR, COUNTERPART] as const).map((which) => (
            <Box
              aria-hidden={which === side ? undefined : true}
              key={which}
              style={{gridArea: '1 / 1', visibility: which === side ? undefined : 'hidden'}}
            >
              {draw(which, which !== side)}
            </Box>
          ))}
        </Box>
      )
    }

    return (
      <Box key={chip.key} style={{flex: 'none', position: 'relative'}}>
        {live && side === COUNTERPART && chip.compared ? <PairLink /> : null}
        {draw(side, false)}
      </Box>
    )
  }

  return (
    <Box
      flex={1}
      ref={containerRef}
      /*
        ⚠️ `overflowX: clip` with `overflowY: visible`, NOT `overflow: hidden`.

        Reported: the pair connector appeared on the structural chips and not on the variant ones.
        Cause: the structural chips are direct children of the row, but the variant chips live in this
        zone — and the connector hangs 8px ABOVE its chip, into the gap between rows, which
        `overflow: hidden` cut off exactly.

        `hidden` clips both axes. `clip` on one axis leaves the other genuinely visible, where
        `overflowY: hidden` would have forced a scroll container instead. The ladder is what guarantees
        nothing needs clipping horizontally; this is only the safety net under it.
      */
      style={{minWidth: 0, overflowX: 'clip', overflowY: 'visible', position: 'relative'}}
      data-testid={ns('chip-zone')}
      data-rung={rung}
    >
      <Flex align="center" gap={2} wrap="nowrap">
        {plan.shown.map(({chip, density}) => renderSlot(chip, density, true))}

        {plan.hidden.length > 0 ? (
          <OverflowChip
            affordance={affordance}
            comparable={comparable}
            instanceId={instanceId}
            chips={plan.hidden}
            facets={facets}
            onRemove={onRemove}
            onSetValues={onSetValues}
            valueLabels={valueLabels}
          />
        ) : null}
      </Flex>

      {/*
        One hidden row per rung, so the choice is made by measuring the real thing at every step
        rather than by predicting widths. Absolutely positioned, so none of them can affect the
        container width they are being measured against.

        `data-measure-only` exists for tests, and it is worth the attribute. These rows are
        `visibility: hidden`, which does NOT clear `offsetParent`, so the usual "is it visible"
        filter counts them: 25 chips where a story has 6. `aria-hidden` does exclude them — but that
        attribute appears ~41 times on this page for at least four unrelated jobs (the Add menu's
        width ruler, the hover wash, the pair link, these rows), so a test keyed off it passes by
        coincidence and would silently start dropping live chips the day anything else needs it.

        ⚠️ One positive, single-purpose marker instead. `qa/affordance.mjs` asserts against it.
      */}
      {LADDER.map((candidate) => {
        const candidatePlan = planFor(chips, candidate)
        return (
          <Flex
            aria-hidden
            data-measure-only=""
            gap={2}
            key={`measure-${candidate}`}
            ref={(element) => {
              if (element) measureRefs.current.set(candidate, element)
              else measureRefs.current.delete(candidate)
            }}
            style={{
              left: 0,
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              visibility: 'hidden',
            }}
            wrap="nowrap"
          >
            {candidatePlan.shown.map(({chip, density}) => renderSlot(chip, density, false))}
            {candidatePlan.hidden.length > 0 ? (
              <OverflowChip
                chips={candidatePlan.hidden}
                facets={facets}
                measureOnly
                onRemove={NO_OP_REMOVE}
                onSetValues={NO_OP_SET}
                valueLabels={valueLabels}
              />
            ) : null}
          </Flex>
        )
      })}
    </Box>
  )
}

// --- the sentence ------------------------------------------------------------------------------

/**
 * The comparison, said in words. An optional layer, switchable, not part of the bar's own layout.
 *
 * Reviewed as *"additional to whatever else and optional, something you can toggle on and off,
 * because it helps you make sense of what the actual comparison is"*, and kept on that basis.
 *
 * ⭐ Since then it has become considerably more important than an aid. A composed address is a weak
 * reference to a document that deliberately does not exist, so it has **no title, ever**. The
 * sentence is therefore the only human-readable name a comparison can have. It went from a
 * convenience to the answer for a gap the model creates.
 *
 * Returns `null` when nothing is being compared, because a sentence about one address is just the
 * address read aloud.
 */
const MONO = 'var(--font-family-mono, monospace)'

/**
 * The address, read as blocks rather than as a sentence.
 *
 * 🔴 Reported: *"rather than it just being one long sentence, I feel like we can break this up so that
 * we can show it in blocks... mono to showcase the actual key value and regular text to showcase the
 * filler text or the verbs that join them. Align them in sections so that there is a clear bulleted
 * list of what is happening against what and what is being kept the same."*
 *
 * The prose version had to be parsed: *"Comparing Audience Nonprofits against Returning Customers, and
 * Campaign Earth Day campaign against New Year campaign, in Draft"* is one clause per axis, nested,
 * with the axis names and the values and the connectives all in one typeface. Two compared axes made
 * it three lines and a comma to count.
 *
 * ⚠️ The shape it becomes is the BAR TRANSPOSED. Same two words — `Showing` and `Against` — as the two
 * rows of the bar, turned into two columns. So the reference and the interface use one vocabulary and
 * one geometry, rotated, and nothing new has to be learned to read it.
 *
 *     Showing              Against
 *     audience   Nonprofits           Returning Customers
 *     campaign   Earth Day campaign   New Year campaign
 *
 *     Held still
 *     market     DACH market
 *     publication Draft
 *
 * ⚠️ Mono carries the DATA — the authored key and the value — and regular carries the words. That is
 * the distinction that lets a reader skip the words entirely on a second read, which is what a
 * reference is for. Note the tension with the chip hover card, where the raw condition was REMOVED for
 * brevity: this is not the same control. That one answers "what is this?" at a glance; this one is the
 * place to read the whole state, so the authored key belongs here and nowhere else in the bar.
 */
const NO_CHIPS: Chip[] = []

const isPair = (chip: Chip) => (chip.labels ?? chip.values).length === 2

function Key({children}: {children: ReactNode}) {
  return (
    <Text muted size={1} style={{fontFamily: MONO, whiteSpace: 'nowrap'}}>
      {children}
    </Text>
  )
}

function Value({children}: {children: ReactNode}) {
  return (
    <Text size={1} style={{fontFamily: MONO}}>
      {children}
    </Text>
  )
}

function Word({children}: {children: ReactNode}) {
  return (
    <Text muted size={1} weight="medium">
      {children}
    </Text>
  )
}

export function ComparisonSentence({
  chips,
  structural = NO_CHIPS,
}: {
  /** The variant dimensions. */
  chips: Chip[]
  /**
   * The structural axis — bundle — as a chip. (Two axes before D10; one since.)
   *
   * ⚠️ Passed as chips rather than as a `version` string, because they are comparable like any other
   * axis and a string could not express that. An earlier version took `version: string` and printed
   * it as context, which produced "Comparing Draft against Published, in Draft" — the compared axis
   * appearing a second time as the setting it is compared within. An axis is part of the comparison
   * or part of the context, never both.
   */
  structural?: Chip[]
}) {
  const all = [...structural, ...chips]
  const compared = all.filter((chip) => chip.compared && isPair(chip))
  /**
   * ⚠️ The "No release" exclusion is gone with the axis that had it. Under one bundle axis there is no
   * value meaning "not in a release" — the draft IS a bundle — so there is no absence to suppress.
   * One less special case, which is usually the sign a model got closer to true.
   */
  const held = all.filter((chip) => !chip.compared)

  /**
   * 🔴 OPTION B, chosen 2026-08-28 from six candidates in
   * `Comparison Surfaces / Reading the Address / Choose the layout`.
   *
   * *"I feel like the real table is probably the best because it kind of puts things in a proper
   * schema, almost, so there can be no confusion there... The real table with the dash seems like a
   * perfect way to show across as many axes."*
   *
   * The five that lost, recorded so the choice stays recoverable:
   *
   *   A  columns with room      the layout it replaced; alignment implied by spacing rather than shown
   *   C  stacked pairs          never breaks on a long value, but the tallest by far
   *   D  diff, −/+              instantly readable and wrong — it implies the second value REPLACED
   *                             the first, and a comparison is two addresses, not a change
   *   E  two whole addresses    *"also nice, but then it might be misleading because the same value
   *                             appears in both"*
   *   F  one line per axis      most compact; the arrow lands at a different x on every line, so the
   *                             comparison stops being a column and becomes something to find
   *
   * ⚠️ The `—` is what makes it work at any number of axes. A held-still axis is not MISSING from the
   * comparison, it is the SAME on both sides, and an em dash in the Against column says that in one
   * character — where a separate "Held still" section had to say it in a heading and then repeat the
   * entire two-column structure underneath it.
   *
   * The chrome is the price and it is worth paying here: this is a reference someone opened
   * deliberately, not an ambient surface, so looking like a small schema is what it should look like.
   */
  const rule = '1px solid var(--card-border-color)'
  const rows = [...compared, ...held]

  if (rows.length === 0) {
    return (
      <Text muted size={1} data-testid="comparison-sentence">
        Nothing is open. Add a dimension to narrow this to a particular audience, market, locale or
        channel.
      </Text>
    )
  }

  return (
    <Stack gap={3} data-testid="comparison-sentence">
      <Box style={{display: 'grid', gridTemplateColumns: 'auto 1fr 1fr'}}>
        <Box paddingBottom={2} paddingRight={3} style={{borderBottom: rule}} />
        <Box paddingBottom={2} paddingRight={3} style={{borderBottom: rule}}>
          <Word>Showing</Word>
        </Box>
        <Box paddingBottom={2} style={{borderBottom: rule}}>
          {compared.length > 0 ? <Word>Against</Word> : null}
        </Box>

        {rows.map((chip) => {
          const shown = chip.labels ?? chip.values
          return (
            <Fragment key={chip.key}>
              <Box paddingRight={3} paddingY={2} style={{borderBottom: rule}}>
                <Key>{chip.key}</Key>
              </Box>
              <Box paddingRight={3} paddingY={2} style={{borderBottom: rule}}>
                <Value>{shown[0]}</Value>
              </Box>
              <Box paddingY={2} style={{borderBottom: rule}}>
                {chip.compared && shown.length === 2 ? (
                  <Value>{shown[1]}</Value>
                ) : compared.length > 0 ? (
                  <Text muted size={1}>
                    —
                  </Text>
                ) : null}
              </Box>
            </Fragment>
          )
        })}
      </Box>

      {compared.length === 0 ? (
        <Text muted size={1}>
          Set a second value on any dimension to compare it against another.
        </Text>
      ) : null}
    </Stack>
  )
}

/**
 * Dimensions every workspace has, whether or not it uses variants at all.
 *
 * 🔴 These are chips like any other, and getting that wrong was the design's worst mistake so far.
 *
 * An earlier version treated the structural axis as **where you are standing** and variant
 * dimensions as **what you compare**, and gave publication a single-select control. Nothing
 * justified the split, and the cost was severe: draft against published, which is the most common
 * comparison in the product and the only one EVERY workspace can make, became impossible in the
 * control. Reported on review as "how do we compare drafts vs published? I don't see an option".
 *
 * The real distinction is not standing-versus-comparing. It is **bounded versus unbounded**:
 *
 * | | | |
 * | --- | --- | --- |
 * | Publication | 2 values, every workspace | permanent chip |
 * | Release | a handful, every workspace | permanent chip |
 * | Variant dimensions | however many a customer invented | reached through `Add` |
 *
 * A bounded, universal dimension can afford a permanent slot. An unbounded one cannot, and that is
 * the only reason `Add` exists. The shipped `VariantsStudioNavbar` already encodes exactly this with
 * its two controls, which is why it is two and not an arbitrary number.
 *
 * So a structural chip supports two values and the swap glyph, identically to a locale chip. It
 * differs in two ways only: it is always present, and it does not appear in the `Add` menu.
 */
export interface StructuralAxis {
  key: string
  label: string
  values: string[]
  /**
   * STUDIO: the version each value stands for (`drafts`, `published` or a release name), so the chip can draw the real
   * release avatar. A value with no entry draws as a release (the first active release's icon).
   */
  versionIds?: Record<string, string>
}

/**
 * ⚠️ Publication is real and bounded: a document is live or it is not. The release list is
 * FABRICATED, because a workspace's releases come from the releases store and a story cannot reach
 * one. The shape is the claim, not the names.
 */
/**
 * 🔴 ONE STRUCTURAL AXIS — THE BUNDLE. Reverses D10, on Pedro Bonamin's evidence, 2026-08-28.
 *
 * This was two axes, `publication` and `release`, on the reasoning that a document is independently
 * draft-or-published AND in-or-out-of a release. Put to Pedro directly, and he answered before the
 * question finished:
 *
 *     "Yeah yeah yeah. What you don't have [is] draft inside releases."
 *
 *     "They can be draft, publish[ed], or in a release — they are all states… it's the BUNDLE of the
 *      document, and then you have the VARIANT of the document. So it can only be in one bundle and it
 *      can only be in one variant right now, but it will be multiple variants eventually."
 *
 * So the model is `bundle × variant`, and a bundle is exactly one of: draft, published, a release, an
 * agent bundle. `{publication: Draft, release: Q3 launch}` was an address that cannot exist, and the
 * bar could not only express it — it opened in a version of it.
 *
 * ⚠️ The reason given for splitting them does not survive either. It was: *"if you want to compare two
 * releases, it wouldn't be possible if draft and published was in the same [control]."* Under one
 * bundle axis, comparing two releases IS possible — `bundle: Q3 launch ⇄ Spring campaign`, one axis
 * holding two values, which is the mechanism every comparison in this file already runs on. **The
 * split solved a problem the compare mechanism had already solved.**
 *
 * Which means the shipped single Version control was right on this point and the divergence was ours.
 * The values below are `VERSION_OPTIONS` — the same list the shipped bar offers — reached from the
 * opposite direction.
 *
 * ⚠️ STILL OPEN, and deliberately not settled here: Faheem's objection that a draft is "something you
 * haven't committed" and a release is "a bundle you put it into", which are orthogonal ideas. Pedro
 * agreed the OR is confusing ("Yeah yes") and the topic was left to be opened separately. This axis
 * reflects the model as it IS; whether draft-within-release should exist is recorded as its own
 * question rather than argued through a prototype.
 */
export const STRUCTURAL_AXES: StructuralAxis[] = [
  {
    key: 'bundle',
    label: 'Bundle',
    values: ['Draft', 'Published', 'Q3 launch', 'Spring campaign'],
  },
]

const STRUCTURAL_KEYS = new Set(STRUCTURAL_AXES.map((axis) => axis.key))

/** STUDIO: what `onRefuse` receives when `maxCompared` stops a second compared key. */
export const OPEN_BETA_REFUSAL = 'Open beta compares one dimension at a time'

/** The address a bar starts from: the draft bundle, no variant dimensions open. */
export function initialComposedAddress(): ComposedValues {
  return Object.fromEntries(STRUCTURAL_AXES.map((axis) => [axis.key, [axis.values[0]]]))
}

/**
 * The structural (publication/release) slice of an address, kept aside whenever a control is about
 * to replace the address wholesale. A document is always in some publication state on some release
 * track — that does not stop being true just because the control doing the replacing only knows
 * about the variant dimensions.
 */
function structuralSlice(address: ComposedValues): ComposedValues {
  return Object.fromEntries(Object.entries(address).filter(([key]) => STRUCTURAL_KEYS.has(key)))
}

export const VERSION_OPTIONS = ['Draft', 'Published', 'Q3 launch', 'Spring campaign'] as const

/**
 * A permanent chip for one structural axis.
 *
 * Two values is how a comparison starts on this axis, exactly as on a variant dimension: `Draft`
 * then `Published` produces `Draft ⇄ Published`, the comparison every workspace can make.
 *
 * 🔴 It is NOT multi-select, per the D18 reversal. The menu offers two distinct actions — go here,
 * and compare against this — so there is no "N selected" state to misread, and no third value to
 * refuse. The refusal used to be the mechanism; now the shape makes a third value unreachable.
 */
/**
 * The version glyph of a structural value, as the Variants 2.0 version chip draws it: the real release
 * avatar for Draft ("drafts"), Published, or a release (the fixture has no release types, so a release
 * takes the first C1 release's type icon).
 */
export function StructuralGlyph({
  value,
  versionIds,
}: {
  value: string
  versionIds?: Record<string, string>
}) {
  // STUDIO: a release's id comes from `StructuralAxis.versionIds`; the Storybook fixture used its first release.
  const version =
    versionIds?.[value] ??
    (value === 'Draft' ? 'drafts' : value === 'Published' ? 'published' : 'drafts')
  return <VersionGlyph version={version} />
}

function StructuralChip({
  axis,
  values,
  onSetValues,
  affordance = 'AC',
  comparable = true,
  instanceId,
  side,
  inert = false,
}: {
  axis: StructuralAxis
  values: string[]
  /** Writes the whole ordered axis at once: `[anchor]` or `[anchor, counterpart]`. */
  onSetValues: (key: string, next: string[]) => void
  compared: boolean
  affordance?: Affordance
  comparable?: boolean
  instanceId?: string
  /** Which end to draw, when the caller draws one row per side. See `AddressChip.side`. */
  side?: typeof ANCHOR | typeof COUNTERPART
  /**
   * Inert copies hold a column open on row two and must not be interactive — the eager-mount and
   * duplicate-id collision this file has hit four times. With `ChipSurface` this is now just "no
   * click handler and no popover", rather than a second rendering path.
   */
  inert?: boolean
}) {
  const ns = namespaced(instanceId)
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useDismissOnOutside(open, close)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, open])

  const shown = values.length > 0 ? values : [axis.values[0]]
  const axisIsCompared = shown.length === 2
  const drawn = side === undefined ? shown : [shown[side]].filter((value) => value !== undefined)
  const label = drawn.length === 2 ? `${drawn[0]} ⇄ ${drawn[1]}` : (drawn[0] ?? '')

  const surface = (
    <ChipSurface
      compared={axisIsCompared}
      Glyph={structuralValueIcon(axis.key, drawn[0] ?? axis.values[0])}
      hovered={hovered && !inert}
      onClick={inert ? undefined : () => setOpen((was) => !was)}
      onHoverChange={inert ? () => {} : setHovered}
      studioGlyph={
        <StructuralGlyph value={drawn[0] ?? axis.values[0]} versionIds={axis.versionIds} />
      }
      testId={inert ? undefined : ns(`structural-chip-${axis.key}`)}
      text={label}
    >
      <Text size={1} style={{whiteSpace: 'nowrap'}}>
        {label}
      </Text>
    </ChipSurface>
  )

  if (inert) return surface

  return (
    <Popover
      content={
        <div data-pane-part="">
          <Box padding={2} style={{minWidth: 240}}>
            <AffordanceValueList
              affordance={affordance}
              comparable={comparable}
              idPrefix={ns(axis.key)}
              // A bundle has no unset state — a document is always in one — so the last is kept.
              keepLast
              onChange={(next) => {
                onSetValues(axis.key, next)
                // Closes on selection, like every other menu in the bar.
                close()
              }}
              options={axis.values}
              values={shown}
            />
          </Box>
        </div>
      }
      open={open}
      placement="bottom-start"
      portal
    >
      <Box data-pane-part="" style={{flex: 'none'}}>
        {surface}
      </Box>
    </Popover>
  )
}

/**
 * The variant picker for the `single` rendering, modelled on the shipped `VariantsMenu`: a filter
 * input, a default entry for "no variant", a divider, then the definitions under a muted heading.
 *
 * The fidelity matters here more than anywhere else on this page. This is the control a reviewer
 * compares against what Studio ships, so it borrows the shipped structure rather than inventing a
 * tidier one — including the search over titles AND condition values, which is what
 * `filterVariantsForSearch` does.
 */
function SingleVariantMenu({
  variants,
  address,
  onChange,
  label,
  valueLabels,
}: {
  variants: SystemVariant[]
  address: ComposedValues
  onChange: (next: ComposedValues) => void
  /**
   * Computed by the caller, which also renders it as the chip's `PerspectiveFilter` label. Passed in
   * rather than derived twice: an earlier version computed it in both places and the two drifted
   * within the hour, so the button said `dach` while the chip beside it said `DACH market`.
   */
  label: string
  valueLabels: Map<string, string>
}) {
  const [query, setQuery] = useState('')
  // 🔴 `address` always carries `publication`/`release`, so an unfiltered key count is never zero —
  // this menu would show "All variants" as unselected even when no variant dimension was open.
  const hasVariant = Object.keys(address).some((key) => !STRUCTURAL_KEYS.has(key))

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    // Only single-condition definitions can be selected here: this rendering has one slot, so a
    // compound definition would be selectable but unrepresentable. That is the limitation, kept
    // honest rather than hidden.
    const selectable = variants.filter((variant) => Object.keys(variant.conditions).length === 1)
    if (!needle) return selectable

    return selectable.filter((variant) =>
      [
        variant.metadata?.title ?? '',
        variant._id,
        ...Object.entries(variant.conditions).flat(),
      ].some((value) => value.toLowerCase().includes(needle)),
    )
  }, [query, variants])

  return (
    <MenuButton
      id="composed-single-variant-menu"
      button={
        <Button
          data-testid="single-variant-filter"
          icon={RhombusIcon}
          iconRight={ChevronDownIcon}
          mode="bleed"
          text={label}
        />
      }
      onClose={() => setQuery('')}
      menu={
        <Menu padding={0} style={{minWidth: 260, maxWidth: 320}}>
          <Box padding={2}>
            <TextInput
              fontSize={1}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Filter variants"
              radius={2}
              value={query}
            />
          </Box>

          <Box paddingX={2} paddingBottom={1}>
            <MenuItem
              onClick={() => {
                // `{}` would also drop `publication`/`release` — there is no such thing as a
                // document with no publication state, so this resets to the same structural
                // defaults the bar starts from rather than wiping them out.
                onChange(initialComposedAddress())
                setQuery('')
              }}
              pressed={!hasVariant}
              selected={!hasVariant}
              text="All variants"
            />
          </Box>

          <MenuDivider />

          <Box paddingX={2} paddingTop={2} paddingBottom={1}>
            <Text
              muted
              size={0}
              weight="medium"
              style={{textTransform: 'uppercase', letterSpacing: '0.04em'}}
            >
              {filtered.length === variants.length ? 'Variants' : `${filtered.length} matching`}
            </Text>
          </Box>

          <Box paddingX={2} paddingBottom={2} style={{maxHeight: 280, overflowY: 'auto'}}>
            {filtered.length === 0 ? (
              <Box padding={3}>
                <Text muted size={1}>
                  Nothing matches
                </Text>
              </Box>
            ) : (
              filtered.map((variant) => {
                const [key, value] = Object.entries(variant.conditions)[0]
                const isSelected = address[key]?.length === 1 && address[key][0] === value
                return (
                  <MenuItem
                    key={variant._id}
                    icon={axisIcon(key)}
                    onClick={() => {
                      // Picking a definition replaces the address outright, same as `onChange({})`
                      // above did — carry the structural slice forward so choosing a variant does
                      // not silently reset which draft/release the bar was pointed at.
                      onChange({...structuralSlice(address), [key]: [value]})
                      setQuery('')
                    }}
                    pressed={isSelected}
                    selected={isSelected}
                    // Falls back to the raw condition when a definition has no title, which some
                    // fixture definitions deliberately lack.
                    text={
                      variant.metadata?.title ??
                      valueLabels.get(`${key}=${value}`) ??
                      `${facetLabel(key)}: ${value}`
                    }
                  />
                )
              })
            )}
          </Box>
        </Menu>
      }
      /*
        🔴 NO `constrainSize`. Reported: the Variant dropdown in the shipped-fidelity rendering did not
        appear — and it did appear, at 2px tall, which is the thin bar visible under the pill.

        `constrainSize: true` clamps the popover to the space its boundary allows, and here it resolved
        to 2px in every story. The 109 menu items were laid out inside a 2px box with the overflow
        hidden, so the control was open and invisible at the same time.

        ⚠️ PRE-EXISTING, and I had verified this control repeatedly without ever opening it — the
        structural-key leak fix measured its LABEL three times and never clicked the chevron. A control
        can be correct in everything you measured and broken in the one thing you did not.

        Height is capped on the menu's own `Box` instead, which is how `AxisPane` does it: the same
        protection against a 40-value list running off the screen, without depending on a boundary
        computation that can resolve to nothing.
      */
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

// --- the control -------------------------------------------------------------------------------

export interface ComposedAddressBarProps {
  /**
   * `single` renders as the two-filter bar Studio ships today. `composed` renders the assembled
   * form. Same state either way, so switching is a rendering decision, not a data migration.
   */
  mode?: 'single' | 'composed'
  facets: ConditionFacet[]
  address: ComposedValues
  onChange: (next: ComposedValues) => void
  /** The one axis being compared, if any. Rendered differently and exempt from collapsing. */
  comparedKey?: string
  /** Structural version axis, which every workspace has whether or not it uses variants. */
  version?: string
  /**
   * STUDIO: the bundle axis, with its real values (Draft, Published, one per release). Defaults to the fixed four of
   * `STRUCTURAL_AXES`. The key stays `bundle`.
   */
  structuralAxes?: StructuralAxis[]
  /**
   * STUDIO: at most this many keys may be compared at once. Default unlimited. Open beta compares one dimension at a time;
   * the bundle (Draft, Published or a release) is ONE axis (D10), so `bundle ⇄` plus `market ⇄` is two keys. A change that
   * would compare more is not applied, and `onRefuse` is called instead.
   */
  maxCompared?: number
  /** STUDIO: called with the reason when `maxCompared` refuses a change. */
  onRefuse?: (reason: string) => void
  /** Definitions, used only to look up a title for the `single` rendering. */
  variants?: SystemVariant[]
  /**
   * `inline` puts the whole address on one row. `tiers` splits it: the full address on top, only
   * what differs beneath.
   *
   * Reviewed as *"makes the most sense when there's enough space"*, and it survives the move to a
   * composed address unchanged. It arguably fits BETTER: the second row is by definition "the
   * dimensions that differ", which is exactly what a composed comparison has and a single-slot
   * picker never did.
   */
  layout?: 'inline' | 'tiers'
  /**
   * Keep row two's height whether or not anything is being compared.
   *
   * 🔴 **This reverses a decision, and the reason is a measurement.** Row two used to be absent until
   * something differed — *"absent rather than present-and-empty, so the bar reserves no height for a
   * row with nothing to say."* Reasonable, and it turned out to break one of the four affordance
   * rules: **nothing moves while the reader is aiming at it.**
   *
   * Measured 2026-08-31, starting a comparison from a field's own gutter mark:
   *
   * ```
   * bar wrapper          44 → 79px     +35
   * document header     174 → 209      +35
   * field label         224 → 259      +35
   * field input         257 → 292      +35
   * the gutter mark     258 → 311      +53   ← +35 from the bar, +18 of its own
   * ```
   *
   * Reported: *"my cursor does not align with the position of the change indicator itself. That's
   * because the perspective bar on top grew and pushed against the page."* Exactly right — the
   * control that started the comparison is 53px below the cursor that clicked it.
   *
   * ⚠️ **And our own gate missed it.** `pnpm affordance` checks that rule across WIDTHS and never
   * across STATE CHANGES, so it reported 11/11 while this happened.
   *
   * ## Why reserving is affordable, which is the part that makes it a decision rather than a trade
   *
   * A reserved row is only waste if it stays empty. It is not going to:
   *
   * \> *"The perspective bar, which can be a combination of the first row being the perspective bar
   * \> and the second row being filters, which we haven't implemented right now. That empty space
   * \> might be for filtering."*
   *
   * So row two is the filter row, and it holds the counterpart when a comparison exists. Two things
   * that never need to be visible at once, sharing one reserved height — which is why the height can
   * be constant.
   *
   * ⚠️ **The constraint this puts on filters:** a filter row that grows as filters are added
   * recreates the exact bug this reserves the row to fix. Whatever goes in here has to have a fixed
   * height, or overflow within it.
   *
   * Rejected alternatives, and why:
   * - **sticky or overlaid row** — stops the push and replaces it with occlusion, and what it covers
   *   is the first field, where the reader is looking. Also strays from Studio's layout architecture.
   * - **compensating scroll** — the only option that keeps content genuinely still, and it needs
   *   scroll headroom the top of a document does not have.
   * - **one row, `Draft ⇄ Published`** — the bar never changes height, and it reverses page 1's
   *   two-row decision. *"I like option B, but I think that strays from the studio's clear
   *   architecture, so I would not go with option D."*
   */
  reserveSecondRow?: boolean
  /**
   * What occupies row two when nothing is being compared. The filter row, once filters exist.
   *
   * Only rendered when `reserveSecondRow` is on, and replaced by the counterpart row the moment a
   * comparison starts — so the two never compete for the same height.
   */
  secondRow?: ReactNode
  /**
   * Print the axis name inside compared chips — `👥 Audience New Visitors`.
   *
   * ⚠️ Off by default, and it was on for about an hour. It was decision C's answer to "the chip only
   * hints at its axis with a glyph", and it is the wrong answer: it spends permanent width on every
   * compared chip, and in a two-row comparison it prints the axis name twice, which is the
   * duplication that had to be removed again immediately.
   *
   * Hover is the better answer to the same question — it names the axis on demand, spends no width,
   * and works for EVERY chip rather than only compared ones. Kept as an option so the two can be
   * compared on screen rather than argued about.
   */
  axisLabels?: boolean
  /**
   * How the variant chips are ordered.
   *
   * `address` is the order the dimensions were opened in — what the bar did until now, kept so the
   * two can be compared on screen. `compared-first` groups what differs to the left.
   */
  chipOrder?: 'address' | 'compared-first'
  /** Show the sentence beneath the bar. Optional and switchable, never part of the layout. */
  sentence?: boolean
  /**
   * Which value-menu affordance to render. Defaults to `current`, which is what the twenty-odd
   * existing stories expect, so adding this changed none of them.
   *
   * See `addressAffordance.tsx` for the question this decides.
   */
  affordance?: Affordance
  /* ──────────────────────────────────────────────────────────────────────────────────────────────
     PANE SCOPE. Four props, and they are the whole difference between this bar in the navbar and
     the same bar above one column of a comparison.

     🔴 A new component was built twice before this, and both were wrong in opposite directions —
     hand-rolled chips that lost the value pane's search field, then a wholesale copy of the
     designer's prototype pill. Reported: *"That was just a reference for the type of thing, not the
     actual instance itself."*

     Reading the render settled it. For a single-valued address:

     - `isComparing` is `comparedChips.length > 0 || comparedStructural.length > 0`, and "compared"
       means a key holding TWO values. A pane holds one. **Row two is already unreachable**, so
       `layout="inline"` needs no new code to suppress it.
     - `ceiling` is not a rendered meter, it is the capacity guard inside `AddDimensionMenu`, and its
       `sides` derives from `sideCount(address)` — 1 for a pane. **Already correct.**
     - `ChipZone`'s `ResizeObserver` ladder was the thing I first planned to remove, and it is the
       single most valuable part to keep: a 350px column is exactly where a collapse ladder earns
       its place.

     So a pane bar is this bar in a narrower scope, not a smaller bar. Four props, below.
     ────────────────────────────────────────────────────────────────────────────────────────────── */
  /**
   * The leading `Showing` / `Against` label.
   *
   * Off in a pane. It costs `ROW_LABEL_WIDTH` — 72px, a fifth of a 350px column — and it labels the
   * wrong thing: a pane is named by its own header, and "Showing" is only meaningful opposite an
   * "Against" that a pane never has.
   */
  rowLabel?: boolean
  /**
   * The `Clear` button.
   *
   * Off in a side pane, because there the word means something else. Globally, clear resets the
   * address. On a side, "nothing different from base" is what removing each chip already does, and
   * it lands through `unsetOnSide`, which makes the pane inherit rather than lose the axis. One verb
   * per control.
   */
  clearable?: boolean
  /**
   * Which collapse rung to render, lifted out of `ChipZone`'s own measurement.
   *
   * 🔴 This is what makes the rack read horizontally. Left to itself, each pane measures its own
   * width and picks its own rung, so a wide pane shows full chips beside a narrow one showing
   * glyphs — and a comparison is read ACROSS panes, so the same dimension has to sit in the same
   * place in each. The rack takes the narrowest pane's rung and gives it to all of them.
   *
   * The cost is stated: the widest pane gives up text it had room for. Worth it, and it is the same
   * argument the two-row layout already makes vertically — alignment is what carries the meaning.
   */
  rung?: Rung
  /** Reports the rung this bar would choose on its own, so a rack can take the smallest. */
  onRung?: (rung: Rung) => void
  /**
   * Whether a second value is reachable from any value menu in this bar.
   *
   * Off in a pane, and it is the ONLY capability a pane actually gives up. See
   * `AffordanceValueListProps.comparable`.
   */
  comparable?: boolean
  /**
   * Namespace for every test id this bar renders. Required whenever more than one bar is on the page.
   *
   * See `namespaced`. Omitted, every id is exactly what it was, so no existing story or gate moved.
   */
  instanceId?: string
}

export function ComposedAddressBar({
  mode = 'composed',
  facets,
  address,
  onChange: onChangeProp,
  version = 'Draft',
  structuralAxes,
  maxCompared,
  onRefuse,
  variants = fallbackVariants,
  reserveSecondRow = false,
  secondRow,
  layout = 'tiers',
  sentence = true,
  affordance = 'AC',
  axisLabels = false,
  chipOrder = 'compared-first',
  comparable = true,
  instanceId,
  rowLabel = true,
  clearable = true,
  rung: rungOverride,
  onRung,
}: ComposedAddressBarProps) {
  const chrome = useCsChrome()
  const structural = structuralAxes ?? STRUCTURAL_AXES
  // STUDIO: every write goes through here, so `maxCompared` holds for every menu in the bar.
  const onChange = useCallback(
    (next: ComposedValues) => {
      if (maxCompared !== undefined) {
        const comparedKeys = Object.values(next).filter(isCompared).length
        if (comparedKeys > maxCompared) {
          onRefuse?.(OPEN_BETA_REFUSAL)
          return
        }
      }
      onChangeProp(next)
    },
    [maxCompared, onChangeProp, onRefuse],
  )
  const ceiling = ceilingFor(address)
  // The version axis is structural and independent of the variant address, so it holds its own
  // state here rather than being lifted. `version` seeds it.
  const [activeVersion, setActiveVersion] = useState(version)
  const valueLabels = useValueLabels(variants)

  // Variant chips only. The structural axes have permanent controls of their own, so including them
  // here would render each of them twice.
  const chips = useMemo<Chip[]>(() => {
    const built = Object.entries(address)
      .filter(([key]) => !STRUCTURAL_KEYS.has(key))
      .map(([key, values]) => ({
        key,
        values,
        labels: values.map((value) => valueLabels.get(`${key}=${value}`) ?? value),
        /*
          🔴 DERIVED, NEVER ASSERTED — and `comparedKey` used to be able to assert it.

          `AddressChip` has carried this comment for days: *"`chip.compared` is therefore DERIVED,
          not asserted. A caller passing `compared` on a single-valued chip is describing a state that
          cannot exist."* The invariant was enforced where it was documented and nowhere else; one
          layer up, `key === comparedKey ||` did exactly the forbidden thing.

          Two reported symptoms, one cause. The playground stories pass `comparedKey="audience"`, so
          the moment a single value was set on audience:

            - row two appeared, for a comparison nobody had asked for, holding a chip with no value
            - every held-still chip collapsed to a glyph with room to spare, because R3's semantic
              trigger fires whenever the bar believes it is comparing

          `comparedKey` survives as what it should always have been: a hint about WHICH axis names a
          comparison when several are compared. It cannot bring one into being.
        */
        compared: values.length === 2,
      }))

    if (chipOrder === 'address') return built

    /*
      🔴 COMPARED CHIPS FIRST, THEN HELD-STILL, CANONICAL ORDER WITHIN EACH.

      Reported: *"I'm wondering if there's a row of collapsed icons, and then I choose, let's say,
      one, two, three. One is open, three is open, and two is closed. It looks weird to have two
      sitting there somewhere in the middle."*

      It does, and the sentence that follows it is what settles the argument: *"depending on the order
      that you open it, it is the order that is being presented."*

      That is the case against keeping the order, not for it. Insertion order looks like it carries
      the reader's own intent — a layout they built and might remember — and it does not: it is an
      accident of the sequence they happened to click in, different for two people looking at the same
      address. There is nothing there worth protecting, so the reflow cost of sorting buys something
      for free.

      Reordering does mean chips MOVE when you start comparing, and we have twice rejected motion of
      exactly that kind — the peek jump, the hover push. The difference is what the motion means.
      Those moved things while the reader was doing something else. This moves a chip at the moment
      the reader changed that chip's state, and the movement says what changed: it has crossed from
      "held still" into "what differs".

      Two consequences worth having:

        - row two becomes CONTIGUOUS. Today its real chips are separated by invisible spacers holding
          columns open under held-still chips, so the counterparts are scattered across gaps. Grouped
          left, row two is a solid block directly beneath its partners.
        - priority now decreases left to right, and the ladder already degrades right to left — it
          folds held-still chips before compared ones. Order and degradation finally agree, and the
          `+N` lands at the right-hand end where everything else that has given way already is.

      Within each group the order is the FACET order, not the address's. Facet order is the same for
      every reader in every session; address order is whoever clicked what first.
    */
    const facetIndex = new Map(facets.map((facet, index) => [facet.key, index]))
    const rank = (chip: Chip) => facetIndex.get(chip.key) ?? Number.MAX_SAFE_INTEGER
    return [...built].sort((a, b) => {
      if (a.compared !== b.compared) return a.compared ? -1 : 1
      return rank(a) - rank(b)
    })
  }, [address, chipOrder, facets, valueLabels])

  const comparedChips = useMemo(() => chips.filter((chip) => chip.compared), [chips])

  /**
   * The rung, owned here so both rows sit at the same one. See `ChipZone.rung`.
   *
   * 🔴 And this is now the MIDDLE of three levels, which is worth naming because it recurs exactly:
   *
   * ```
   * rack   takes the narrowest pane's rung, gives it to every pane   so panes align across
   * bar    takes row one's rung, gives it to row two                 so rows align down
   * zone   measures hidden clones at every rung, reports the fit     the only thing that measures
   * ```
   *
   * Each level renders at the rung handed down and reports the rung it would have chosen. The same
   * two props, three times, so a level can be inserted without any of them learning about it.
   */
  const [measuredRung, setMeasuredRung] = useState<Rung>('full')
  const rung = rungOverride ?? measuredRung
  const setRung = useCallback(
    (next: Rung) => {
      setMeasuredRung(next)
      onRung?.(next)
    },
    [onRung],
  )

  /** The structural axes as chips, for the sentence. Comparable like any other axis. */
  const structuralChips = useMemo<Chip[]>(
    () =>
      structural.map((axis) => {
        const values = address[axis.key] ?? [axis.values[0]]
        return {key: axis.key, values, compared: values.length === 2}
      }),
    [address, structural],
  )

  /**
   * 🔴 WHAT EACH AXIS LAST HELD, so switching it back on restores rather than guesses.
   *
   * *"you want to quickly see what something looks like in a different perspective, but you don't
   * want to have to come and select all of that again. If you've made a selection, then it should read
   * in that selection, and you simply disable that, and then you can enable that again, scoped to the
   * last one."*
   *
   * ⚠️ It stores the WHOLE axis, so a compared pair comes back as a pair. That is the case the memory
   * earns its keep on: rebuilding `New Visitors against Returning Customers` by hand is four actions,
   * and it is exactly the state someone toggles off to peek past and then wants back.
   *
   * Session-scoped and deliberately so. A remembered coordinate that outlived the session would be a
   * stored preference, which is a different thing needing a different conversation.
   */
  const [remembered, setRemembered] = useState<Record<string, RememberedAxis>>({})

  const onToggleAxis = useCallback(
    (key: string) => {
      const current = address[key] ?? []
      if (current.length > 0) {
        // Records how many dimensions the address held WITH this axis in it, which is what makes the
        // restore checkable later. See `RememberedAxis`.
        setRemembered((was) => ({
          ...was,
          [key]: {values: current, dimensionsThen: definitionCount(address)},
        }))
        onChange(removeKey(address, key))
        return
      }
      const restore = remembered[key]
      if (!restore || restore.values.length === 0) return
      onChange({...address, [key]: restore.values})
    },
    [address, onChange, remembered],
  )

  /** Shared across both rows, so only one chip's pane is ever open. See `OpenPaneContext`. */
  const [openKey, setOpenKey] = useState<string | null>(null)
  const openPane = useMemo<OpenPane>(() => ({openKey, setOpenKey}), [openKey])

  /** Structural axes holding two values. They compare without appearing in the variant chip zone. */
  const comparedStructural = useMemo(
    () => structural.filter((axis) => (address[axis.key] ?? []).length === 2),
    [address, structural],
  )

  /**
   * Write a whole ordered axis at once. The affordance options need this because they do not think
   * in toggles: `setAnchor` and `setCounterpart` both compute the full next list.
   *
   * An emptied structural axis is refused rather than written, for the same reason
   * `onToggleStructural` keeps the last value: there is no such thing as a document with no
   * publication state.
   */
  const onSetValues = useCallback(
    (key: string, next: string[]) => {
      const updated = {...address}
      if (next.length === 0) {
        if (STRUCTURAL_KEYS.has(key)) return
        delete updated[key]
      } else {
        updated[key] = next
      }
      onChange(updated)
    },
    [address, onChange],
  )

  const onRemoveDimension = useCallback(
    (key: string) => {
      const next = {...address}
      delete next[key]
      onChange(next)
    },
    [address, onChange],
  )

  // The single rendering: exactly the shipped bar. Two `PerspectiveFilter`s with the prefixes
  // `Version` and `Variant`, the release avatar on one and the rhombus on the other. A reviewer
  // should not be able to tell this apart from `VariantsStudioNavbar` at a glance, because that is
  // the whole claim being made.
  if (mode === 'single') {
    // 🔴 `address` always carries the structural keys (`publication`, `release`) via
    // `initialComposedAddress()`. Reading `Object.keys(address)` unfiltered here meant `hasVariant`
    // was true even with no variant dimension open — the bar claimed a variant was active, painted
    // itself `tone="suggest"`, and then went on to list "Draft, No release" inside the VARIANT
    // control, which is exactly what the separate Version control already shows.
    const variantEntries = Object.entries(address).filter(([key]) => !STRUCTURAL_KEYS.has(key))
    const hasVariant = variantEntries.length > 0
    const title = definitionTitleFor(address, variants)

    // Today's bar shows the definition's TITLE. When the address composes several definitions no
    // title exists, so this falls back to listing values — and that fallback is the limitation made
    // visible, not a cosmetic shortcut. A reviewer should read it as "this rendering has run out".
    const variantLabel = hasVariant
      ? (title ??
        variantEntries
          .flatMap(([key, values]) => values.map((v) => valueLabels.get(`${key}=${v}`) ?? v))
          .join(', '))
      : 'All variants'

    return (
      <Card borderBottom paddingX={3} paddingY={2} tone={hasVariant ? 'suggest' : 'neutral'}>
        <Flex align="center" gap={2} justify="center" wrap="wrap">
          {/*
            Today's bar has ONE version control covering publication and releases together, and one
            variant control. Two, not three. So this rendering keeps the combined single-select
            rather than borrowing the composed form's separate structural chips: the whole claim of
            this mode is that it is indistinguishable from what ships.
          */}
          <PerspectiveFilter prefix="Version" tone="default" label={activeVersion}>
            <MenuButton
              id="single-version-menu"
              button={
                <Button
                  data-testid="single-version-button"
                  icon={<ReleaseAvatarIcon releaseType="scheduled" />}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  text={activeVersion}
                />
              }
              menu={
                <Menu>
                  {VERSION_OPTIONS.map((option) => (
                    <MenuItem
                      key={option}
                      onClick={() => setActiveVersion(option)}
                      pressed={option === activeVersion}
                      selected={option === activeVersion}
                      text={option}
                    />
                  ))}
                </Menu>
              }
              popover={{placement: 'bottom-start', portal: true}}
            />
          </PerspectiveFilter>

          <PerspectiveFilter
            prefix="Variant"
            tone={hasVariant ? 'suggest' : 'default'}
            label={variantLabel}
            // `onChange({})` would drop `publication`/`release` along with the variant — there is
            // no such thing as a document with no publication state. Reset to the same structural
            // defaults `initialComposedAddress()` gives a fresh bar, same as the composed
            // rendering's own "Clear" button does.
            onRemove={hasVariant ? () => onChange(initialComposedAddress()) : undefined}
            removeLabel={hasVariant ? 'Clear the variant' : undefined}
          >
            <SingleVariantMenu
              address={address}
              label={variantLabel}
              onChange={onChange}
              valueLabels={valueLabels}
              variants={variants}
            />
          </PerspectiveFilter>
        </Flex>
      </Card>
    )
  }

  /**
   * Whether the address describes two points rather than one. Structural axes count: draft against
   * published is the commonest comparison there is, and it lives in those slots.
   */
  const isComparing = comparedChips.length > 0 || comparedStructural.length > 0

  /**
   * One row of the bar. The side decides which end of every compared axis it draws.
   *
   * 🔴 Decision A (2026-08-27). The old single row rendered `A ⇄ B` inside one chip, and reported in
   * review as needing a sentence underneath to be understood at all. The diagnosis: a row of chips
   * can only describe ONE point, and a comparison is two — so the row was not merely terse, it was
   * claiming something untrue, and no copy inside it could fix that.
   *
   *     Showing   ⏱ Draft   ≡ No release   ⌘ DACH   🌐 de-DE   👥 Audience New Visitors
   *     Against                                                👥 Audience Returning Customers
   *
   * The empty space on row two IS the sentence's clause "everything else is held still". Silence
   * carries it, and it scales where prose does not: two compared axes read instantly as two filled
   * columns, while the prose version becomes a subordinate clause nobody finishes.
   *
   * It also absorbs the one axis with no control yet. Comparing across TIME is `⏱ Draft` above
   * `⏱ Published` — no special case, which is a good sign for a model.
   *
   * Both rows come from this one function so they cannot disagree, the same reason `planFor` is
   * shared between the visible and measured rows.
   */
  const renderRow = (side: typeof ANCHOR | typeof COUNTERPART) => {
    const isCounterpart = side === COUNTERPART
    return (
      <Flex align="center" gap={2} wrap="nowrap">
        {rowLabel ? (
          <Box paddingX={1} style={{flex: 'none', width: ROW_LABEL_WIDTH}}>
            <Text muted size={1} weight={isCounterpart ? 'medium' : undefined}>
              {isCounterpart ? 'Against' : 'Showing'}
            </Text>
          </Box>
        ) : null}

        {/* Permanent, and comparable. Bounded and universal, so they can afford a fixed slot. */}
        {structural.map((axis) => {
          const values = address[axis.key] ?? []
          const axisCompared = values.length === 2
          const ghost = isCounterpart && !axisCompared

          const draw = (which: typeof ANCHOR | typeof COUNTERPART, inert: boolean) => (
            <StructuralChip
              affordance={affordance}
              comparable={comparable}
              instanceId={instanceId}
              axis={axis}
              compared={axisCompared}
              inert={inert}
              onSetValues={onSetValues}
              // Same reason as the variant spacers: a ghost draws the anchor so it holds the column
              // open at the right width. See `ChipZone`.
              side={isComparing ? which : undefined}
              values={values}
            />
          )

          if (ghost) {
            return (
              <Box aria-hidden key={axis.key} style={{flex: 'none', visibility: 'hidden'}}>
                {draw(ANCHOR, true)}
              </Box>
            )
          }

          if (!axisCompared) {
            return (
              <Box key={axis.key} style={{flex: 'none'}}>
                {draw(side, false)}
              </Box>
            )
          }

          /*
            🔴 A COMPARED SLOT RESERVES THE WIDTH OF BOTH ENDS.

            Measured, on the story that compares publication AND release: row two's release chip sat
            29px right of row one's, because "Draft" is 81px and "Published" is 111px, so everything
            after the first compared column started late. One compared axis aligned perfectly and two
            did not — the drift is the accumulated difference of the pairs before it.

            Both ends are stacked in ONE grid cell, so the cell takes the width of the wider and the
            column is identical on both rows by construction. Better than reserving `A ⇄ B`, which
            would spend the width of both plus the glyph; this spends the width of the wider one.

            The hidden copy is `inert` for the reason every hidden thing in this file is: `MenuButton`
            mounts its menu eagerly, and a hidden duplicate would carry a duplicate id.
          */
          return (
            <Box
              key={axis.key}
              // `stretch`, matching the variant chips: a compared pair is two ends of one thing, so
              // 81px above 111px reads as a mistake. Both take the reserved width, which is the wider.
              style={{display: 'grid', flex: 'none', justifyItems: 'stretch', position: 'relative'}}
            >
              {isCounterpart ? <PairLink /> : null}
              {([ANCHOR, COUNTERPART] as const).map((which) => (
                <Box
                  aria-hidden={which === side ? undefined : true}
                  key={which}
                  style={{gridArea: '1 / 1', visibility: which === side ? undefined : 'hidden'}}
                >
                  {draw(which, which !== side)}
                </Box>
              ))}
            </Box>
          )
        })}

        {/*
          🔴 THE DIVIDER IS GONE. In its place, the shipped variant marker.

          Reported: *"I'm not sure if that arbitrary line between the two fixed ones and the non-fixed
          ones is really needed, because what is it really trying to say?"*

          Nothing a reader could use. It was separating structural axes from variant axes, which is a
          distinction in our code rather than in anyone's head — publication and market are both just
          "where I am".

          What IS worth marking is that everything after this point is a VARIANT, and Studio already
          has that mark: the rhombus, which prefixes the variant control in the shipped perspective
          bar (`Variant ◆ Spanish Festival`). So the line that said nothing becomes a glyph that says
          the one thing worth saying, in the vocabulary the reader has already met.

          Row two keeps the space and drops the mark: a marker with nothing after it is noise.
        */}
        {/* Only when there is something to mark. *"That icon on its own has no real purpose. It only
            needs to show up when there is a variant selected."* A marker with an empty zone after it
            marks nothing, and the bar has spent all day shedding things that said nothing. */}
        {chips.length > 0 ? (
          <Box style={{flex: 'none', visibility: isCounterpart ? 'hidden' : undefined}}>
            <Text muted size={1}>
              <RhombusIcon />
            </Text>
          </Box>
        ) : null}

        {chips.length > 0 ? (
          <>
            <ChipZone
              affordance={affordance}
              comparable={comparable}
              instanceId={instanceId}
              chips={chips}
              facets={facets}
              ghostUncompared={isCounterpart}
              labelCompared={axisLabels && isComparing}
              onRemove={onRemoveDimension}
              onRung={isCounterpart ? undefined : setRung}
              onSetValues={onSetValues}
              // Row two always follows row one. Row one follows the rack, or measures.
              rung={isCounterpart ? rung : rungOverride}
              side={isComparing ? side : undefined}
              valueLabels={valueLabels}
            />
          </>
        ) : isCounterpart ? (
          /*
            Row two says nothing here. The "no dimensions open" line describes THE ADDRESS, not one
            side of it, so printing it on both rows printed it twice — visible on the
            draft-against-published story, which has a compared structural axis and no variant chips
            at all. A per-row fallback for a whole-address statement is the wrong shape.
          */
          <Box flex={1} />
        ) : (
          /*
            ⚠️ THE SENTENCE IS GONE, AND IT WAS FALSE.

            It read "No dimensions open, so this is the base content every visitor sees" — while the
            publication chip said `Draft`. Reported exactly: *"The base content every visitor sees is
            actually the published version, not the draft."*

            Right, and the bug is deeper than the wording. The sentence described the VARIANT
            dimensions being empty while claiming something about what visitors see, which depends on
            the publication axis it was ignoring. It could only ever be true by accident.

            *"This text copy doesn't need to necessarily say anything."* Agreed — an empty variant zone
            is not a state that needs narrating. The `Add` control is right there and now says what it
            does, which is the only thing the sentence was usefully conveying.
          */
          <Box flex={1} />
        )}

        {/*
          🔴 `Add` LIVES AT THE END OF THE ROW, after the chips.

          It used to sit between the structural chips and the variant chips, and reported as feeling
          arbitrarily placed — *"it made sense in the past when it was just a single line... now it
          feels like it's somewhere in the middle of the layout."*

          The original reasoning was that `Add` heads the variant zone, so it belonged at that zone's
          start. That reads as a boundary marker only while the zone is empty. Once there are chips
          either side of it, it stops looking like the start of anything and starts looking like a
          chip that wandered in.

          At the end it is a continuation — the same place a tag input puts its `+`, and the same
          reading order as the sentence it replaces: this is where I am, these are the dimensions,
          add another. The divider is then free to do its actual job, which is separating the
          structural axes from the variant ones.
        */}
        <Box
          aria-hidden={isCounterpart || undefined}
          style={{flex: 'none', visibility: isCounterpart ? 'hidden' : undefined}}
        >
          <AddDimensionMenu
            address={address}
            affordance={affordance}
            comparable={comparable}
            instanceId={instanceId}
            ceiling={ceiling}
            facets={facets}
            inert={isCounterpart}
            onSetValues={onSetValues}
            onToggleAxis={onToggleAxis}
            remembered={remembered}
            valueLabels={valueLabels}
          />
        </Box>

        {/*
          🔴 THE SENTENCE IS BEHIND THIS ICON, not on a row of its own.
          *"the sentence 'off' could become a question icon, a tooltip icon of sorts, and it only
          shows in a hover card instead of becoming a new line."*

          Which is where the sentence was always heading. It started as an optional row, was demoted
          to "the only NAME a comparison can have" once the two-row layout took over explaining, and
          a name does not need a permanent line — it needs somewhere to be looked up. A row costs
          height whether or not anyone reads it; an icon costs 25px and answers on demand.

          The bar is now the explanation and the sentence is the reference, which is the right way
          round. Nothing here has to be read to understand the state.
        */}
        {sentence && !isCounterpart ? (
          <Box style={{flex: 'none'}}>
            <SentenceHint chips={chips} structural={structuralChips} />
          </Box>
        ) : null}

        {clearable && chips.length > 0 ? (
          <Box
            aria-hidden={isCounterpart || undefined}
            style={{flex: 'none', visibility: isCounterpart ? 'hidden' : undefined}}
          >
            <Button
              icon={CloseIcon}
              mode="bleed"
              // Clears the variant dimensions and returns the structural axes to one value each.
              // `{}` would leave publication unset, which is not a state a document can be in.
              onClick={() => onChange(initialComposedAddress())}
              text="Clear"
              tone={chrome === 'studio' ? 'default' : 'primary'}
            />
          </Box>
        ) : null}
      </Flex>
    )
  }

  return (
    /*
      ⚠️ NEUTRAL, not `suggest`. Reported: *"I'm questioning why the whole thing is purple to begin
      with. I think we should first try this unstyled, meaning it should be the way that our current
      Perspective bar is."*

      Fair, and the purple was doing a job badly. `tone="suggest"` was saying "a variant is active" by
      washing the entire bar, so the signal was everywhere and therefore nowhere — and it made an
      exploration look like a finished visual direction. The shipped bar is a plain surface with
      plain pills, and starting there means anything we add later has to earn its colour.
    */
    <Card borderBottom paddingX={3} paddingY={2} tone="neutral">
      <style>{CHIP_FOCUS}</style>
      <OpenPaneContext.Provider value={openPane}>
        {renderRow(ANCHOR)}

        {/*
        Row two. See `reserveSecondRow` for why this stopped being conditional.

        When reserved and not comparing it renders `secondRow` — the filter row, once filters exist —
        and falls back to a spacer of exactly one row's height so the bar's height is constant either
        way. The spacer is `aria-hidden`: it holds space, it does not say anything.
      */}
        {layout === 'tiers' && isComparing ? (
          <Box paddingTop={2}>{renderRow(COUNTERPART)}</Box>
        ) : layout === 'tiers' && reserveSecondRow ? (
          <Box paddingTop={2}>
            {secondRow ?? (
              <Box aria-hidden data-testid="reserved-row" style={{height: chipHeightFor(chrome)}} />
            )}
          </Box>
        ) : null}
      </OpenPaneContext.Provider>
    </Card>
  )
}

/** One place the address state lives, so a screen and its bar cannot disagree about it. */
export function useComposedAddress(initial: ComposedValues = {}) {
  const [address, setAddress] = useState<ComposedValues>(initial)
  const facets = useFacets()

  return {
    address,
    facets,
    setAddress,
    ceiling: ceilingFor(address),
    onChange: setAddress,
  }
}
