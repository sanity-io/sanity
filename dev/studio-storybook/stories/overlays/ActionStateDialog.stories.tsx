import {CloseIcon} from '@sanity/icons/Close'
import {CopyIcon} from '@sanity/icons/Copy'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button as UIButton, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useMemo, useState} from 'react'
import {type DocumentActionDialogProps} from 'sanity'

// Real component from its real path (org contract §8). ActionStateDialog is the router every
// document action's `dialog` description passes through: it reads `dialog.type` and hands off
// to one of four concrete overlay components, ending in a defensive fallback for a value none
// of them declare. Mounted directly, one story per return, because the whole point is seeing
// what each branch actually produces rather than describing it.
import {ActionStateDialog} from '../../../../packages/sanity/src/structure/panes/document/statusBar/ActionStateDialog'
import {OverlayFrame} from './OverlayFrame'

const meta: Meta<typeof ActionStateDialog> = {
  title: 'Overlays & Navigation/Action State Dialog',
  component: ActionStateDialog,
  parameters: {
    docs: {
      description: {
        component: [
          'ActionStateDialog is the one router every document action dialog in Studio passes ' +
            'through: a confirm, a popover, a modal, or a fully custom surface, whichever kind an ' +
            'action requests, this component decides how it reaches the screen. The branch nobody ' +
            'declared is the one a person can get stuck inside, and that defensive fallback is ' +
            'where the audit finding lives.',
          '',
          '|            |                                                                                                                                                                                                                                        |',
          '| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source     | `packages/sanity/src/structure/panes/document/statusBar/ActionStateDialog.tsx`                                                                                                                                                         |',
          '| Tier       | SERVICE. Draws nothing of its own; reads `dialog.type` off a `DocumentActionDialogProps` and hands off to one of four concrete overlay components, each with its own page in this chapter                                              |',
          '| Audit      | 🟡 needs-work (`modal-panel`, `escape-hatch`). The branch for a `dialog.type` no one declared renders with no header, no footer, and no click-outside; if the malformed dialog also lacks `onClose` there is no way to close it at all |',
          '| Patterns   | `modal-panel` · `escape-hatch`                                                                                                                                                                                                         |',
          '| Call sites | `DocumentStatusBarActions.tsx:168` · `ActionMenuButton.tsx:44` · `DocumentActionShortcuts.tsx:72` · `IncomingReferenceDocumentActions.tsx:66`                                                                                          |',
          '',
          'This page mounts the component _directly_, one story per return, because the whole ' +
            'argument is what the branches look like next to each other and a given action can ' +
            'only ever be in one of them at a time. Each call site anchors it to whatever button ' +
            'or element triggered the action, so `referenceElement` matters for two of the five ' +
            'branches.',
          '',
          '`DocumentActionDialogProps` declares four kinds, `confirm`, `popover`, `dialog`, ' +
            '`custom`, and the component has a branch for every one of them, plus a fifth for ' +
            '`dialog.type === "dialog" || !dialog.type` (an omitted `type` reaches the same ' +
            '`ModalDialog` as an explicit one), plus a sixth, defensive `unknownModal` branch for ' +
            'anything else. Unlike `MemberFieldError` (ledger #72), nothing declared goes ' +
            'unhandled here, the ceiling and the floor match for the typed union. The gap is ' +
            'different: `dialog.type` is a plain string checked at runtime, ' +
            '`DocumentActionDescription` is public API surface a plugin author fills in without a ' +
            'compiler watching, and a value the union does not name is still reachable. That ' +
            'sixth branch is what is thin.',
          '',
          '> **Why it matters:** the fallback branch renders the shared dialog shell wired only ' +
            "to the unknown dialog's own close handler, and nothing else. Trace what that does " +
            'downstream: the close button only renders when a close handler exists, the Escape ' +
            'key handler bails out the same way, and so does the click-outside handler. So if the ' +
            'malformed dialog object happens not to carry a close handler, plausible for a ' +
            "confirm-shaped object with a typo'd type, which carries its own confirm and cancel " +
            'callbacks but no generic close, the rendered dialog ends up with no header, no ' +
            'footer, no click-outside, and no Escape. Nothing in the type system stops an action ' +
            "from reaching this state, because by the time the dialog's declared type fails every " +
            'check, it has already been cast away from anything the compiler can watch.',
          '',
          '**Per-branch dismissal, traced to source:**',
          '',
          '| Branch             | Closes via                                                                                                              | Reaches                                                                                         |',
          '| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |',
          '| `confirm`          | Escape / click-outside (wired inside `ConfirmPopover`) or the Cancel button                                             | `dialog.onCancel`                                                                               |',
          '| `popover`          | Escape / click-outside (wired inside the local `dialogs/PopoverDialog`)                                                 | `dialog.onClose`                                                                                |',
          '| `dialog` / no type | header close icon, click-outside, Escape (`ModalDialog` passes `dialog.onClose` to both `onClose` and `onClickOutside`) | `dialog.onClose`, footer buttons only if the caller wires them                                  |',
          '| `custom`           | whatever `dialog.component` builds, entirely                                                                            | nothing automatic, `DocumentActionCustomDialogComponentProps` carries no `onClose` field at all |',
          '| fallback           | header close icon / click-outside / Escape, all gated on `unknownModal.onClose` existing                                | `unknownModal.onClose`, or nothing                                                              |',
          '',
          'The `custom` row is its own small finding: `ActionStateDialog` wraps ' +
            '`dialog.component` in a bare `DocumentActionPortalProvider` and renders it, full ' +
            'stop, no backdrop, no centering, no dismiss affordance. The default portal element ' +
            'is a plain, unpositioned `div`, so a custom component that does not give itself its ' +
            'own positioning does not float as an overlay; it renders in normal document flow ' +
            'wherever that `div` happens to sit. The **Custom** story below is deliberately ' +
            'unstyled by `ActionStateDialog` to show exactly that: everything visible, including ' +
            "the close button, is the fixture's own doing.",
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:actions',
    'chapter:nav',
    'pattern:modal-panel',
    'pattern:escape-hatch',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof ActionStateDialog>

/** A stand-in for a plugin-authored popover body. The `popover` branch supplies no chrome. */
function DuplicateAsForm({onClose}: {onClose: () => void}) {
  const [name, setName] = useState('Copy of Anna Karenina')
  return (
    <Card padding={3} radius={2} shadow={2} style={{minWidth: 260}}>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          Duplicate as
        </Text>
        <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <Flex gap={2} justify="flex-end">
          <UIButton text="Cancel" mode="bleed" onClick={onClose} />
          <UIButton text="Duplicate" tone="primary" onClick={onClose} />
        </Flex>
      </Stack>
    </Card>
  )
}

/**
 * A stand-in for a plugin-authored `custom` panel. Nothing about its look, the card, the close
 * button, the copy explaining itself, comes from `ActionStateDialog`. It is deliberately NOT
 * `position: fixed`, so it renders exactly where the default portal `div` puts it: in normal
 * flow, right after whatever mounted it. That absence of positioning is the point of the story.
 */
function CustomPanel({onClose}: {onClose: () => void}) {
  return (
    <Card padding={4} radius={2} shadow={2} style={{maxWidth: 360, marginTop: 12}}>
      <Stack gap={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="medium">
            A plugin-authored panel
          </Text>
          <UIButton
            icon={CloseIcon}
            mode="bleed"
            padding={2}
            onClick={onClose}
            aria-label="Close"
          />
        </Flex>
        <Text size={1} muted>
          Everything here, including this close button, is drawn by the action{"'"}s own{' '}
          <code>component</code>. <code>ActionStateDialog</code> supplies a portal and nothing else:
          no backdrop, no centering, no dismiss affordance of its own.
        </Text>
      </Stack>
    </Card>
  )
}

function ConfirmHarness() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(true)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Flex align="center" justify="center" style={{minHeight: 280}}>
      <UIButton
        ref={setRef}
        icon={TrashIcon}
        mode="ghost"
        tone="critical"
        text="Delete"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <ActionStateDialog
          referenceElement={ref}
          dialog={{
            type: 'confirm',
            tone: 'critical',
            message: 'Delete this document? This cannot be undone.',
            onConfirm: close,
            onCancel: close,
          }}
        />
      )}
    </Flex>
  )
}

/**
 * `dialog.type === 'confirm'` renders `ConfirmDialog`, which mounts the real `ConfirmPopover`
 * anchored to `referenceElement`. Passing no `cancelButtonText`/`confirmButtonText` renders the
 * i18n'd `Cancel` / `Confirm` fallbacks from the real `structure` locale bundle.
 */
export const Confirm: Story = {
  render: () => (
    <OverlayFrame>
      <ConfirmHarness />
    </OverlayFrame>
  ),
}

function PopoverHarness() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(true)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Flex align="center" justify="center" style={{minHeight: 280}}>
      <UIButton
        ref={setRef}
        icon={CopyIcon}
        mode="ghost"
        text="Duplicate"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <ActionStateDialog
          referenceElement={ref}
          dialog={{type: 'popover', content: <DuplicateAsForm onClose={close} />, onClose: close}}
        />
      )}
    </Flex>
  )
}

