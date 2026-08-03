import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button as UIButton, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useState} from 'react'

// See stories/studio/Button.stories.tsx for why the ui-components barrel is
// imported from source rather than through the `sanity` exports map.
import {ConfirmPopover} from '../../../../packages/sanity/src/ui-components/confirmPopover/ConfirmPopover'
import {OverlayFrame} from './OverlayFrame'

const meta: Meta<typeof ConfirmPopover> = {
  title: 'Overlays & Navigation/ConfirmPopover',
  component: ConfirmPopover,
  parameters: {
    docs: {
      description: {
        component: [
          'When an editor hits Delete, a full modal thrown over the whole screen is often too much ' +
            'weight for the moment. ConfirmPopover is the lighter touch: an inline are-you-sure that ' +
            'pops open right beside the button that triggered it, and closes the moment the editor ' +
            'answers it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/ui-components/confirmPopover/ConfirmPopover.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. A Studio-only inline confirmation surface built on `@sanity/ui` `Popover`, used for lightweight destructive confirms anchored to their trigger |',
          '| Audit | 🔴 needs-work (`destructive-friction`, `spinners-loading`). A generic "Confirm" gives a destructive action too little friction, and offering the confirm before a reference check completes lets an editor delete blind |',
          '| Patterns | `destructive-friction` · `spinners-loading` · `generous-borders` |',
          '| Collision padding | 4px hardcoded on every floating-ui middleware; the ledger recommendation is 8 to 12px |',
          '',
          'Reach for it when the action is small and local, a delete on a list row, a discard on an ' +
            'inline edit, and you want the confirmation to feel attached to the thing it is confirming. ' +
            'Unlike `Dialog`, it anchors to a `referenceElement`, portals, constrains its own size, and ' +
            'closes on Escape or click-outside when it is the top layer. Its default button labels are ' +
            'the same localized `common.dialog.*` strings; `tone` defaults to `critical` and drives the ' +
            "confirm button's tone.",
          '',
          'Edge gutter, a ledger candidate: `ConfirmPopover` is built on `@sanity/ui` `Popover`, whose ' +
            'floating-ui collision padding is a hardcoded 4px on every middleware (`flip`, `shift`, ' +
            "`size`, `offset`, `hide` in `@sanity/ui`'s `dist/_chunks/tabList.mjs`, for example " +
            '`shift({padding: 4})`); it defaults to `placement="top"` with ' +
            '`fallbackPlacements: ["left","bottom"]` and adds no boundary padding of its own. Anchored ' +
            'near a container edge it therefore collision-shifts to settle just ~4px off that edge, a ' +
            "hairline that reads as flush or cramped (the captain's screenshot). This is a component " +
            'default, not a story bug: 4px is a genuinely tiny minimum viewport-edge gutter for a ' +
            'floating surface. The `EdgeHug` / `EdgeGutter` pair demonstrates it; every other story ' +
            'centers its trigger so the popover keeps real clearance.',
          '',
          'Current confirms with a bare "Confirm" while a reference check is still spinning inside ' +
            'the message. Recommended waits for the count, then labels the confirm with the concrete ' +
            'consequence.',
          '',
          '> **Why it matters:** do not offer the confirm while a reference check is still spinning. A ' +
            'bare "Confirm" gives a destructive action too little friction, and confirming before the ' +
            'count resolves lets an editor delete blind. Wait for the number, then name the consequence ' +
            'right on the button, "Delete (3 refs)" rather than "Confirm".',
          '',
          'The page closes *in context*: a document list of authors with a per-row delete, the confirm ' +
            'popover anchored beside whichever row the editor clicked, the lightweight inline confirm ' +
            'in the seat it was built for.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:actions',
    'chapter:nav',
    'pattern:destructive-friction',
    'pattern:spinners-loading',
    'pattern:generous-borders',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof ConfirmPopover>

/**
 * The popover anchors to its trigger and defaults to `placement="top"`. Centering
 * the trigger with room on every side lets the popover render in its natural
 * placement with a real edge gutter, instead of collision-shifting flush against
 * the frame boundary (see the generous-borders note in the component docs).
 */
function CenteredAnchor({children}: {children: ReactNode}) {
  return (
    <Flex align="center" justify="center" style={{minHeight: 280}}>
      {children}
    </Flex>
  )
}

/**
 * Default critical confirm/cancel flow. The anchor button toggles the popover;
 * both actions close it. Passing no `confirmButtonText` renders the i18n’d
 * `Confirm` fallback from the real `studio` bundle.
 */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <UIButton
            ref={setRef}
            icon={TrashIcon}
            mode="ghost"
            tone="critical"
            text="Delete"
            onClick={() => setOpen((v) => !v)}
          />
          <ConfirmPopover
            open={open}
            referenceElement={ref}
            message="Delete this document?"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    return (
      <OverlayFrame>
        <CenteredAnchor>
          <Demo />
        </CenteredAnchor>
      </OverlayFrame>
    )
  },
}

/**
 * Explicit labels + a non-default `tone`. `confirmButtonText` overrides the
 * i18n’d fallback, and `tone="caution"` recolors the confirm button.
 */
export const CustomLabels: Story = {
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <UIButton
            ref={setRef}
            mode="ghost"
            tone="caution"
            text="Discard changes"
            onClick={() => setOpen((v) => !v)}
          />
          <ConfirmPopover
            open={open}
            tone="caution"
            referenceElement={ref}
            message="Discard your unsaved edits? You can’t get them back."
            cancelButtonText="Keep editing"
            confirmButtonText="Discard"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    return (
      <OverlayFrame>
        <CenteredAnchor>
          <Demo />
        </CenteredAnchor>
      </OverlayFrame>
    )
  },
}

/**
 * Current, the audit finding: `spinners-loading` / `destructive-friction`. The
 * confirm reads a generic "Confirm" and is offered while the reference check is
 * still resolving (spinner in the message). The editor can confirm a destructive
 * action before knowing what it will break.
 */
export const Current: Story = {
  name: 'Current (blind confirm)',
  tags: ['audit:needs-work'],
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <UIButton
            ref={setRef}
            icon={TrashIcon}
            mode="ghost"
            tone="critical"
            text="Delete"
            onClick={() => setOpen((v) => !v)}
          />
          <ConfirmPopover
            open={open}
            referenceElement={ref}
            message={
              <Flex align="center" gap={3}>
                <Spinner muted size={1} />
                <Text size={1} muted>
                  Checking references…
                </Text>
              </Flex>
            }
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    return (
      <OverlayFrame>
        <CenteredAnchor>
          <Demo />
        </CenteredAnchor>
      </OverlayFrame>
    )
  },
}

/**
 * Recommended. The confirm waits for the reference count, then names the
 * exact consequence: the message spells out the impact in full and the CTA carries
 * the count itself ("Delete (3 refs)"). Friction is proportional to the
 * destructiveness, and the editor is never asked to confirm blind.
 *
 * Note: `ConfirmPopover` caps its content at `maxWidth: 350` and lays the two
 * actions out in an equal-width grid, so the confirm button only gets ~150px. A
 * long label ("Delete anyway (3 references)") truncates to "Delete anyway (...",
 * hiding the very count this pattern exists to surface. The count is kept on the
 * button in a compact form that fits, with the full sentence in the message, a
 * story-level fix, since the component's width cap is out of scope to patch here.
 */
export const Recommended: Story = {
  name: 'Recommended (informed confirm)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <UIButton
            ref={setRef}
            icon={TrashIcon}
            mode="ghost"
            tone="critical"
            text="Delete"
            onClick={() => setOpen((v) => !v)}
          />
          <ConfirmPopover
            open={open}
            referenceElement={ref}
            message={
              <Box>
                <Text size={1}>
                  3 other documents reference this one. Deleting it will leave those references
                  broken.
                </Text>
              </Box>
            }
            confirmButtonText="Delete (3 refs)"
            confirmButtonIcon={TrashIcon}
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    return (
      <OverlayFrame>
        <CenteredAnchor>
          <Demo />
        </CenteredAnchor>
      </OverlayFrame>
    )
  },
}

