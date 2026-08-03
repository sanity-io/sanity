import {Box, Button, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useEffect, useState} from 'react'

// Real component from its real path (org contract §8). PopoverDialog is Studio's
// focus-trapping popover-as-dialog: a portalled Popover anchored to a reference element,
// with a sticky header + close button and a `react-focus-lock` trap scoped to the portal.
import {PopoverDialog} from '../../../../packages/sanity/src/core/components/popoverDialog/PopoverDialog'

const meta: Meta<typeof PopoverDialog> = {
  title: 'Overlays & Navigation/PopoverDialog',
  component: PopoverDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          "When an editor clicks to edit something in place, a reference's details, an inline " +
            'object, this is the surface that opens beside it, and it makes one deliberate trade a ' +
            'person keeps discovering the hard way: there is no way to back out of it except its own ' +
            'close button.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/popoverDialog/PopoverDialog.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. More than chrome: it owns real interaction machinery (portal, a scoped focus trap that still permits clicks into sibling panes, a sticky scrollable header) that inline editing surfaces mount into. Less than core, it holds no content model |',
          '| Audit | 🔴 needs-work (`escape-hatch`). The source deliberately implements neither Escape-to-close nor click-outside-to-close; the only close affordance is the header × |',
          '| Patterns | `modal-panel` · `escape-hatch` · `readable-measure` |',
          '| Width scale | `0` 320px container, 280px text field (~44ch) · `1` 640px, 600px (~94ch, the stories’ default) · `2` 960px, 920px (~144ch) |',
          '',
          'PopoverDialog is the middle ground between a menu and a full modal: it portals, traps ' +
            'focus with `react-focus-lock`, and carries a sticky header with a close button, yet it ' +
            'still lets you click into sibling panes outside the portal (handy when its contents link ' +
            'out to a reference that opens to the right).',
          '',
          'The stories anchor a live dialog to a trigger button. Open it in dark mode to confirm the ' +
            'portalled surface is themed (org contract §5 portal-theming check). The Recommended ' +
            'story wraps the same real component in an added `keydown` listener so Escape closes it, ' +
            'the fix the component declines to ship, illustrated without forking it.',
          '',
          '> **Why it matters:** there is no Escape-to-close and no click-outside-to-close, and that ' +
            'is deliberate (see the standing comment in the source weighing nested-dialog and ' +
            'through-portal cases). The only way out is the header close button, so a reader who ' +
            'reaches for Escape gets nothing, the exact shape of the escape-hatch finding. The ' +
            'Recommended story adds the missing listener at the call site to show the fix.',
          '',
          '---',
          '',
          '### Width & measure',
          '',
          "PopoverDialog shares Dialog's width vocabulary but applies it differently. `width` flows " +
            "to `PopoverContainer`, which, unlike Dialog's `maxWidth`, sets an *actual* " +
            '`width: theme.sanity.container[width]` (with `maxWidth: 100%` so it still shrinks to the ' +
            'viewport). The header (`padding={2} paddingLeft={4}`) and body (`padding={4}`) give ' +
            '~20px each side, so the readable text field is `container[width] − 40px`, the same ' +
            'measure math as Dialog. At `<Text size={1}>` (13px, avg glyph ≈ 0.49em):',
          '',
          '| `width` | container | text field | measure |',
          '| --- | --- | --- | --- |',
          '| `0` | 320px | 280px | ~44ch |',
          '| `1`, the stories’ default | 640px | 600px | ~94ch |',
          '| `2` | 960px | 920px | ~144ch |',
          '',
          'Same measure principle as Dialog: a text-first popover-dialog should hold body copy to ' +
            '~45 to 75ch. Where PopoverDialog legitimately goes wide is the *object-edit* case, ' +
            '`EditPortal` / `EnhancedObjectDialog` pass `width` straight through to mount a form ' +
            '(fields carry their own widths), which is content that earns a wider frame. A prose ' +
            'popover at `width={1}` is the same over-measure defect the Dialog stories document; cap ' +
            'the prose, not the popover.',
          '',
          'The width control was dead wiring: every story here previously passed a hard-coded ' +
            '`width` and ignored Storybook args, so the autodocs `width` control changed the arg but ' +
            'nothing re-rendered, cycling `0 → 1 → 2` looked broken, and the only way to see another ' +
            'width was to open a *different* fixed-width story (the three separate buttons in ' +
            'Widths), meaning close and reopen per step. The Width control story below binds `width` ' +
            'to args on a single live dialog. `@sanity/ui` `Popover` positions with a ' +
            '`ResizeObserver`-backed measure (`useElementSize`), so when the container width changes ' +
            'it recomputes placement and the open dialog resizes in place, pointing to the story ' +
            'wiring, not the component, as the cause. Confirm live in that story by cycling the ' +
            'control with the dialog open.',
          '',
          "The page closes *in context*: an inline quick-edit of the *Anna Karenina* book's title, " +
            'the focus-trapping edit-in-place surface anchored to the field it opened from, the ' +
            '`object-edit` case that legitimately earns the width.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:nav',
    'chapter:layout',
    'pattern:modal-panel',
    'pattern:escape-hatch',
    'pattern:readable-measure',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof PopoverDialog>

function DialogBody() {
  return (
    <Stack gap={4}>
      <Text size={1}>
        A PopoverDialog traps focus inside itself but lets you click into panes outside the portal,
        handy when its contents link to a reference that opens to the right.
      </Text>
      <Flex gap={2}>
        <Button text="Save" tone="primary" />
        <Button text="Cancel" mode="bleed" />
      </Flex>
    </Stack>
  )
}

function DefaultHarness() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <Box>
      <Button ref={setRef} text="Open dialog" onClick={() => setOpen(true)} />
      {open && (
        <PopoverDialog
          header="Edit details"
          referenceElement={ref}
          width={1}
          onClose={() => setOpen(false)}
        >
          <DialogBody />
        </PopoverDialog>
      )}
    </Box>
  )
}