/**
 * `dialog.type === 'popover'` renders the LOCAL `dialogs/PopoverDialog`, which is a bare
 * `@sanity/ui` `Popover` wrapping `dialog.content` in an unstyled `div`. Compare with the
 * `Popover Dialog` page in this chapter (a different, unrelated component of almost the same
 * name): that one ships a sticky header, a close button and a focus trap. This one ships none
 * of that, so the card, the label, the buttons in this demo are the fixture's, not the
 * component's.
 */
export const Popover: Story = {
  render: () => (
    <OverlayFrame>
      <PopoverHarness />
    </OverlayFrame>
  ),
}

function ModalHarness() {
  const [open, setOpen] = useState(true)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Box>
      {!open && <UIButton text="Open dialog" onClick={() => setOpen(true)} />}
      {open && (
        <ActionStateDialog
          dialog={{
            type: 'dialog',
            header: 'Move to another folder?',
            width: 'medium',
            content: (
              <Text size={1}>
                Choose a destination folder for this document. Existing references are preserved.
              </Text>
            ),
            // `DocumentActionModalDialogProps['footer']` types straight through to
            // `@sanity/ui` `DialogProps['footer']`, a raw `ReactNode`, not the studio
            // `Dialog` shadow's structured `{cancelButton, confirmButton}` object.
            // `ModalDialog.tsx` just drops it into a padded `Box` as-is, so the caller
            // builds and wires its own buttons, exactly like a real document action must.
            footer: (
              <Flex gap={2} justify="flex-end">
                <UIButton text="Cancel" mode="bleed" onClick={close} />
                <UIButton text="Move" tone="primary" onClick={close} />
              </Flex>
            ),
            onClose: close,
          }}
        />
      )}
    </Box>
  )
}

