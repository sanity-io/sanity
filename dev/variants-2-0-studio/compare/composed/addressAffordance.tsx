import {CloseIcon} from '@sanity/icons/Close'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TransferIcon} from '@sanity/icons/Transfer'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook-variants-2-0, branch
// explorations/variants-2-0, commit 0c9f1e058e, lib/explorations/comparison-surfaces/addressAffordance.tsx).
// Changes: imports point at this monorepo; the chrome comes from the local ./csChrome. Logic verbatim.
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {useCsChrome} from './csChrome'

/**
 * The compare action, which PREVIEWS the state it will produce.
 *
 * 🔴 Reported: *"hovering over the Compare Against icon does not switch its color. I think it should,
 * because then it shows what state that's going to be, and then once you've clicked, it retains that
 * color."*
 *
 * Which is a sharper description of what a hover state is for than "feedback". The button has two
 * appearances and they mean two different things — quiet means *you could compare against this*, lit
 * means *you are* — so hovering should show the reader the second one before they commit to it. The
 * hover is a rehearsal, and after the click the rehearsal simply becomes true.
 *
 * ⚠️ Needs its own hover state rather than CSS, because the change is a `tone` prop rather than a
 * colour: `default` → `primary` is the same transition the click makes, which is the point. A CSS
 * `:hover` rule could tint it, but it would be a different tint from the committed one and the
 * rehearsal would be a lie.
 */
function CompareAction({
  blocked,
  isCounterpart,
  label,
  onClick,
  testId,
}: {
  blocked: boolean
  isCounterpart: boolean
  label: string
  onClick: () => void
  testId: string
}) {
  const [hovered, setHovered] = useState(false)
  const lit = isCounterpart || (hovered && !blocked)
  // Studio chrome: the quiet state is a bleed button, like the Studio's flat menu rows; lit is still
  // the `primary` tone, so the hover still rehearses the committed state.
  const quietMode = useCsChrome() === 'studio' ? 'bleed' : 'ghost'

  return (
    <Flex
      align="center"
      justify="center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{width: COMPARE_ACTION_WIDTH, flex: 'none'}}
    >
      <Button
        /*
         * 🔴 aria-label AND tooltipProps, because they are not the same thing and only one of them
         * is a name.
         *
         * The comment above used to claim that requiring `tooltipProps` on an icon-only button meant
         * "the affordance most at risk of shipping unlabelled is the one the type system refuses to
         * let ship unlabelled." Measured 2026-08-31: the type system was satisfied and the button
         * had no accessible name at all — no `aria-label`, no `aria-labelledby`, no `title`, no text,
         * before or after hover. A tooltip is a hover affordance for a sighted pointer user. It is
         * not what a screen reader announces.
         *
         * So the enforced prop bought a visible label and nothing else, which is a good reminder
         * that a satisfied contract is not evidence of the benefit the contract was for.
         */
        aria-label={isCounterpart ? `Stop comparing against ${label}` : `Compare against ${label}`}
        data-testid={testId}
        disabled={blocked}
        icon={TransferIcon}
        mode={isCounterpart ? 'default' : quietMode}
        onClick={onClick}
        tone={lit ? 'primary' : 'default'}
        tooltipProps={{
          content: isCounterpart ? 'Stop comparing against this' : `Compare against ${label}`,
        }}
      />
    </Flex>
  )
}