/**
 * Open the dialog by clicking the trigger; close it with the header ✕. Note there is no
 * other way out: Escape and clicking away both do nothing (the `escape-hatch` finding).
 */
export const Default: Story = {
  // The dialog opens into a body-level portal with no containing frame, and (the
  // escape-hatch finding) can only be closed by the header ✕ — so once opened it floats
  // over the docs page. Own iframe (inline: false) bounds it to this canvas.
  parameters: {docs: {story: {inline: false, height: '380px'}}},
  render: () => <DefaultHarness />,
}

function AnchoredDialog({width, label}: {width: 0 | 1 | 2; label: string}) {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <Stack gap={3}>
      <Button ref={setRef} text={label} mode="ghost" onClick={() => setOpen(true)} />
      {open && (
        <PopoverDialog
          header={label}
          referenceElement={ref}
          width={width}
          onClose={() => setOpen(false)}
        >
          <Text size={1}>Width {width}</Text>
        </PopoverDialog>
      )}
    </Stack>
  )
}

/** The width scale (`ResponsiveWidthProps`): three anchored dialogs at widths 0, 1, 2. */
export const Widths: Story = {
  // Own iframe so the three anchored dialogs stay bounded when opened (each portals at
  // body level); the frame gives the widest one room.
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '360px'}}},
  render: () => (
    <Flex gap={4} align="flex-start">
      <AnchoredDialog width={0} label="Width 0" />
      <AnchoredDialog width={1} label="Width 1" />
      <AnchoredDialog width={2} label="Width 2" />
    </Flex>
  ),
}

function WidthControlHarness({width}: {width: 0 | 1 | 2}) {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(true)
  return (
    <Box>
      <Button
        ref={setRef}
        text={open ? 'Dialog open, cycle the width control' : 'Open dialog'}
        mode="ghost"
        onClick={() => setOpen(true)}
      />
      {open && (
        <PopoverDialog
          header={`Width ${width}`}
          referenceElement={ref}
          width={width}
          onClose={() => setOpen(false)}
        >
          <Stack gap={3}>
            <Text size={1}>
              Change the width control while this stays open. The popover re-measures and
              re-positions in place, no close and reopen needed.
            </Text>
            <Text size={1} muted>{`Current width preset: ${width}`}</Text>
          </Stack>
        </PopoverDialog>
      )}
    </Box>
  )
}