/**
 * `dialog.type === 'dialog'` is wrapped in `DocumentActionPortalProvider`, then `ModalDialog`
 * mounts the real `@sanity/ui` `Dialog`. `width` goes through `DIALOG_WIDTH_TO_UI_WIDTH`
 * (`medium` maps to `1`). The footer buttons are NOT auto-wired to `onClose`, this demo calls
 * it from its own `footer` buttons, the way a real action has to.
 */
export const Modal: Story = {
  render: () => (
    <OverlayFrame>
      <ModalHarness />
    </OverlayFrame>
  ),
}

function ImplicitDialogHarness() {
  const [open, setOpen] = useState(true)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Box>
      {!open && <UIButton text="Open dialog" onClick={() => setOpen(true)} />}
      {open && (
        <ActionStateDialog
          dialog={{
            // No `type` at all. `DocumentActionModalDialogProps['type']` is `type?: 'dialog'`,
            // optional by design, and the component's guard is `dialog.type === 'dialog' ||
            // !dialog.type`. This is the other half of that guard, not a misuse.
            header: 'Untyped dialog (type omitted)',
            content: (
              <Text size={1}>
                Same branch, same component, reached without <code>type</code> set at all.
              </Text>
            ),
            onClose: close,
          }}
        />
      )}
    </Box>
  )
}

/**
 * The second way to reach `ModalDialog`: omit `type` entirely rather than set it to `'dialog'`.
 * Byte-identical render path to **Modal** above, included because "every declared kind has a
 * branch" is only half the audit; this confirms the undeclared-but-typed `!dialog.type` case
 * lands on the branch the source clearly intends, not on the fallback.
 */
export const ImplicitDialogType: Story = {
  name: 'Modal, implicit type (same branch)',
  render: () => (
    <OverlayFrame minHeight={240}>
      <ImplicitDialogHarness />
    </OverlayFrame>
  ),
}

function CustomHarness() {
  const [open, setOpen] = useState(true)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Stack gap={0}>
      <UIButton
        text={open ? 'Close panel' : 'Open panel'}
        mode="ghost"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <ActionStateDialog dialog={{type: 'custom', component: <CustomPanel onClose={close} />}} />
      )}
    </Stack>
  )
}

/**
 * `dialog.type === 'custom'` has `DocumentActionPortalProvider` wrap `dialog.component` and
 * render it. Nothing else. No backdrop, no centering, no default dismiss affordance, see the
 * meta docblock for why the panel below sits in normal flow instead of floating.
 */