/**
 * Four candidate affordances for one question, plus the one that ships.
 *
 * ## The problem this file exists to settle
 *
 * A value menu on a comparison axis has to answer **two** questions, and today it answers them with
 * **one mark**:
 *
 * ```
 *   ┌──────────────────┐
 *   │ Draft         ✓  │   ← where I am
 *   │ Published     ✓  │   ← what I am compared against
 *   └──────────────────┘
 *       one glyph, two jobs
 * ```
 *
 * Reviewed 2026-08-27: *"this multi-select behavior inside the dropdown is a bit unintuitive... Is
 * the checkmark supposed to signify that these are the things being compared? It doesn't seem very
 * clear."* And the sharper half of the same observation: **the state on load differs from the state
 * after one click**, and nothing accounts for the difference. On load one value is ticked and there
 * is no comparison. After one click two are ticked and a comparison exists. The tick did not change,
 * so the tick cannot be what carries the meaning.
 *
 * ## What is NOT at issue
 *
 * The address model. An address already stores an ordered list per axis:
 *
 * ```
 *   values[0]  the anchor       where you are
 *   values[1]  the counterpart  what you are compared against, if any
 * ```
 *
 * Every option below writes exactly that shape. **This is a presentation question end to end**,
 * which is why it can be settled by looking rather than by re-deciding the model. Nothing here
 * touches `ComposedValues`, the id scheme, or resolution.
 *
 * ## The candidates
 *
 * | | | Interaction | Reading |
 * | --- | --- | --- | --- |
 * | `current` | ships | row click toggles | one tick, two jobs |
 * | `A` | glyphs | row click toggles, unchanged | 👁 anchor · ⇄ counterpart |
 * | `B` | slots | two groups, one choice each | the group heading says which is which |
 * | `C` | action | row click moves you · trailing ⇄ compares | the mark's POSITION says which is which |
 * | `AC` | both | as `C` | as `C`, plus explicit glyphs in the row |
 *
 * ## Why the glyphs are these glyphs
 *
 * `EyeOpenIcon` for the anchor is **shipped precedent, not invention**: `DocumentGroupEntry` already
 * marks the row you are looking at with an open eye and a "viewing" badge, for this exact
 * distinction.
 *
 * `TransferIcon` for the counterpart is a two-way arrow — the same shape as the `⇄` already printed
 * in the chip label `Draft ⇄ Published`. So the menu and the chip carry one symbol between them, and
 * the menu no longer has to explain what it is about to produce.
 */
export type Affordance = 'B' | 'C' | 'AC'

export const AFFORDANCES: Affordance[] = ['B', 'C', 'AC']

/**
 * 🔴 Two candidates were removed 2026-08-27, by decision rather than by preference.
 *
 * `current` (a tick per selected value) and `A` (the same interaction with clearer glyphs) were both
 * MULTI-SELECT. The D18 reversal makes an address a point, so there is no "N selected" state for a
 * multi-select control to express: a value is either where you are or what you are compared
 * against, and those are set by different actions.
 *
 * So they did not lose on taste. They became **unable to represent the model** — which is why the
 * dropdown read as unintuitive in the first place. The critique and the data-model decision were the
 * same finding arriving from two directions.
 */
export const RETIRED_AFFORDANCES = [
  {
    letter: '—',
    title: 'A tick per selected value',
    why: 'Multi-select. "Two ticks" had to mean both "a set" and "a comparison", so one mark carried two jobs and the state on load could not be told from the state after one click.',
  },
  {
    letter: 'A',
    title: 'Distinct glyphs on a multi-select',
    why: 'Fixed the reading and left the doing. The second click still started a comparison silently, and it was still a multi-select underneath — so it could still express a set the model no longer has.',
  },
] as const

export interface AffordanceMeta {
  /** Faheem's own label for it. Kept because it is what he will point at. */
  letter: string
  title: string
  /** What the menu claims, in one line. Rendered above the rows in the comparison story. */
  claim: string
  /** The cost. Every one of these has one, and hiding it would make the choice worse. */
  tradeoff: string
}

