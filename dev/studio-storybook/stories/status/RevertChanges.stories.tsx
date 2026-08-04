import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// Real components from real paths (org contract §8).
import {RevertChangesButton} from '../../../../packages/sanity/src/core/field/diff/components/RevertChangesButton'
import {RevertChangesConfirmDialog} from '../../../../packages/sanity/src/core/field/diff/components/RevertChangesConfirmDialog'
import {WithStudioProviders} from '../../lib/testProvider'
import {OverlayFrame} from '../overlays/OverlayFrame'

/* ── The real pair ────────────────────────────────────────────────────────
   `RevertChangesButton` and `RevertChangesConfirmDialog` are never used apart: `FieldChange.tsx`
   and `GroupChange.tsx` both wire the button's `onClick` to open the dialog, anchored to the
   button's own ref, exactly as built below. `RevertChangesConfirmDialog` is a thin wrapper
   around the general-purpose `ConfirmPopover` (storied on its own page, Overlays & Navigation),
   so this page is about the two DECISIONS specific to reverting changes: what the button looks
   like when it cannot be used, and what the confirmation actually tells you before you lose
   work. */

const meta: Meta = {
  title: 'Lists & Data/Revert Changes',
  decorators: [WithStudioProviders()],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This is a destructive action, it discards edits with no separate undo, gated by ' +
            'exactly the two things a person cannot see: a permission they may not know they ' +
            'lack, and a document-pair resolution they have no visibility into. When it fires, ' +
            'the confirmation names a count and nothing else.',
          '',
          '|          |                                                                                                                                                          |',
          '| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/field/diff/components/{RevertChangesButton,RevertChangesConfirmDialog}.tsx`                                                    |',
          '| Tier     | CHROME. The undo action attached to every field and group change in Review Changes, never a change renderer itself                                       |',
          '| Audit    | 🔴 needs-work (`destructive-friction`). The confirmation never says what is about to be lost, and the disabled button gives no reason for being disabled |',
          '| Patterns | `destructive-friction`                                                                                                                                   |',
          '',
          'The two pieces behind "revert this change": a bleed button that only reveals its ' +
            'red, labelled state on hover, and the confirm popover it opens.',
          '',
          'Both are real callers, not a hypothetical pairing: `FieldChange.tsx` renders ' +
            '`<RevertChangesButton changeCount={1} disabled={readOnly || !isTargetReady} .../>` ' +
            'beside every single field change, and `GroupChange.tsx` renders the same button with ' +
            '`changeCount={changes.length}` beside a whole fieldset. Each wires its `onClick` to ' +
            'open a `RevertChangesConfirmDialog` anchored to the button.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>`RevertChangesConfirmDialog` does not say what is about to be lost, it ' +
            'just asks yes or no.</b></summary>',
          '',
          'Read the message it builds: `changeCount > 1 ? ' +
            "t('changes.action.revert-all-description', {count}) : " +
            "t('changes.action.revert-changes-description', {count})`. The actual strings " +
            '(`core/i18n/bundles/studio.ts`) are "Are you sure you want to revert all {{count}} ' +
            'changes?" and "Are you sure you want to revert the change(s)?", a bare count, no ' +
            'field names, no before/after values, nothing about what the reverted change ' +
            'contained. Reverting a group of five changes and reverting a group of five different ' +
            "changes produce the identical dialog, because the dialog only ever knows the group's " +
            'size. It is a yes/no with a number attached, not a description of the loss.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>`RevertChangesButton` has a disabled state, but it never explains ' +
            'itself.</b></summary>',
          '',
          'Both real callers pass `disabled={readOnly || !isTargetReady}`: reverting is blocked ' +
            'while the target document pair is not resolved, or the field is read-only. But not ' +
            'by omission: `RevertChangesButton.tsx` hardcodes `tooltipProps={null}` on every ' +
            'render, unconditionally, so no caller can ever attach an explanation even if one is ' +
            'passed in. A disabled revert button in Studio gives zero indication of why it cannot ' +
            'be used, not "still loading," not "read-only," nothing.',
          '',
          '</details>',
          '',
          '> **Why it matters:** two different silences bracket one action that erases work. ' +
            'The button that cannot be clicked will not say why, and the dialog that can be ' +
            'confirmed will not say what.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:destructive-friction',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

// ── RevertChangesButton ──────────────────────────────────────────────────

/**
 * `changeCount={1}` reads "Revert change" (`changes.action.revert-changes-confirm-change_one`).
 * The label and icon are hidden by default - `Root`'s styled-component only reveals the icon box
 * and switches the text/icon colour to critical `:hover`/`:focus` - so most of the time this
 * renders as a quiet bleed button and only turns red-with-label on interaction.
 */
export const ButtonSingleChange: Story = {
  name: 'RevertChangesButton - one change',
  render: () => (
    <Card border padding={3} radius={0} style={{display: 'inline-block'}}>
      <RevertChangesButton changeCount={1} onClick={() => undefined} />
    </Card>
  ),
}

/** `changeCount={3}` swaps the i18n plural form to "Revert changes"
 * (`..._other`) - the only thing that changes between this and the single-change story. */
export const ButtonMultipleChanges: Story = {
  name: 'RevertChangesButton - several changes',
  render: () => (
    <Card border padding={3} radius={0} style={{display: 'inline-block'}}>
      <RevertChangesButton changeCount={3} onClick={() => undefined} />
    </Card>
  ),
}

/**
 * `disabled`, as both real callers set it while `readOnly` or the target document pair is not
 * `ready`. `tooltipProps={null}` is hardcoded in the component (see the finding above), so this
 * is the entire disabled state: greyed out, unclickable, and silent about why. Compare with an
 * ordinary Studio disabled control, which is expected to explain itself on hover.
 */
export const ButtonDisabled: Story = {
  name: 'RevertChangesButton - disabled (no explanation)',
  tags: ['audit:needs-work'],
  render: () => (
    <Card border padding={3} radius={0} style={{display: 'inline-block'}}>
      <RevertChangesButton changeCount={1} disabled onClick={() => undefined} />
    </Card>
  ),
}

/** `selected`: the same visual state hover produces, held open - this is what the button looks
 * like while its own confirm popover is open, so the trigger stays legible as "active" rather
 * than reverting to its quiet resting state mid-interaction. */
export const ButtonSelected: Story = {
  name: 'RevertChangesButton - selected (confirm open)',
  render: () => (
    <Card border padding={3} radius={0} style={{display: 'inline-block'}}>
      <RevertChangesButton changeCount={1} selected onClick={() => undefined} />
    </Card>
  ),
}

// ── RevertChangesConfirmDialog (paired with its real trigger) ───────────

/**
 * The real pair, wired exactly as `FieldChange.tsx` wires them: clicking the button opens the
 * dialog anchored to the button's own ref. `changeCount={1}` - the message reads "Are you sure
 * you want to revert the change?" and the confirm button reads "Revert change." Nothing here
 * names what the change actually was.
 */
export const DialogSingleChange: Story = {
  name: 'RevertChangesConfirmDialog - confirming one change',
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <RevertChangesButton
            changeCount={1}
            ref={setRef}
            selected={open}
            onClick={() => setOpen((v) => !v)}
          />
          <RevertChangesConfirmDialog
            open={open}
            changeCount={1}
            referenceElement={ref}
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    return (
      <OverlayFrame minHeight={220}>
        <Flex align="center" justify="center" style={{minHeight: 180}}>
          <Demo />
        </Flex>
      </OverlayFrame>
    )
  },
}