export const Custom: Story = {
  render: () => (
    <OverlayFrame minHeight={260}>
      <CustomHarness />
    </OverlayFrame>
  ),
}

/**
 * A `dialog.type` none of the four declared kinds name, the shape of a typo'd or hand-rolled
 * action (`'alert'` instead of `'confirm'`). No `onClose` is included on purpose: this is the
 * floor the fallback branch actually has, traced in the meta docblock. `console.warn`
 * ("Unsupported modal type alert") fires on mount; open the browser console to see it.
 *
 * There is no reopen control below, because there is nothing in the rendered dialog that offers
 * one, no header, no footer, no click-outside, no Escape. That absence is the finding, not a
 * broken demo.
 */
export const Fallback: Story = {
  name: 'Fallback (unrecognized type)',
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={3}>
      <Text size={1} muted>
        No header, no footer, no click-outside, no Escape: this dialog cannot be closed by the
        person looking at it. That is the fallback branch as shipped, not a demo bug.
      </Text>
      <OverlayFrame minHeight={260}>
        <ActionStateDialog
          dialog={
            // Deliberately outside the declared dialog.type union. That is the branch this
            // story exists to reach.
            {type: 'alert'} as unknown as DocumentActionDialogProps
          }
        />
      </OverlayFrame>
    </Stack>
  ),
}

type MatrixKey = 'confirm' | 'popover' | 'modal' | 'custom' | 'fallback'

const MATRIX_ROWS: {key: MatrixKey; label: string}[] = [
  {key: 'confirm', label: '1. confirm: ConfirmDialog / ConfirmPopover'},
  {key: 'popover', label: '2. popover: the local PopoverDialog (bare Popover)'},
  {key: 'modal', label: '3. dialog / no type: ModalDialog'},
  {key: 'custom', label: '4. custom: dialog.component, unwrapped'},
  {key: 'fallback', label: '5. unrecognized type: the fallback (no reopen, see below)'},
]

function MatrixHarness() {
  const [active, setActive] = useState<MatrixKey | null>(null)
  // State, not a ref. The popover reads its anchor during render, so the anchor has to be
  // something render is allowed to look at.
  //
  // The ref callbacks have to be stable per key, and that is the whole subtlety. This harness
  // previously built them inline (`ref={setRowRef(row.key)}`), which returns a fresh closure on
  // every render even though the factory itself was memoised. React treats a changed ref
  // callback as a detach plus a reattach: it calls the old one with `null`, then the new one
  // with the element. The `prev[key] === el` guard does NOT absorb that, because on the null
  // detach `prev[key]` is the element and `el` is null, so the guard passes, state is replaced,
  // the component re-renders, fresh closures appear, and the cycle repeats until React gives up
  // with error #185 (max update depth). Measured before this change: the story canvas rendered
  // nothing but a minified error #185 stack, and the docs page carried the same error.
  //
  // Building one callback per key once, keyed off the module-level MATRIX_ROWS, means React only
  // ever invokes them on real mount and unmount, so the guard has only real changes to absorb.
  const [anchors, setAnchors] = useState<Partial<Record<MatrixKey, HTMLButtonElement | null>>>({})
  const close = useCallback(() => setActive(null), [])
  const rowRefs = useMemo(() => {
    const map: Partial<Record<MatrixKey, (el: HTMLButtonElement | null) => void>> = {}
    for (const row of MATRIX_ROWS) {
      map[row.key] = (el) =>
        setAnchors((prev) => (prev[row.key] === el ? prev : {...prev, [row.key]: el}))
    }
    return map
  }, [])

  return (
    <Stack gap={4}>
      <Flex align="center" justify="space-between">
        <Text size={1} weight="medium">
          One branch open at a time, the rows stay put so the five can be compared.
        </Text>
        {/* A story control, not a component affordance. The fallback row below renders with no
            dismiss path of its own (that is the finding), so this is the only way back once it
            is showing. */}
        <UIButton
          text="Reset (story control)"
          mode="bleed"
          tone="caution"
          onClick={close}
          disabled={active === null}
        />
      </Flex>
      <Stack gap={2}>
        {MATRIX_ROWS.map((row) => (
          <Flex key={row.key} align="center" gap={3}>
            <Box flex={1}>
              <Text size={1} muted={active !== row.key}>
                {row.label}
              </Text>
            </Box>
            <UIButton
              ref={rowRefs[row.key]}
              text={active === row.key ? 'Showing...' : 'Show'}
              mode={active === row.key ? 'default' : 'ghost'}
              tone={active === row.key ? 'primary' : 'default'}
              onClick={() => setActive(row.key)}
            />
          </Flex>
        ))}
      </Stack>
      {active === 'confirm' && (
        <ActionStateDialog
          referenceElement={anchors.confirm ?? null}
          dialog={{
            type: 'confirm',
            tone: 'critical',
            message: 'Delete this document?',
            onConfirm: close,
            onCancel: close,
          }}
        />
      )}
      {active === 'popover' && (
        <ActionStateDialog
          referenceElement={anchors.popover ?? null}
          dialog={{type: 'popover', content: <DuplicateAsForm onClose={close} />, onClose: close}}
        />
      )}
      {active === 'modal' && (
        <ActionStateDialog
          dialog={{
            type: 'dialog',
            header: 'Move to another folder?',
            content: <Text size={1}>Choose a destination folder for this document.</Text>,
            footer: (
              <Flex gap={2} justify="flex-end">
                <UIButton text="Cancel" mode="bleed" onClick={close} />
                <UIButton text="Move" tone="primary" onClick={close} />
              </Flex>
            ),
            onClose: close,
          }}
        />
      )}
      {active === 'custom' && (
        <ActionStateDialog dialog={{type: 'custom', component: <CustomPanel onClose={close} />}} />
      )}
      {active === 'fallback' && (
        <ActionStateDialog
          dialog={
            // oxlint-disable-next-line no-unsafe-type-assertion -- see the Fallback story above
            {type: 'alert'} as unknown as DocumentActionDialogProps
          }
        />
      )}
    </Stack>
  )
}

