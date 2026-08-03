import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {
  Box,
  Button as UIButton,
  Card,
  Dialog as UIDialog,
  Flex,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// See stories/studio/Button.stories.tsx for why the ui-components barrel is
// imported from source rather than through the `sanity` exports map.
import {Dialog} from '../../../../packages/sanity/src/ui-components/dialog/Dialog'
import {OverlayFrame} from './OverlayFrame'

const meta: Meta<typeof Dialog> = {
  title: 'Overlays & Navigation/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: [
          'Dialog is what Studio throws up when it needs to stop an editor and ask something, delete ' +
            'this document, discard these changes, or hold a short focused form, and its width ' +
            'presets are coarser than the sentences they are asked to hold: a one-sentence confirm at ' +
            'the width every confirm dialog ships with sets its copy on a line nearly 25 percent past ' +
            'comfortable reading length.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/ui-components/dialog/Dialog.tsx`, Studio shadow of `@sanity/ui` `Dialog` |',
          '| Tier | SERVICE. Enforces an opinionated, capped footer (at most a cancel and a confirm button) and supplies localized default button labels |',
          '| Audit | 🔴 needs-work (`modal-panel`, `escape-hatch`, `spinners-loading`, `destructive-friction`). The Delete/Unpublish confirm can sit on "Looking for referring documents…" indefinitely, and while it does, no confirm button is rendered at all |',
          '| Patterns | `modal-panel` · `escape-hatch` · `spinners-loading` · `destructive-friction` · `readable-measure` · `cognitive-load` |',
          '| Width scale | `0` 320px/~44ch (primitive default) · `1` 640px/~94ch (what confirm dialogs pass) · `2` 960px/~144ch · `3` 1280px/~195ch · `4` 1600px/~245ch · `5` 1920px/~295ch · `auto` fits content |',
          '',
          'The shadow’s job is to make every one of those look and behave the same: it takes the ' +
            '`@sanity/ui` primitive, pins the footer to at most a cancel and a confirm button, fills ' +
            'in translated default labels, and toggles body padding, so you compose the header and ' +
            'body and the frame handles the rest.',
          '',
          'The Studio `Dialog` wraps `@sanity/ui` `Dialog` and adds: a fixed footer layout ' +
            '(`footer.cancelButton` / `footer.confirmButton` plus an optional `footer.description`), ' +
            'localized fallback labels pulled from `common.dialog.cancel-button.text` / ' +
            '`common.dialog.confirm-button.text`, a `padding` boolean that toggles the default body ' +
            'padding, `animate=true` by default, and `bodyHeight` / `zOffset` passthrough. Confirm ' +
            'defaults to `tone="critical"`; cancel defaults to `mode="bleed"`.',
          '',
          'The two-variant pair reproduces the audit finding on the real component: Current is the ' +
            'stuck destructive confirm (spinner, no confirm button), Recommended resolves the wait ' +
            'with a bounded error, a live confirm, and a clear escape hatch.',
          '',
          '> **Why it matters:** width is a blunt instrument, and here it governs readability. The ' +
            'presets jump 320 to 640 to 960px, so a one-sentence confirm at the standard confirm ' +
            'width sets its copy on a line near 94 characters, past the 75-character reading-comfort ' +
            'ceiling with most of the field left empty. Cap the prose, a measure-limited container ' +
            'around 62 characters, not the dialog; reserve the larger widths for genuinely wide ' +
            'content like tables and side-by-side diffs. The full study is below.',
          '',
          '---',
          '',
          '### Width & measure',
          '',
          '`width` passes straight through to `@sanity/ui` `Dialog`, whose preset indexes ' +
            '`theme.sanity.container[width]` (px). The Studio wrapper sets no default of its own, so ' +
            'an omitted `width` inherits the primitive default of `0`. Body copy is `<Text size={1}>` ' +
            '(13px) inside the wrapper’s `padding={4}` box (space[4] = 20px each side), so the ' +
            'readable text field is `container[width] − 40px`. At 13px Inter (avg glyph advance ≈ ' +
            '0.49em ≈ 6.37px) each preset yields:',
          '',
          '| `width` | card max | text field | measure |',
          '| --- | --- | --- | --- |',
          '| `0`, the `@sanity/ui` default | 320px | 280px | ~44ch |',
          '| `1`, what confirm dialogs pass | 640px | 600px | ~94ch |',
          '| `2` | 960px | 920px | ~144ch |',
          '| `3` | 1280px | 1240px | ~195ch |',
          '| `4` | 1600px | 1560px | ~245ch |',
          '| `5` | 1920px | 1880px | ~295ch |',
          '| `auto` | fits content | n/a | shrinks to fit |',
          '',
          'Principle: hold text-first dialogs to a 45 to 75ch measure. Confirmations, alerts and ' +
            'prompts are prose, and prose past ~75 characters per line lengthens the eye’s ' +
            'return-sweep and measurably slows reading. The presets are coarse, `0` lands at ~44ch, ' +
            'then `1` jumps straight to ~94ch with nothing between, so a one-sentence confirm at ' +
            '`width={1}` sets its copy on a single ~600px line, ~25% past the comfort ceiling with ' +
            'most of the field left empty. The fix caps the *prose*, not the dialog: wrap body ' +
            'copy in a measure-limited container (`max-width` ≈ 62ch / ~396px) so the frame keeps ' +
            'room for header and footer while the text reads at a comfortable width. Reserve ' +
            '`width={2}` and up for genuinely wide content, tables, side-by-side diffs, media grids, ' +
            'never for sentences.',
          '',
          'Proposed scale (RFC): the jumps are too big at the bottom, where most dialogs live, 320 to ' +
            '640 to 960 in +320 steps, so there is no preset near the ~60 to 70ch text sweet spot. A ' +
            'finer low end, keeping `0` as the sensible default and letting `width={2}` land where ' +
            '`width={1}` is today, gives text-first dialogs a native preset and pushes the large ' +
            'sizes up where only tables and media need them. This renumbering is a `@sanity/ui` ' +
            '`theme.container` change, cross-cutting and breaking, an RFC for the design-system ' +
            'owners, not a story-layer edit; the measure-capped container above is the ship-now fix ' +
            'that needs no token change.',
          '',
          '| preset | current px · measure | proposed px · measure | intended content |',
          '| --- | --- | --- | --- |',
          '| `0` | 320 · ~44ch | 320 · ~44ch | confirmations, alerts, prompts |',
          '| `1` | 640 · ~94ch | 480 · ~69ch | text-first bodies (measure-ideal) |',
          '| `2` | 960 · ~144ch | 640 · ~94ch | short forms (today’s `width={1}`) |',
          '| `3` | 1280 · ~195ch | 800 · ~119ch | multi-column forms |',
          '| `4` | 1600 · ~245ch | 1024 · ~155ch | tables, side-by-side diffs |',
          '| `5` | 1920 · ~295ch | 1280 · ~195ch | media grids, wide canvases |',
          '',
          'Content type to width, measure governs text: confirmation / alert / prompt uses `0` or a ' +
            'measure-capped container (~62ch), never above ~75ch; short form uses today `1` (proposed ' +
            '`2`); multi-column form uses today `2` (proposed `3`); table or side-by-side diff uses ' +
            'today `2`–`3` (proposed `4`); media grid or canvas uses today `3`+ (proposed `5`).',
          '',
          'In production: `ConfirmDeleteDialog` and `ConfirmDiscardDialog` both ship at `width={1}`; ' +
            'the discard confirm’s entire body is the 65-character sentence "Are you sure you want to ' +
            'discard all changes since last published?" set on one 600px line (a ~94ch field, ' +
            'unconstrained). `UnpublishVersionDialog` uses `width={0}` (~44ch) and is already ' +
            'comfortable. The Measure current/recommended pair reproduces the discard confirm and the ' +
            'measure-capped fix, each with a grayscale measure ruler under the copy.',
          '',
          'The page closes *in context*: the real Delete confirm for the book *Anna Karenina*, its ' +
            'reference check resolved to a concrete count (three documents point at it) before the ' +
            'editor commits, a live open, confirm, cancel flow.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:nav',
    'chapter:actions',
    'pattern:modal-panel',
    'pattern:escape-hatch',
    'pattern:spinners-loading',
    'pattern:destructive-friction',
    'pattern:readable-measure',
    'pattern:cognitive-load',
    'audit:needs-work',
    'source:studio-shadow',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof Dialog>

/**
 * Reopen affordance so a closed modal doesn't leave an empty canvas.
 */
function Reopen({onClick}: {onClick: () => void}) {
  return <UIButton text="Open dialog" onClick={onClick} />
}

// --- Width & measure constants (see the meta docblock for the full table) ---
// @sanity/ui `theme.sanity.container` — the px each `width` preset resolves to.
const CONTAINER_PX = [320, 640, 960, 1280, 1600, 1920]
// Studio Dialog wrapper wraps children in `padding={4}` = space[4] = 20px each side.
const BODY_PADDING_PX = 40
// `<Text size={1}>` in studioTheme; the average Inter glyph advance ≈ 0.49em.
const BODY_FONT_PX = 13
const AVG_CHAR_EM = 0.49
// Comfortable reading measure: 45–75 characters per line.
const BAND_MIN_CH = 45
const BAND_MAX_CH = 75
// Ruler scale — full track width represents this many characters.
const RULER_MAX_CH = 120

// The real discard-changes confirm: one sentence, shipped at `width={1}`.
const CONFIRM_COPY = 'Are you sure you want to discard all changes since last published?'
// `width={1}` text field: 640 − 40 = 600px, the Current (unconstrained) case.
const BODY_AT_WIDTH_1_PX = CONTAINER_PX[1] - BODY_PADDING_PX
// Measure cap ≈ 62ch at 13px — lands mid-band, the Recommended case.
const MEASURE_CAP_PX = Math.round(62 * BODY_FONT_PX * AVG_CHAR_EM)

/** Characters-per-line a text column of `contentPx` holds at the body font size. */
function measureCh(contentPx: number): number {
  return contentPx / (BODY_FONT_PX * AVG_CHAR_EM)
}

/**
 * Grayscale measure ruler — the proof device under each demo. A neutral track
 * whose full width is {@link RULER_MAX_CH} characters; the 45–75ch comfortable
 * band is shaded, a solid fill runs to the actual measure, and any length past
 * 75ch is hatched to read as "over". Monochrome on purpose (per the grayscale
 * precedent): it is instrumentation, not chrome, so it stays scheme-neutral via
 * `rgba(128,128,128,…)` rather than tone tokens.
 */
function MeasureRuler({contentPx}: {contentPx: number}) {
  const ch = measureCh(contentPx)
  const over = ch > BAND_MAX_CH
  // Clamp to the track and convert a character count to a track percentage.
  const pct = (v: number) => Math.min(100, (v / RULER_MAX_CH) * 100)

  return (
    <Stack gap={2}>
      <Flex justify="space-between" align="flex-end">
        <Text size={0} muted>
          Body copy measure
        </Text>
        <Text size={0} muted weight={over ? 'semibold' : undefined}>
          {`~${Math.round(ch)}ch · ${contentPx}px${over ? ', over 75ch' : ', in band'}`}
        </Text>
      </Flex>
      <Box
        style={{
          position: 'relative',
          height: 18,
          border: '1px solid rgba(128,128,128,0.4)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Comfortable 45–75ch band. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct(BAND_MIN_CH)}%`,
            width: `${pct(BAND_MAX_CH) - pct(BAND_MIN_CH)}%`,
            background: 'rgba(128,128,128,0.16)',
          }}
        />
        {/* Solid fill up to the in-band portion of the measure. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${pct(Math.min(ch, BAND_MAX_CH))}%`,
            background: 'rgba(128,128,128,0.45)',
          }}
        />
        {/* Hatched overflow past 75ch — the readability cost made visible. */}
        {over && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${pct(BAND_MAX_CH)}%`,
              width: `${pct(ch) - pct(BAND_MAX_CH)}%`,
              background:
                'repeating-linear-gradient(45deg, rgba(128,128,128,0.75) 0 4px, transparent 4px 8px)',
            }}
          />
        )}
        {/* Band boundary ticks. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct(BAND_MIN_CH)}%`,
            width: 1,
            background: 'rgba(128,128,128,0.65)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct(BAND_MAX_CH)}%`,
            width: 1,
            background: 'rgba(128,128,128,0.65)',
          }}
        />
      </Box>
      {/* Tick labels — a relative track so 45ch/75ch sit under their band ticks. */}
      <Box style={{position: 'relative', height: 14}}>
        <Text size={0} muted style={{position: 'absolute', left: 0}}>
          0
        </Text>
        <Text size={0} muted style={{position: 'absolute', left: `${pct(BAND_MIN_CH)}%`}}>
          45ch
        </Text>
        <Text size={0} muted style={{position: 'absolute', left: `${pct(BAND_MAX_CH)}%`}}>
          75ch
        </Text>
        <Text size={0} muted style={{position: 'absolute', right: 0}}>
          {`${RULER_MAX_CH}ch`}
        </Text>
      </Box>
    </Stack>
  )
}

/**
 * The raw `@sanity/ui` primitive: a bare modal shell. No footer opinion, no
 * i18n, no `padding` toggle, you compose the footer node and body yourself.
 */
export const Primitive: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <UIDialog
          id="primitive-dialog"
          header="@sanity/ui Dialog"
          width={1}
          onClose={() => setOpen(false)}
          footer={
            <Flex gap={2} justify="flex-end" padding={3}>
              <UIButton mode="bleed" text="Close" onClick={() => setOpen(false)} />
              <UIButton text="OK" tone="primary" onClick={() => setOpen(false)} />
            </Flex>
          }
        >
          <Box padding={4}>
            <Text size={1}>
              The primitive gives you the modal shell and portal; the footer is an arbitrary node
              you assemble by hand.
            </Text>
          </Box>
        </UIDialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * The Studio shadow with its default footer. Note the labels: passing no `text`
 * on the footer buttons renders the i18n’d fallbacks (`Cancel` / `Confirm`) from
 * the real `studio` locale bundle. If these ever show as `common.dialog.…`
 * keys instead, the i18n harness is broken.
 */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-default"
          header="Studio Dialog"
          width={1}
          onClose={() => setOpen(false)}
          footer={{
            cancelButton: {onClick: () => setOpen(false)},
            confirmButton: {tone: 'primary', onClick: () => setOpen(false)},
          }}
        >
          <Text size={1}>
            Body padding, the two-button footer cap and the localized labels all come from the
            Studio wrapper, not from the caller.
          </Text>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Destructive confirm with a caution body and a footer `description`. This is
 * the shape Delete/Unpublish uses; the confirm inherits `tone="critical"`.
 */
export const Destructive: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-destructive"
          header="Delete document"
          width={1}
          onClose={() => setOpen(false)}
          footer={{
            description: 'This cannot be undone.',
            cancelButton: {onClick: () => setOpen(false)},
            confirmButton: {text: 'Delete', onClick: () => setOpen(false)},
          }}
        >
          <Card tone="caution" padding={3} radius={2}>
            <Flex gap={3}>
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Text size={1}>You are about to permanently delete this document.</Text>
            </Flex>
          </Card>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * `padding={false}` removes the default body padding, for content that manages
 * its own edges (tables, embedded lists).
 */
export const WithoutPadding: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-no-padding"
          header="No body padding"
          width={1}
          padding={false}
          onClose={() => setOpen(false)}
          footer={{cancelButton: {onClick: () => setOpen(false)}}}
        >
          <Card borderBottom padding={3}>
            <Text size={1}>Row one, flush to the dialog edge</Text>
          </Card>
          <Card padding={3}>
            <Text size={1}>Row two</Text>
          </Card>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Current, the audit finding: `spinners-loading` / `escape-hatch`. The real
 * `ConfirmDeleteDialog` gates its confirm button on `showConfirmButton =
 * !isLoading`, and renders the body as a `LoadingBlock` titled "Looking for
 * referring documents…" while the reference query runs. When that query is slow
 * or never resolves (observed 25s+), no confirm button is ever rendered, and the
 * user is left with an indefinite spinner and only Cancel. Reproduced here on the
 * real Studio `Dialog` by omitting `footer.confirmButton` and mounting the loading body.
 */
export const Current: Story = {
  name: 'Current (stuck confirm)',
  tags: ['audit:needs-work'],
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-stuck"
          header="Delete document"
          width={1}
          onClose={() => setOpen(false)}
          // No confirmButton: mirrors showConfirmButton === false while isLoading is true.
          footer={{cancelButton: {onClick: () => setOpen(false)}}}
        >
          <Flex align="center" direction="column" justify="center" gap={3} style={{height: 110}}>
            <Spinner muted />
            <Text size={1} muted>
              Looking for referring documents{'…'}
            </Text>
          </Flex>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Recommended: the reference check is time-boxed. If it cannot resolve, the
 * dialog stops spinning and surfaces a bounded error with the confirm still
 * available (`destructive-friction` preserved via the critical tone plus explicit
 * label), plus Cancel as a clear `escape-hatch`. The user is never trapped behind
 * an unresolved spinner.
 */
export const Recommended: Story = {
  name: 'Recommended (bounded wait)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-bounded"
          header="Delete document"
          width={1}
          onClose={() => setOpen(false)}
          footer={{
            description: 'Reference check timed out.',
            cancelButton: {onClick: () => setOpen(false)},
            confirmButton: {text: 'Delete anyway', onClick: () => setOpen(false)},
          }}
        >
          <Stack gap={3}>
            <Card tone="critical" padding={3} radius={2}>
              <Flex gap={3}>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>
                <Text size={1}>
                  We couldn{'’'}t confirm which documents reference this one. Deleting may leave
                  broken references.
                </Text>
              </Flex>
            </Card>
            <Text size={1} muted>
              You can retry the check or delete anyway.
            </Text>
          </Stack>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Current, the measure finding. The real `ConfirmDiscardDialog`, reproduced as it ships:
 * `width={1}` (a 600px text field ≈ 94ch) holding a single 65-character sentence.
 * The copy runs on one long line across most of the field with no measure
 * constraint, the eye sweeps the full width for one sentence, and any longer
 * body would read at ~94ch, ~25% past the 75ch comfort ceiling. The ruler under
 * the copy shows the field landing in the hatched over-measure zone.
 */
export const MeasureCurrent: Story = {
  name: 'Measure · current (unconstrained)',
  tags: ['audit:needs-work', 'pattern:readable-measure'],
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-measure-current"
          header="Discard changes?"
          width={1}
          onClose={() => setOpen(false)}
          footer={{
            cancelButton: {onClick: () => setOpen(false)},
            confirmButton: {text: 'Discard changes', onClick: () => setOpen(false)},
          }}
        >
          <Stack gap={4}>
            <Text size={1}>{CONFIRM_COPY}</Text>
            <MeasureRuler contentPx={BODY_AT_WIDTH_1_PX} />
          </Stack>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Recommended: same dialog, same `width={1}` frame. The change is a
 * measure-capped container around the prose (`max-width` ≈ 62ch / ~396px). The
 * frame keeps its room for header and footer, while the sentence now wraps at a
 * comfortable width and the ruler lands inside the 45–75ch band. The fix caps the
 * text column, not the dialog, so it holds for one-liners and multi-sentence
 * bodies alike without reaching for a coarser width preset.
 */
export const MeasureRecommended: Story = {
  name: 'Measure · recommended (capped)',
  tags: ['!audit:needs-work', 'audit:holds', 'pattern:readable-measure'],
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-measure-recommended"
          header="Discard changes?"
          width={1}
          onClose={() => setOpen(false)}
          footer={{
            cancelButton: {onClick: () => setOpen(false)},
            confirmButton: {text: 'Discard changes', onClick: () => setOpen(false)},
          }}
        >
          <Stack gap={4}>
            <Box style={{maxWidth: MEASURE_CAP_PX}}>
              <Text size={1}>{CONFIRM_COPY}</Text>
            </Box>
            <MeasureRuler contentPx={MEASURE_CAP_PX} />
          </Stack>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * In context, deleting a referenced book. The whole page composed into the moment Studio
 * actually throws this Dialog up for: an editor hits Delete on the book *Anna Karenina*, the
 * reference check has already resolved, and the confirm reports the concrete blast radius,
 * three documents point at this book, before asking them to commit. The prose is measure-capped
 * (per the study above), the referrers are listed in a caution card, and the critical-toned
 * confirm keeps the destructive friction. Open it, then Cancel to back out or Delete to confirm.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const REFERRERS = ['Leo Tolstoy', 'Reading list, Russian classics', 'Homepage, Featured book']
    function Demo() {
      const [open, setOpen] = useState(true)
      if (!open) return <Reopen onClick={() => setOpen(true)} />
      return (
        <Dialog
          id="studio-dialog-in-context"
          header="Delete “Anna Karenina”?"
          width={1}
          onClose={() => setOpen(false)}
          footer={{
            description: '3 documents reference this book.',
            cancelButton: {onClick: () => setOpen(false)},
            confirmButton: {text: 'Delete anyway', onClick: () => setOpen(false)},
          }}
        >
          <Stack gap={4}>
            <Box style={{maxWidth: MEASURE_CAP_PX}}>
              <Text size={1}>
                3 other documents reference “Anna Karenina”. Deleting it will leave those references
                broken.
              </Text>
            </Box>
            <Card tone="caution" padding={3} radius={2}>
              <Stack gap={3}>
                <Flex gap={3} align="center">
                  <Text size={1}>
                    <WarningOutlineIcon />
                  </Text>
                  <Text size={1} weight="medium">
                    Referenced by
                  </Text>
                </Flex>
                <Stack gap={2}>
                  {REFERRERS.map((title) => (
                    <Text key={title} size={1}>
                      {title}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Dialog>
      )
    }
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}