/**
 * `changeCount={3}`: the message reads "Are you sure you want to revert all 3 changes?" and the
 * confirm button switches its whole label to "Revert all" (`changes.action.revert-all-confirm`)
 * rather than "Revert changes" - a different string, not just a pluralised one. This is the
 * shape `GroupChange.tsx` uses when reverting a whole fieldset at once.
 */
export const DialogMultipleChanges: Story = {
  name: 'RevertChangesConfirmDialog - confirming several changes',
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <RevertChangesButton
            changeCount={3}
            ref={setRef}
            selected={open}
            onClick={() => setOpen((v) => !v)}
          />
          <RevertChangesConfirmDialog
            open={open}
            changeCount={3}
            referenceElement={ref}
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    return (
      <OverlayFrame minHeight={220}>
        <Flex align="center" justify="center" style={{minHeight: 180}}>
          <Demo />
        </Flex>
      </OverlayFrame>
    )
  },
}

/**
 * **In context.** A mocked field-change row - the `title` field of an article, "The Golden
 * Notebook" struck through, "The Waves" inserted - with the real revert button in the corner
 * `FieldChange.tsx` puts it in, and the real confirm dialog anchored to it. This is the whole
 * interaction Review Changes ships: hover the button to see it turn critical, click it to see
 * the count-only confirmation, and notice that at no point does the row's own content (visible
 * one line above) get echoed back into the confirmation that is about to discard it.
 */
export const InContext: Story = {
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(false)
      return (
        <Card border radius={2} padding={3} style={{width: 360}}>
          <Stack gap={3}>
            <Text size={0} weight="medium" muted>
              Title
            </Text>
            <Flex align="center" justify="space-between" gap={3}>
              <Stack gap={2}>
                <Text size={1} style={{textDecoration: 'line-through'}}>
                  The Golden Notebook
                </Text>
                <Text size={1}>The Waves</Text>
              </Stack>
              <RevertChangesButton
                changeCount={1}
                ref={setRef}
                selected={open}
                onClick={() => setOpen((v) => !v)}
              />
            </Flex>
          </Stack>
          <RevertChangesConfirmDialog
            open={open}
            changeCount={1}
            referenceElement={ref}
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </Card>
      )
    }
    return (
      <OverlayFrame minHeight={240}>
        <Flex align="center" justify="center" style={{minHeight: 200}}>
          <Demo />
        </Flex>
      </OverlayFrame>
    )
  },
}