/**
 * The width control, wired to a single live dialog. Earlier stories hard-coded `width` and
 * ignored args, so the autodocs control was dead: cycling `0 → 1 → 2` changed nothing and
 * the only way to see another width was to open a different fixed-width story (close/reopen
 * per step). Here `width` binds to args, so the control drives the open dialog and you can
 * watch `@sanity/ui` `Popover` re-measure and re-position on each step. The misbehavior was
 * the wiring, not the component.
 */
export const WidthControl: Story = {
  name: 'Width control (live re-measure)',
  args: {width: 1},
  argTypes: {
    width: {
      control: {type: 'inline-radio'},
      options: [0, 1, 2],
      description: '0 = 320px (~44ch) · 1 = 640px (~94ch) · 2 = 960px (~144ch)',
    },
  },
  // Own iframe so the opened dialog is bounded; height gives width 2 room.
  parameters: {docs: {story: {inline: false, height: '420px'}}},
  // oxlint-disable-next-line no-unsafe-type-assertion -- inline-radio yields a single preset
  render: (args) => <WidthControlHarness width={(args.width ?? 1) as 0 | 1 | 2} />,
}

function EscapeClosesHarness() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  return (
    <Box>
      <Button ref={setRef} text="Open dialog (Esc closes)" onClick={() => setOpen(true)} />
      {open && (
        <PopoverDialog header="Edit details" referenceElement={ref} width={1} onClose={close}>
          <DialogBody />
        </PopoverDialog>
      )}
    </Box>
  )
}

/**
 * Recommended: the same real `PopoverDialog`, but the harness attaches a window
 * `keydown` listener that calls `onClose` on Escape while the dialog is open. Escape now
 * steps you back out, the `escape-hatch` the component itself declines to provide,
 * added at the call site.
 */
export const Recommended: Story = {
  name: 'escape-hatch · Recommended (Escape closes)',
  tags: ['!audit:needs-work', 'audit:holds'],
  // Own iframe (like Default) so the opened dialog is bounded; the window keydown listener
  // binds to this iframe's window, so Escape-to-close still works in the docs canvas.
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '380px'}}},
  render: () => <EscapeClosesHarness />,
}

function QuickEditHarness() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('Anna Karenina')
  return (
    <Box>
      <Button ref={setRef} text="Edit title" mode="ghost" onClick={() => setOpen(true)} />
      {open && (
        <PopoverDialog
          header="Edit title"
          referenceElement={ref}
          width={1}
          onClose={() => setOpen(false)}
        >
          <Stack gap={4}>
            <Stack gap={2}>
              <Text size={1} weight="medium" muted>
                Title
              </Text>
              <TextInput value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
            </Stack>
            <Flex gap={2} justify="flex-end">
              <Button text="Cancel" mode="bleed" onClick={() => setOpen(false)} />
              <Button text="Save" tone="primary" onClick={() => setOpen(false)} />
            </Flex>
          </Stack>
        </PopoverDialog>
      )}
    </Box>
  )
}

/**
 * In context, quick-editing a field. The real `PopoverDialog` in the job it exists for:
 * an editor clicks Edit title on the book *Anna Karenina* and the focus-trapping dialog
 * opens anchored to that trigger, holding a single field the reader can type into and Save or
 * Cancel. This is the `object-edit` case the width study calls out, a form, not prose, so
 * `width={1}` earns its frame. (Escape and click-outside still do nothing, per the component's
 * `escape-hatch` finding; the header ✕ or the buttons close it.)
 */
export const InContext: Story = {
  // Own iframe (like Default) so the body-level portal stays bounded to this canvas.
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '380px'}}},
  render: () => <QuickEditHarness />,
}