// --- Edge-gutter principle: generous-borders -------------------------------------
// The captain raised the flush-to-edge popover as a PRINCIPLE, not just a story bug:
// floating elements need a minimum viewport-edge gutter, and @sanity/ui's Popover
// only guarantees 4px (see the component docs). This pair shows the same confirm
// edge-hugging vs. guttered so the difference is felt, not narrated.

/**
 * Edge-hug, the audit finding (`generous-borders`). The trigger sits in the frame's
 * top-left corner, so the `placement="top"` popover has no room above, flips to its
 * `left` fallback, and collision-shifts flush against the boundary, settling on the
 * component's hardcoded 4px floating-ui padding. This is the cramped, near-flush look
 * the audit flags: an interactive surface pinned to an edge with no breathing room.
 */
export const EdgeHug: Story = {
  name: 'Edge-hug (cramped)',
  tags: ['variant:current', 'pattern:generous-borders'],
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      return (
        <>
          <UIButton ref={setRef} icon={TrashIcon} mode="ghost" tone="critical" text="Delete" />
          <ConfirmPopover
            open
            referenceElement={ref}
            message="Delete this document?"
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        </>
      )
    }
    // No CenteredAnchor: the trigger stays pinned top-left to force the edge collision.
    return (
      <OverlayFrame>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Edge-gutter, recommended. The identical confirm, but the trigger is centered
 * with clearance on every side, so the popover renders in its natural `top` placement
 * with a real gutter between it and the frame. Same component, same 4px minimum: the
 * fix here is giving the anchor room; the ledger ask is a larger default gutter so
 * edge-anchored popovers never need it.
 */
export const EdgeGutter: Story = {
  name: 'Edge-gutter (recommended)',
  tags: ['variant:recommended', 'pattern:generous-borders'],
  render: () => {
    function Demo() {
      const [ref, setRef] = useState<HTMLButtonElement | null>(null)
      return (
        <>
          <UIButton ref={setRef} icon={TrashIcon} mode="ghost" tone="critical" text="Delete" />
          <ConfirmPopover
            open
            referenceElement={ref}
            message="Delete this document?"
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        </>
      )
    }
    return (
      <OverlayFrame>
        <CenteredAnchor>
          <Demo />
        </CenteredAnchor>
      </OverlayFrame>
    )
  },
}

/**
 * In context, deleting an author from the list. The confirm in the seat it is built for:
 * a document list of authors, each row carrying its own trash action, and the single popover
 * anchored to the row the editor clicked. Hitting Delete on *Leo Tolstoy* floats the "are you
 * sure?" right beside his row rather than throwing a modal over the whole list; the critical
 * tone carries the destructive weight. Confirm or cancel both close it, click another row's
 * trash to move the confirm to that author.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const AUTHORS = [
      {name: 'Jane Austen', era: 'Regency'},
      {name: 'Leo Tolstoy', era: 'Realism'},
      {name: 'Charlotte Brontë', era: 'Victorian'},
    ]
    function Demo() {
      const [target, setTarget] = useState<{name: string; el: HTMLButtonElement} | null>(null)
      return (
        <Card radius={2} shadow={1} style={{width: 320}}>
          <Stack gap={0}>
            {AUTHORS.map((author, index) => (
              <Card key={author.name} padding={2} borderTop={index > 0}>
                <Flex align="center" gap={3}>
                  <Box flex={1}>
                    <Text size={1} weight="medium">
                      {author.name}
                    </Text>
                    <Box paddingTop={1}>
                      <Text size={0} muted>
                        {author.era}
                      </Text>
                    </Box>
                  </Box>
                  <UIButton
                    aria-label={`Delete ${author.name}`}
                    icon={TrashIcon}
                    mode="bleed"
                    tone="critical"
                    onClick={(event) => {
                      const el = event.currentTarget
                      setTarget((current) =>
                        current?.name === author.name ? null : {name: author.name, el},
                      )
                    }}
                  />
                </Flex>
              </Card>
            ))}
          </Stack>
          <ConfirmPopover
            open={Boolean(target)}
            referenceElement={target?.el ?? null}
            message={target ? `Delete “${target.name}”?` : ''}
            confirmButtonText="Delete"
            onConfirm={() => setTarget(null)}
            onCancel={() => setTarget(null)}
          />
        </Card>
      )
    }
    return (
      <OverlayFrame>
        <CenteredAnchor>
          <Demo />
        </CenteredAnchor>
      </OverlayFrame>
    )
  },
}