export const AFFORDANCE_META: Record<Affordance, AffordanceMeta> = {
  B: {
    letter: 'B',
    title: 'Two explicit slots',
    claim: 'One group for where you are. A second group for what to compare against.',
    tradeoff:
      'Clearest to read, and the only option where a first-time reader needs no glyph vocabulary. ⚠️ But it splits the menu into a standing half and a comparing half, which is the mode D4 exists to reject: it implies comparison is a place you go rather than a shape the address takes.',
  },
  C: {
    letter: 'C',
    title: 'A compare action per row',
    claim: 'Clicking a row moves you there. The arrow beside it compares against it.',
    tradeoff:
      'One click never does two different things, and it works unchanged in the Add menu where a tick cannot express "and compare against this one". Costs a second control on every row, so the menu is wider and there is more to hit. ⚠️ No candidate is keyboard-navigable as a menu any more: C and AC could not be, because a MenuItem cannot legally contain a button, and B stopped being one when the `Menu` ancestor it silently depended on went away. That is now work to do once for all three rather than a property one of them had by accident.',
  },
  AC: {
    letter: 'A+C',
    title: 'Action, and glyphs',
    claim: 'Clicking a row moves you there, the arrow compares, and each row states which it is.',
    tradeoff:
      'Reading does not depend on noticing which of two controls is highlighted. Costs the most ink per row, and a row can carry two glyphs at once, which needs watching at narrow widths.',
  },
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
   The state operations. Shared by every option, which is the point: they differ in how they are
   reached, not in what they produce.
   ──────────────────────────────────────────────────────────────────────────────────────────────── */

/** Move where you are. Moving ONTO the counterpart collapses the comparison rather than swapping. */
export function setAnchor(values: string[], value: string): string[] {
  const counterpart = values[1]
  if (counterpart === value) return [value]
  return counterpart ? [value, counterpart] : [value]
}

/** Set, clear, or refuse a counterpart. A value cannot be compared with itself. */
export function setCounterpart(values: string[], value: string): string[] {
  const anchor = values[0]
  if (!anchor) return [value]
  if (anchor === value) return [anchor]
  if (values[1] === value) return [anchor]
  return [anchor, value]
}

/** Swap which is which. Reachable only where an option offers it. */
export function swapEnds(values: string[]): string[] {
  return values.length === 2 ? [values[1], values[0]] : values
}

/** The address that axis holds, in words. Rendered under every column so the result is legible. */
export function describeSelection(values: string[], axisLabel: string): string {
  if (values.length === 0) return `${axisLabel} is unset`
  if (values.length === 1) return `Showing ${values[0]}. Not comparing.`
  return `Showing ${values[0]}, against ${values[1]}.`
}

/**
 * Width of the per-row compare button, used to reserve its space on the anchor row so the labels in
 * a C or A+C list stay on one left edge. Taken from the rendered button rather than guessed.
 */
export const COMPARE_ACTION_WIDTH = 33

/* ────────────────────────────────────────────────────────────────────────────────────────────────
   The rows.
   ──────────────────────────────────────────────────────────────────────────────────────────────── */

export interface AffordanceValueListProps {
  affordance: Affordance
  /** Ordered: `[anchor, counterpart?]`. */
  values: string[]
  options: string[]
  onChange: (next: string[]) => void
  /** Display label for a raw value, for axes whose values are keys. */
  labelFor?: (value: string) => string
  /**
   * Whether the axis may be emptied. Publication may not — a document is live or it is not — so its
   * last value is kept. A variant dimension may be emptied, which is how it is removed.
   */
  keepLast?: boolean
  /** Set on a value the axis cannot reach right now, e.g. at the resolution ceiling. */
  isBlocked?: (value: string) => boolean
  /**
   * Whether a SECOND value is reachable from this list at all.
   *
   * 🔴 Off inside a comparison pane, and it is the one thing that genuinely had to be removed there.
   *
   * The per-pane bar was designed by asking what a pane should not inherit from the global bar, and
   * the obvious answers turned out to be the wrong ones. Row two is already unreachable for a
   * single-valued address, and the ceiling arithmetic already reports 1 side. **The reachable
   * difference is here:** every path that creates `[anchor, counterpart]` runs through this list, so
   * left alone, a pane would offer to compare against something inside itself.
   *
   * That is not a duplicate control, it is a second answer to the same question. N panes side by
   * side and two values in one key are two different models of comparison, and shipping both is the
   * "now there are two models" objection landing for real. **Adding a pane is the only way to
   * compare.**
   *
   * ⚠️ Not a fourth `Affordance`. Which candidate to render and whether comparing is reachable are
   * different questions, and folding them together would make `AFFORDANCES` — the list the candidate
   * story iterates — mean two things at once.
   */
  comparable?: boolean
  /**
   * Namespace for the row test ids, normally the axis key.
   *
   * ⚠️ Not cosmetic. `MenuButton` mounts every menu eagerly and hides the closed ones, so a bar with
   * several axes has all of their rows in the DOM at once. Without a namespace, two axes sharing a
   * value name — and `default`, `none` and `all` are the obvious candidates — would produce two
   * elements with the same test id, and a click would land on whichever the DOM returned first.
   */
  idPrefix?: string
}

/**
 * The menu BODY for one axis under one affordance. Deliberately not wrapped in a popover: the
 * comparison story renders five of these at once, and popovers cannot be open at once.
 *
 * ⚠️ Rows are `Button`s rather than `MenuItem`s wherever an option needs a second control on the
 * row. A `MenuItem` cannot legally contain a button — nested interactive elements — so option C
 * forces the row primitive for every option that shares its layout. That is a real constraint
 * surfacing early rather than at implementation.
 *
 * ⚠️ NO ANCESTOR REQUIREMENT. There used to be one — "the caller must wrap this in a `Menu`", because
 * `MenuItem` calls `useMenu()` and throws without one — and it was violated the moment
 * `StructuralChip` stopped using `MenuButton`. Every row in every affordance is a `Button` now, so
 * this component can be dropped anywhere. The old note read:
 *
 * 🔴 ~~The caller must wrap this in a `Menu`.~~ `MenuItem` calls `useMenu()` and throws without the
 * context, and `MenuButton` clones its `menu` prop directly, so the wrap cannot live in here.
 */
export function AffordanceValueList({
  affordance,
  values,
  options,
  onChange,
  labelFor,
  isBlocked,
  comparable = true,
  idPrefix,
}: AffordanceValueListProps) {
  const label = useCallback((value: string) => labelFor?.(value) ?? value, [labelFor])
  // Studio chrome: rows touch, as the Studio's menu rows do (`StateMenu` sets the Stack gap to 0).
  const rowGap = useCsChrome() === 'studio' ? 0 : 1
  const ns = idPrefix ? `${affordance}-${idPrefix}` : affordance
  const anchor = values[0]
  const counterpart = values[1]

  if (affordance === 'B') {
    /*
      ⚠️ `Button` rows, not `MenuItem` rows — and this branch shipped broken because of it.

      Reported as `useMenu(): missing context value` on `3 · In the real bar`. `MenuItem` calls
      `useMenu()` and throws without a `Menu` ancestor, and this file carried a comment saying exactly
      that: **"The caller must wrap this in a Menu."** Rewriting `StructuralChip` from
      `MenuButton` + `Menu` to a plain `Popover` removed that wrapper from every caller at once, and
      only affordance B noticed, because C and AC had already moved to `Button` rows for an unrelated
      reason (a `MenuItem` cannot legally contain a button).

      🔴 So the fix is not to put the `Menu` back. A component that throws unless its caller wraps it
      in a particular ancestor is a contract enforced by a code comment, and this is the second time
      today that a contract living only in a comment was violated one layer up — the other was
      `chip.compared` being derived, not asserted.

      Using `Button` everywhere deletes the contract instead of restoring it: `AffordanceValueList`
      now has no ancestor requirement at all, and cannot be broken this way again by any caller.

      ⚠️ The cost, stated: `MenuItem` brings keyboard menu navigation and `Button` does not. C and AC
      already paid it, so B paying it makes the three candidates comparable — but if a keyboard-navigable
      value list matters, it is a thing to build once for all three rather than a property one candidate
      has by accident.
    */
    return (
      <Stack gap={rowGap}>
        {/*
          The heading names one of TWO groups, so with only one group it names nothing. In a pane
          there is no second group to distinguish this from — see `comparable`.
        */}
        {comparable ? <SlotHeading text="Showing" /> : null}
        {options.map((value) => (
          <Button
            key={`show-${value}`}
            data-testid={`aff-${ns}-show-${value}`}
            disabled={isBlocked?.(value) ?? false}
            // On the RIGHT. As a leading icon it shifted the label sideways, so the rows in a group
            // no longer lined up and the list looked broken rather than marked.
            iconRight={value === anchor ? EyeOpenIcon : undefined}
            justify="flex-start"
            mode="bleed"
            onClick={() => onChange(setAnchor(values, value))}
            selected={value === anchor}
            text={label(value)}
            width="fill"
          />
        ))}

        {comparable ? (
          <>
            <Box paddingTop={2}>
              <SlotHeading text="Compare against" />
            </Box>
            <Button
              data-testid={`aff-${ns}-compare-none`}
              justify="flex-start"
              mode="bleed"
              onClick={() => onChange([anchor].filter(Boolean) as string[])}
              selected={!counterpart}
              text="Nothing"
              width="fill"
            />
            {options.map((value) => (
              <Button
                key={`cmp-${value}`}
                data-testid={`aff-${ns}-compare-${value}`}
                // The value you are standing on cannot also be the one you compare against. Disabled
                // rather than hidden, so the row list stays the same length in both groups and the eye
                // is where the reason lives.
                disabled={value === anchor || (isBlocked?.(value) ?? false)}
                iconRight={value === counterpart ? TransferIcon : undefined}
                justify="flex-start"
                mode="bleed"
                onClick={() => onChange(setCounterpart(values, value))}
                selected={value === counterpart}
                text={label(value)}
                width="fill"
              />
            ))}
          </>
        ) : null}
      </Stack>
    )
  }

  if (affordance === 'C' || affordance === 'AC') {
    return (
      <Stack gap={rowGap}>
        {options.map((value) => {
          const isAnchor = value === anchor
          const isCounterpart = value === counterpart
          const blocked = isBlocked?.(value) ?? false

          return (
            <Flex align="center" gap={2} key={value}>
              <Box flex={1}>
                <Button
                  data-testid={`aff-${ns}-row-${value}`}
                  disabled={blocked}
                  /*
                   * 🔴 NO LEADING GLYPH. Both state markers live in one column at the RIGHT.
                   *
                   * ⚠️ The comment that used to be here defended the opposite, and it was solving the
                   * wrong problem. Putting the counterpart glyph on the right had produced a `⇄`
                   * immediately beside the `⇄` action button — the same symbol twice, adjacent — so I
                   * moved it to the lead. That fixed the duplication and created two worse things:
                   *
                   *   - a leading icon INDENTS the label, so rows with state and rows without no
                   *     longer started at the same x. Reported as the texts not being left-aligned.
                   *   - the two states were then encoded differently: the anchor's eye only ever
                   *     appeared on the left, the counterpart's `⇄` on the left AND as the button on
                   *     the right. Reported as *"we also see this comparison icon in two different
                   *     places, by the eye icon, only in one. It feels like there's a missing row."*
                   *
                   * The duplication was never the problem — the `⇄` appearing in two ROLES was. One
                   * column, two slots, one meaning each: what you are showing, and what you are
                   * comparing against. The column scans vertically and the labels all start together.
                   */
                  justify="flex-start"
                  mode="bleed"
                  onClick={() => onChange(setAnchor(values, value))}
                  selected={isAnchor}
                  text={label(value)}
                  width="fill"
                />
              </Box>

              {/*
                The compare action. Studio's Button wrapper REQUIRES tooltipProps on an icon-only
                button, so the affordance most at risk of shipping unlabelled is the one the type
                system refuses to let ship unlabelled.

                On the row you are standing on there is nothing to compare against, so the button is
                REPLACED by a spacer of its own width rather than rendered disabled. A greyed control
                invites a click and then refuses it, and a disabled button carries no tooltip to say
                why.
              */}
              {isAnchor ? (
                /*
                  🔴 THE EYE SITS IN THE COMPARE SLOT, not in one of its own.
                  *"the eye icon could go in the same column as the comparison. Why should it exist
                  on a different row?"*
                  It should not, and there is a reason the slot is free: on the row you are standing
                  on there is nothing to compare against, so the compare action has nothing to do
                  there. A first attempt gave the eye its own slot beside it, which made two columns
                  where one was needed and left the anchor row's marker out of line with every other
                  row's control.
                  One slot, three readings: the eye means you are showing this, a lit `⇄` means you
                  are comparing against this, a quiet `⇄` means you could.
                */
                <Flex
                  align="center"
                  justify="center"
                  style={{width: COMPARE_ACTION_WIDTH, flex: 'none'}}
                >
                  <Tooltip content={<Text size={1}>{`Showing ${label(value)}`}</Text>} portal>
                    <Text size={1}>
                      <EyeOpenIcon />
                    </Text>
                  </Tooltip>
                </Flex>
              ) : !comparable ? (
                /*
                  🔴 A SPACER, not a removed slot. See `comparable`.

                  Dropping the column entirely would let a pane's labels sit further right than the
                  global bar's, and worse, further right on the anchor row than on every other row —
                  which is the exact misalignment two rounds of review already fixed here. The eye
                  still needs its slot, so the slot stays and the other rows hold it open empty.
                */
                <Box aria-hidden style={{width: COMPARE_ACTION_WIDTH, flex: 'none'}} />
              ) : (
                /*
                  🔴 The SAME fixed slot the eye sits in, not the button's intrinsic width.
                  *"can you fix the hover selection size? They should all be the same hover selection,
                  ideally, meaning the right edge should all be aligned."*
                  Predicted correctly to fall out of the previous fix: the eye had a 33px slot and the
                  compare button had whatever width it happened to render at, so `Box flex={1}` beside
                  them was handed different remaining space per row — and the row highlight is that
                  box. Same slot on every row, same highlight on every row.
                */
                <CompareAction
                  blocked={blocked}
                  isCounterpart={isCounterpart}
                  label={label(value)}
                  onClick={() => onChange(setCounterpart(values, value))}
                  testId={`aff-${ns}-compare-${value}`}
                />
              )}
            </Flex>
          )
        })}
      </Stack>
    )
  }

  // Unreachable: `Affordance` has three members and both are handled above. Kept as an explicit
  // exhaustiveness failure rather than a silent empty render, because a fourth candidate added
  // without a branch should break loudly here.
  throw new Error(`AffordanceValueList: no rows for affordance "${String(affordance)}"`)
}

function SlotHeading({text}: {text: string}) {
  return (
    <Box paddingX={2} paddingY={1}>
      <Text muted size={0} weight="medium" style={{textTransform: 'uppercase', letterSpacing: 0.4}}>
        {text}
      </Text>
    </Box>
  )
}

/**
 * The readout under a column: what the address now is, in words, plus a control to swap the ends.
 *
 * Swap is here rather than inside any option's rows because it is the same operation for all of
 * them, and putting it in the rows would have made each option's row list differ for a reason
 * unrelated to the question being decided.
 */
export function SelectionReadout({
  values,
  axisLabel,
  onChange,
}: {
  values: string[]
  axisLabel: string
  onChange: (next: string[]) => void
}) {
  const comparing = values.length === 2

  return (
    <Card padding={2} radius={2} tone={comparing ? 'primary' : 'transparent'}>
      <Stack gap={2}>
        <Text size={1}>{describeSelection(values, axisLabel)}</Text>
        {comparing ? (
          <Flex gap={1}>
            <Button
              icon={TransferIcon}
              mode="ghost"
              onClick={() => onChange(swapEnds(values))}
              text="Swap ends"
            />
            <Button
              icon={CloseIcon}
              mode="bleed"
              onClick={() => onChange([values[0]])}
              text="Stop comparing"
            />
          </Flex>
        ) : null}
      </Stack>
    </Card>
  )
}
