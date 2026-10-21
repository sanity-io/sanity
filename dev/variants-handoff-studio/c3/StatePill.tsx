import {type ReleaseType} from '@sanity/client'
import {Card, Text, type BadgeTone} from '@sanity/ui'
import {createContext, useContext} from 'react'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/StatePill.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {ReleaseAvatarIcon} from '../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {LATEST, PUBLISHED} from '../../../packages/sanity/src/core/releases/util/const'
import {type State} from './types'

/**
 * How the popover draws its states, set once by `VersionsPopover`.
 * - `label` (Option A): a flat status label. No border, no fill, not a control.
 * - `chip` (Option B): the outlined Studio `Chip`. With `onPick` it is a real button that opens the
 *   inventory scoped to the audience and the state; without it, it is the quiet chip of the earlier
 *   explorations.
 */
export interface PillMode {
  look: 'label' | 'chip'
  onPick?: (pick: {audience: string | null; state: State | 'more'; release?: string}) => void
}
export const PillModeContext = createContext<PillMode>({look: 'label'})

export const PILL_GLYPHS = {
  published: {release: PUBLISHED},
  draft: {release: LATEST},
  scheduled: {releaseType: 'scheduled'},
  asap: {releaseType: 'asap'},
  undecided: {releaseType: 'undecided'},
} as const

const PILLS: Record<
  State,
  {label: string; tone: BadgeTone; glyph: {release: string} | {releaseType: ReleaseType}}
> = {
  published: {label: 'Published', tone: 'positive', glyph: {release: PUBLISHED}},
  draft: {label: 'Draft', tone: 'caution', glyph: {release: LATEST}},
  scheduled: {label: 'Scheduled', tone: 'suggest', glyph: {releaseType: 'scheduled'}},
  asap: {label: 'ASAP', tone: 'caution', glyph: {releaseType: 'asap'}},
  // The Studio's own key `release.type.undecided`.
  undecided: {label: 'Undecided', tone: 'default', glyph: {releaseType: 'undecided'}},
}

/**
 * A state as a pill: the Studio's own `Chip` (the one the document header's Published, Draft and
 * release chips use) with `ReleaseAvatarIcon` for the glyph, so the disc, ring, clock and bolt are
 * the Studio's. It uses the same `bleed` mode as `VersionChip`. In the popover it is a label, not a
 * control, so it takes no focus and no pointer, and the `role="img"` wrapper keeps the button out of the
 * accessibility tree (Sanity UI's `Button` cannot render as a span).
 */
export function StatePill({
  state,
  title,
  label: text,
  hoverable,
  audience,
  release,
}: {
  state: State
  title?: string
  /** Replaces the state word, such as a release name with its date. */
  label?: string
  /** The pill takes the pointer, so a tooltip around it can open (PT3). */
  hoverable?: boolean
  /** The audience line the pill belongs to, for the scoped click (Option B). */
  audience?: string | null
  release?: string
}) {
  const {label, tone, glyph} = PILLS[state]
  const {look, onPick} = useContext(PillModeContext)
  const icon = <ReleaseAvatarIcon {...(glyph as {release: 'drafts'})} />
  if (look === 'label') {
    // A flat label: the glyph and the word in the tone's text colour, on no fill and with no border.
    return (
      <span
        aria-label={text ?? label}
        data-state={state}
        data-testid={`pill-${state}`}
        role="img"
        style={{pointerEvents: hoverable ? 'auto' : 'none', display: 'inline-flex'}}
      >
        <Card
          data-look="label"
          style={{
            background: 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 25,
            padding: '0 4px',
            whiteSpace: 'nowrap',
          }}
          tone={tone}
        >
          <Text size={1}>{icon}</Text>
          <Text size={1}>{text ?? label}</Text>
        </Card>
      </span>
    )
  }
  if (onPick) {
    return (
      <Chip
        aria-label={`${audience ?? 'All users'}: ${text ?? label}. Open in the version inventory`}
        data-state={state}
        data-testid={`pill-${state}`}
        icon={icon}
        mode="bleed"
        onClick={() => onPick({audience: audience ?? null, state, release})}
        style={{cursor: 'pointer'}}
        text={text ?? label}
        title={title}
        tone={tone}
      />
    )
  }
  return (
    <span
      aria-label={text ?? label}
      data-state={state}
      data-testid={`pill-${state}`}
      role="img"
      style={{pointerEvents: hoverable ? 'auto' : 'none'}}
    >
      <Chip icon={icon} mode="bleed" tabIndex={-1} text={text ?? label} title={title} tone={tone} />
    </span>
  )
}

/**
 * The neutral pill that stands for the states a line does not show. Its accessible name lists them,
 * so a screen reader hears what the sighted reader finds in the inventory.
 */
export function MorePill({
  hidden,
  audience,
}: {
  hidden: readonly string[]
  audience?: string | null
}) {
  const {look, onPick} = useContext(PillModeContext)
  if (look === 'label') {
    return (
      <span
        aria-label={`${hidden.length} more: ${hidden.join(', ')}`}
        data-testid="pill-more"
        role="img"
        style={{pointerEvents: 'none', display: 'inline-flex'}}
        title={hidden.join(', ')}
      >
        <Card
          data-look="label"
          style={{
            background: 'transparent',
            height: 25,
            padding: '0 4px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Text muted size={1}>{`+${hidden.length}`}</Text>
        </Card>
      </span>
    )
  }
  if (onPick) {
    return (
      <Chip
        aria-label={`${audience ?? 'All users'}: ${hidden.length} more, ${hidden.join(', ')}. Open in the version inventory`}
        data-testid="pill-more"
        mode="bleed"
        onClick={() => onPick({audience: audience ?? null, state: 'more'})}
        style={{cursor: 'pointer'}}
        paddingLeft={3}
        text={`+${hidden.length}`}
        title={hidden.join(', ')}
        tone="default"
      />
    )
  }
  return (
    <span
      aria-label={`${hidden.length} more: ${hidden.join(', ')}`}
      data-testid="pill-more"
      role="img"
      style={{pointerEvents: 'none'}}
      title={hidden.join(', ')}
    >
      <Chip mode="bleed" paddingLeft={3} tabIndex={-1} text={`+${hidden.length}`} tone="default" />
    </span>
  )
}