/**
 * All five branches, one at a time, behind a shared row list so they can be compared without
 * the position-fixed ones (`dialog` / the fallback) physically covering their neighbours. That
 * would happen if all five were mounted at once, since two of the five branches render
 * `@sanity/ui`'s `Dialog` at its `position: 'fixed'` default. Click a row's **Show** to mount
 * that branch; click another row to swap it out. The fallback row has no dismiss path of its
 * own (the finding this page exists to surface), so **Reset** is a story control, not something
 * the component offers.
 */
export const ReturnMatrix: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <OverlayFrame minHeight={420}>
      <MatrixHarness />
    </OverlayFrame>
  ),
}

function InContextHarness() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [active, setActive] = useState<'delete' | 'move' | null>(null)
  const close = useCallback(() => setActive(null), [])

  return (
    <Card radius={2} shadow={1} padding={3} style={{width: 420}}>
      <Flex align="center" justify="space-between">
        <Text size={1} weight="medium">
          {'Anna Karenina'}
        </Text>
        <Flex gap={2}>
          <UIButton text="Move" mode="ghost" onClick={() => setActive('move')} />
          <UIButton
            ref={setRef}
            icon={TrashIcon}
            mode="ghost"
            tone="critical"
            text="Delete"
            onClick={() => setActive('delete')}
          />
        </Flex>
      </Flex>
      {active === 'delete' && (
        <ActionStateDialog
          referenceElement={ref}
          dialog={{
            type: 'confirm',
            tone: 'critical',
            message: 'Delete "Anna Karenina"? 3 other documents reference it.',
            onConfirm: close,
            onCancel: close,
          }}
        />
      )}
      {active === 'move' && (
        <ActionStateDialog
          dialog={{
            type: 'dialog',
            header: 'Move to another folder?',
            width: 'medium',
            content: <Text size={1}>Choose a destination folder for "Anna Karenina".</Text>,
            footer: (
              <Flex gap={2} justify="flex-end">
                <UIButton text="Cancel" mode="bleed" onClick={close} />
                <UIButton text="Move" tone="primary" onClick={close} />
              </Flex>
            ),
            onClose: close,
          }}
        />
      )}
    </Card>
  )
}

/**
 * **In context, a document status bar with two actions.** The real seat this component sits in:
 * `DocumentStatusBarActions.tsx:168` anchors `ActionStateDialog` to whichever action button
 * triggered it, and only one action's dialog is ever open at a time. Delete opens the `confirm`
 * branch anchored to its own trigger; Move opens the `dialog` branch centered over the canvas.
 * Same router, two different real requests.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <OverlayFrame minHeight={260}>
      <InContextHarness />
    </OverlayFrame>
  ),
}
