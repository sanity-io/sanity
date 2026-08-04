import {type PortableTextBlock} from '@sanity/types'
import {Box, Button as UIButton, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useCallback, useState} from 'react'
import {FreeTrialContext} from 'sanity/_singletons'

// Real component from its real path (org contract §8). FreeTrial is the state machine behind
// the navbar's trial badge: it reads FreeTrialContext (data, showDialog, showOnLoad) and
// decides whether to render nothing, a bare button, an auto-opened popover, or an auto-opened
// modal. The leaf pieces it composes (FreeTrialButtonTopbar/Sidebar, PopoverContent) already
// have isolated fixture stories in `Laws & Behaviors/Upsell`; this page is the routing logic
// around them, driven through the real context the way `DocumentStatusBarActions` etc. do.
import {FreeTrial} from '../../../../packages/sanity/src/core/studio/components/navbar/free-trial/FreeTrial'
import {
  type FreeTrialDialog,
  type FreeTrialResponse,
} from '../../../../packages/sanity/src/core/studio/components/navbar/free-trial/types'
import {NavbarProviders, NavbarStoryFrame} from '../../lib/navbarHarness'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'

const studioConfig = {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}}

// A small inline gradient so the dialog/popover hero image renders fully offline (the real
// `FreeTrialDialog.image.asset.url` points at a Sanity CDN asset).
const HERO_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#7c4dff"/><stop offset="1" stop-color="#1f6feb"/>
       </linearGradient></defs>
       <rect width="600" height="200" fill="url(#g)"/>
     </svg>`,
  )

const paragraph = (text: string): PortableTextBlock[] => [
  {
    _type: 'block',
    _key: 'p',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 'p0', text, marks: []}],
  },
]

// `id` follows the exact catalog `getTrialStage()` (in `__telemetry__/trialDialogEvents.telemetry.ts`)
// matches by string: 'free-upgrade-popover' -> trialStarted, 'trial-ending-popover' ->
// trialEndingSoon, 'project-downgraded-to-free' -> trialEnded, 'after-trial-upgrade' ->
// postTrial (showOnClick only). Real ids, not invented ones, since that function is the one
// place in this tree that names the actual lifecycle moments.
function makeDialog(
  overrides: Partial<FreeTrialDialog> & Pick<FreeTrialDialog, 'id' | 'dialogType' | 'headingText'>,
): FreeTrialDialog {
  return {
    _id: overrides.id,
    _type: 'dialog',
    _createdAt: '2026-07-01T00:00:00.000Z',
    _updatedAt: '2026-07-01T00:00:00.000Z',
    _rev: 'rev',
    descriptionText: paragraph('You are on the Growth trial.'),
    image: {asset: {url: HERO_IMAGE, altText: 'Free trial'}},
    ...overrides,
  }
}

/**
 * Reproduces `FreeTrialProvider.tsx`'s `toggleShowContent` exactly (including the
 * dismiss-persistence POST it fires), since that is the actual state machine `FreeTrial.tsx`
 * is driven by. The real provider also owns the initial `/journey/trial` fetch; this fixture
 * skips that (data is supplied directly, see the meta docblock's Loading story for what the
 * pre-fetch state looks like) and reimplements only the toggle logic, which is the part that
 * determines what a click or a dismissal actually does.
 */
function FreeTrialFixture({
  data,
  initialShowOnLoad = false,
  initialShowDialog = false,
  onDismiss,
  children,
}: {
  data: FreeTrialResponse | null
  initialShowOnLoad?: boolean
  initialShowDialog?: boolean
  onDismiss?: (dialogId: string) => void
  children: ReactNode
}) {
  const [showDialog, setShowDialog] = useState(initialShowDialog)
  const [showOnLoad, setShowOnLoad] = useState(initialShowOnLoad)

  // Structured to match `FreeTrialProvider.tsx`'s `toggleShowContent` exactly: reads
  // `showOnLoad` from the closure rather than a functional update, same as the real source.
  const toggleShowContent = useCallback(
    (closeAndReOpen = false) => {
      if (showOnLoad) {
        setShowOnLoad(false)
        setShowDialog(closeAndReOpen)
        const dialogId = data?.showOnLoad?.id
        if (dialogId) onDismiss?.(dialogId)
      } else {
        setShowDialog((p) => !p)
      }
    },
    [showOnLoad, data, onDismiss],
  )

  return (
    <FreeTrialContext.Provider value={{data, showDialog, showOnLoad, toggleShowContent}}>
      {children}
    </FreeTrialContext.Provider>
  )
}

const meta: Meta = {
  title: 'Navbar & Shell/Free Trial',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    // Every story is a fixed, self-contained fixture of `data`; there is no component prop
    // type here for a controls panel to drive.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'FreeTrial is the one navbar control built to persuade rather than inform: it can put ' +
            'itself in front of a person the moment Studio loads, without anyone asking for it.',
          '',
          '|        |                                                                                                                                                                                                                                                                                                                                     |',
          '| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/components/navbar/free-trial/FreeTrial.tsx`                                                                                                                                                                                                                                                        |',
          '| Tier   | CHROME, a conversion surface painted over the navbar. `UpsellPanel` and the free-trial leaf pieces already have prop-driven fixture stories in `Laws & Behaviors/Upsell`; this page drives the real `FreeTrial` component through `FreeTrialContext` the way the real navbar does, so it is the routing logic those pages leave out |',
          '| Audit  | 🟡 needs-work (`interruption-cost`, `escape-hatch`). An auto-shown `modal` blocks the rest of the navbar the instant Studio boots, before any action from the person using it, and the auto-shown `popover` has no click-outside or Escape dismissal at all                                                                         |',
          '',
          'Everything downstream of `FreeTrialContext` is server-decided: `showOnLoad`, ' +
            "`showOnClick`, `daysLeft`, the dialog's heading, image and CTA copy all come from a " +
            '`/journey/trial` fetch that `FreeTrialProvider.tsx` performs (out of scope here, and ' +
            'not reproducible from this repo: it is a real backend endpoint). `FreeTrial` itself ' +
            'only reads whatever the context hands it and picks a branch. Answering the four ' +
            'questions below meant tracing that branch logic, not the server.',
          '',
          '<details><summary><b>Days remaining has exactly one client-side boundary, and it is ' +
            'a plain truthiness check, not <code>daysLeft <= 0</code>.</b></summary>',
          '',
          '`FreeTrialButtonTopbar`/`FreeTrialButtonSidebar` (`FreeTrialButton.tsx`) render ' +
            "`daysLeft ? t('...days-count', {count: daysLeft}) : t('...trial-finished')` for the " +
            "tooltip/label, and the topbar's progress ring is gated on `daysLeft > 0 && " +
            '<SvgFilledOutline />`. So `daysLeft === 0` is a real, distinct, client-derived ' +
            'state: different copy, ring gone. Everything else (whether a dialog auto-shows, what ' +
            'it says, whether one exists at all once the trial is over) is server content. The ' +
            'real dialog-id catalog lives in `getTrialStage()` ' +
            '(`__telemetry__/trialDialogEvents.telemetry.ts`), which is telemetry-only but names ' +
            'the actual lifecycle moments by matching literal ids: `free-upgrade-popover` (trial ' +
            'started), `trial-ending-popover` (ending soon), `project-downgraded-to-free` (trial ' +
            'ended, shown on load), `after-trial-upgrade` (post-trial, `showOnClick` only, never ' +
            "auto-shown). This page's fixtures use those real ids rather than invented ones.",
          '',
          '</details>',
          '',
          '<details><summary><b>Two different closes exist, and only one of them is actually a ' +
            'close.</b></summary>',
          '',
          '`handleClose` (the X, click-outside on the modal, the secondary button, or a CTA ' +
            "with `action: 'closeDialog'`) calls `toggleShowContent(false)`, which sets " +
            '`showDialog` to `false` and, if the dismissed dialog was the auto-shown one, fires ' +
            "`client.request({url: '/journey/trial/' + id, method: 'POST'})` " +
            '(`FreeTrialProvider.tsx:92`), a real persistence call. But the primary CTA path ' +
            "(`action: 'openNext'` or `'openUrl'`, and clicking the trigger button itself) calls " +
            '`closeAndReOpen()`, which is `toggleShowContent(true)`: this also fires the same ' +
            'POST, but sets `showDialog` to `true`, not `false`. Since `dialogToRender` is ' +
            '`showOnLoad ? data.showOnLoad : data.showOnClick`, and this path flips `showOnLoad` ' +
            'to `false`, the effect is not a close: the dialog swaps in place from the auto one ' +
            'to `data.showOnClick` (if one exists) while staying open. If `data.showOnClick` is ' +
            'null, `dialogToRender` becomes null and the whole component, badge included, ' +
            'disappears. This repo cannot confirm whether the server actually stops returning ' +
            '`showOnLoad` for a dismissed dialog id on the next fetch: the POST looks like a ' +
            '"mark seen" call and the endpoint shape supports that reading, but the server side ' +
            'of that contract is outside this codebase, so treat that half as inferred, not ' +
            'verified. The POST is real and observable; what it changes on the next boot is not.',
          '',
          '</details>',
          '',
          '<details><summary><b>Loading renders literally nothing, not a ' +
            'skeleton.</b></summary>',
          '',
          '`data` starts `null` and `FreeTrial` opens with `if (!data?.id) return null`. The ' +
            '**Loading** story below is empty on purpose. The badge does not fade in; it pops ' +
            'into existence the render after the fetch resolves. Every Studio boot passes through ' +
            'this state.',
          '',
          '</details>',
          '',
          '<details><summary><b>The auto-shown modal blocks the rest of the navbar, and nobody ' +
            'asked for it: the headline finding.</b></summary>',
          '',
          "The `popover` branch renders `@sanity/ui`'s `Popover` with no `modal` prop set (that " +
            'prop, "blocks all pointer interaction with elements beneath the popover until ' +
            'closed", defaults to `false` and `FreeTrial.tsx` never sets it), so it is ' +
            'non-blocking, the rest of the navbar stays clickable underneath it. The `modal` ' +
            'branch is a real `Dialog` at its default `position: fixed`, and Studio can auto-open ' +
            'it with `showOnLoad` the instant the trial data resolves, before the person has ' +
            'clicked anything. **Trial ended (auto modal, blocks the navbar)** below reproduces ' +
            'it next to two decoy navbar controls so the blocking is visible, not just asserted.',
          '',
          '</details>',
          '',
          '> **Why it matters:** an interruption nobody asked for that also blocks the rest of ' +
            'the chrome is the worst combination this family can produce. A dialog that must be ' +
            'seen is a design choice; a dialog that also disables the search and account buttons ' +
            'beside it is a design accident wearing the same clothes.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:navbar',
    'chapter:behaviors',
    'pattern:interruption-cost',
    'pattern:escape-hatch',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

/**
 * `data` is `null`, the state before `/journey/trial` resolves. `FreeTrial` opens with
 * `if (!data?.id) return null`, so this renders literally nothing, not a skeleton. Storied
 * explicitly because it is the most-seen state of all: every Studio boot passes through it.
 */
export const Loading: Story = {
  render: () => (
    <NavbarProviders>
      <FreeTrialFixture data={null}>
        <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 420}}>
          <Stack gap={3}>
            <FreeTrial type="topbar" />
            <Text size={0} muted>
              the dashed box is the story frame; the component itself rendered nothing
            </Text>
          </Stack>
        </Card>
      </FreeTrialFixture>
    </NavbarProviders>
  ),
}

/**
 * `data.id` is present (the fetch resolved) but both `showOnLoad` and `showOnClick` are
 * `null`, no dialog left to offer. `dialogToRender` is null, so the second guard,
 * `if (!dialogToRender) return null`, also produces nothing, including the button itself.
 * A different branch from Loading reaching the identical output: the trial machinery does
 * not linger as a disabled badge once the server has nothing left to pitch, it vanishes.
 */
export const NoDialogAvailable: Story = {
  name: 'No dialog available (also renders nothing)',
  render: () => {
    const data: FreeTrialResponse = {
      id: 'trial',
      icon: 'bolt',
      style: 'default',
      showOnLoad: null,
      showOnClick: null,
      daysLeft: 0,
      totalDays: 14,
    }
    return (
      <NavbarProviders>
        <FreeTrialFixture data={data}>
          <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 420}}>
            <Stack gap={3}>
              <FreeTrial type="topbar" />
              <Text size={0} muted>
                the dashed box is the story frame; the component itself rendered nothing
              </Text>
            </Stack>
          </Card>
        </FreeTrialFixture>
      </NavbarProviders>
    )
  },
}

/**
 * Mid-trial, nothing auto-shown (`showOnLoad: false`), only the badge. Both placements side
 * by side under the same `daysLeft`, since `type` is `FreeTrial`'s own prop: the topbar bolt
 * with its circular progress ring, and the sidebar/user-menu text row. Hover either for the
 * real translated tooltip ("9 days left"). Click either to open `data.showOnClick` on demand.
 */
export const TrialActive: Story = {
  name: 'Trial active, badge only',
  render: () => {
    const data: FreeTrialResponse = {
      id: 'trial',
      icon: 'bolt',
      style: 'default',
      showOnLoad: null,
      showOnClick: makeDialog({
        id: 'free-upgrade-popover',
        dialogType: 'popover',
        headingText: '9 days left in your Growth trial',
        descriptionText: paragraph(
          'Add a plan to keep releases, comments and tasks after it ends.',
        ),
        ctaButton: {text: 'Choose a plan', action: 'openUrl', url: 'https://www.sanity.io/pricing'},
        secondaryButton: {text: 'Dismiss'},
      }),
      daysLeft: 9,
      totalDays: 14,
    }
    return (
      <NavbarProviders>
        <FreeTrialFixture data={data}>
          <Flex gap={4} align="center" padding={4}>
            <Stack gap={3}>
              <Text size={0} muted>
                Top bar
              </Text>
              <FreeTrial type="topbar" />
            </Stack>
            <Box style={{minWidth: 220}}>
              <Stack gap={3}>
                <Text size={0} muted>
                  Sidebar / user menu
                </Text>
                <FreeTrial type="sidebar" />
              </Stack>
            </Box>
          </Flex>
        </FreeTrialFixture>
      </NavbarProviders>
    )
  },
}

function DismissLog({lastDismissed}: {lastDismissed: string | null}) {
  return (
    <Text size={0} muted>
      {lastDismissed
        ? `Last dismissal: FreeTrialProvider.tsx would POST /journey/trial/${lastDismissed} here (not sent by this fixture).`
        : 'Nothing dismissed yet.'}
    </Text>
  )
}

/**
 * `showOnLoad: true`, the trial-ending popover auto-opens the moment this mounts, exactly as
 * it would on Studio boot. Two real, distinct closes to try:
 *
 * - **Dismiss** (secondary button) or clicking outside calls `handleClose`, a true close:
 *   `showDialog` goes to `false` and the fixture logs the persistence POST the real provider
 *   would fire (`FreeTrialProvider.tsx:92`).
 * - **Choose a plan** (`ctaButton.action: 'openNext'`) calls `closeAndReOpen`, which is NOT a
 *   close: it marks this dialog seen (same POST) but sets `showDialog` back to `true` and
 *   flips `showOnLoad` to `false`, so `dialogToRender` swaps to `data.showOnClick`, a
 *   different dialog with different copy, still open. Click it to see the swap rather than a
 *   close, then dismiss the second dialog to actually clear the badge's popover.
 */
export const TrialEndingSoon: Story = {
  name: 'Trial ending soon (auto popover on load)',
  render: () => {
    function Demo() {
      const [lastDismissed, setLastDismissed] = useState<string | null>(null)
      const data: FreeTrialResponse = {
        id: 'trial',
        icon: 'bolt',
        style: 'default',
        showOnLoad: makeDialog({
          id: 'trial-ending-popover',
          dialogType: 'popover',
          headingText: '2 days left in your Growth trial',
          descriptionText: paragraph('Your trial ends soon. Choose a plan to keep your work.'),
          ctaButton: {text: 'Choose a plan', action: 'openNext'},
          secondaryButton: {text: 'Dismiss'},
        }),
        showOnClick: makeDialog({
          id: 'after-trial-upgrade',
          dialogType: 'popover',
          headingText: 'Choose a plan to keep Growth features',
          descriptionText: paragraph('Comments, tasks and releases pause when the trial ends.'),
          ctaButton: {text: 'View plans', action: 'openUrl', url: 'https://www.sanity.io/pricing'},
          secondaryButton: {text: 'Not now'},
        }),
        daysLeft: 2,
        totalDays: 14,
      }
      return (
        <FreeTrialFixture
          data={data}
          initialShowOnLoad
          initialShowDialog
          onDismiss={setLastDismissed}
        >
          <Stack gap={4}>
            <Flex padding={4} justify="flex-end">
              <FreeTrial type="topbar" />
            </Flex>
            <DismissLog lastDismissed={lastDismissed} />
          </Stack>
        </FreeTrialFixture>
      )
    }
    return (
      <NavbarProviders>
        <Demo />
      </NavbarProviders>
    )
  },
}

/**
 * **The headline finding.** `showOnLoad: true` with `dialogType: 'modal'`, `daysLeft: 0`
 * (the `project-downgraded-to-free` id, per `getTrialStage`). The modal auto-opens the moment
 * this mounts, matching an unprompted Studio boot, and sits beside two decoy navbar controls
 * so the blocking is visible: the modal's backdrop covers them, and they do not respond to
 * clicks until the dialog closes. The badge itself has lost its progress ring and reads
 * "Trial finished" (hover it once the dialog is closed), the `daysLeft > 0` boundary from the
 * meta docblock.
 */
export const TrialEndedBlockingModal: Story = {
  name: 'Trial ended (auto modal, blocks the navbar)',
  render: function TrialEndedBlocking(_args, {viewMode, id, name}) {
    // Blocking is the point of this story, and on a docs page it blocks the wrong thing. The
    // modal auto-opens on mount with no trigger and no play function, so on the composed autodocs
    // page it portals a viewport-centered `Dialog` over the prose and every other story on the
    // page, exactly the takeover `lib/overlayStoryNotice.tsx` was written for (ledger #50). The
    // component is behaving correctly: a trial-ended modal is SUPPOSED to block. So this stands a
    // notice in on the docs surface and leaves the real, blocking modal in the canvas where it
    // has the viewport to itself and the two decoy navbar controls beside it mean something.
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    const data: FreeTrialResponse = {
      id: 'trial',
      icon: 'bolt',
      style: 'default',
      showOnLoad: makeDialog({
        id: 'project-downgraded-to-free',
        dialogType: 'modal',
        headingText: 'Your Growth trial has ended',
        descriptionText: paragraph(
          'This project moved to the Free plan. Choose a plan to restore releases, comments and tasks.',
        ),
        ctaButton: {text: 'Choose a plan', action: 'closeDialog'},
        secondaryButton: {text: 'Not now'},
      }),
      showOnClick: null,
      daysLeft: 0,
      totalDays: 14,
    }
    return (
      <NavbarProviders>
        <FreeTrialFixture data={data} initialShowOnLoad initialShowDialog>
          <NavbarStoryFrame align="end">
            <UIButton mode="bleed" text="Search" onClick={() => undefined} />
            <UIButton mode="bleed" text="Account" onClick={() => undefined} />
            <FreeTrial type="topbar" />
          </NavbarStoryFrame>
        </FreeTrialFixture>
      </NavbarProviders>
    )
  },
}

/**
 * `daysLeft: 0`, nothing auto-shown (`showOnLoad: false`, `showOnLoad: null` in the data),
 * only `data.showOnClick` (`after-trial-upgrade`). The badge reads "Trial finished" and has no
 * progress ring (`daysLeft > 0` is false), but it is not gone, per **No dialog available**
 * above, the badge only disappears once the server has nothing left to offer at all. Click it
 * to open the on-demand modal: a real link to pricing, per `UpsellPanels`' honest-affordance
 * convention.
 */
export const PostTrialOnDemand: Story = {
  name: 'Post-trial, on-demand only',
  render: () => {
    const data: FreeTrialResponse = {
      id: 'trial',
      icon: 'bolt',
      style: 'default',
      showOnLoad: null,
      showOnClick: makeDialog({
        id: 'after-trial-upgrade',
        dialogType: 'modal',
        headingText: 'Choose a plan to keep Growth features',
        descriptionText: paragraph('Comments, tasks and releases pause when the trial ends.'),
        ctaButton: {text: 'Choose a plan', action: 'openUrl', url: 'https://www.sanity.io/pricing'},
        secondaryButton: {text: 'Not now'},
      }),
      daysLeft: 0,
      totalDays: 14,
    }
    return (
      <NavbarProviders>
        <FreeTrialFixture data={data}>
          <Flex padding={4} justify="flex-end">
            <FreeTrial type="topbar" />
          </Flex>
        </FreeTrialFixture>
      </NavbarProviders>
    )
  },
}

/**
 * **In context, the trailing cluster of a real navbar.** Mid-trial, idle (nothing auto-shown),
 * next to two decoy controls in a full-width bar, the real placement instead of an isolated
 * canvas. Click the badge to open the on-demand dialog; the decoys stay responsive throughout,
 * unlike **Trial ended (auto modal, blocks the navbar)** above.
 */
export const InContext: Story = {
  name: 'In context, the trailing cluster',
  render: () => {
    const data: FreeTrialResponse = {
      id: 'trial',
      icon: 'bolt',
      style: 'default',
      showOnLoad: null,
      showOnClick: makeDialog({
        id: 'free-upgrade-popover',
        dialogType: 'popover',
        headingText: '9 days left in your Growth trial',
        descriptionText: paragraph(
          'Add a plan to keep releases, comments and tasks after it ends.',
        ),
        ctaButton: {text: 'Choose a plan', action: 'openUrl', url: 'https://www.sanity.io/pricing'},
        secondaryButton: {text: 'Dismiss'},
      }),
      daysLeft: 9,
      totalDays: 14,
    }
    return (
      <NavbarProviders>
        <FreeTrialFixture data={data}>
          <NavbarStoryFrame align="end">
            <UIButton mode="bleed" text="Search" onClick={() => undefined} />
            <UIButton mode="bleed" text="Account" onClick={() => undefined} />
            <FreeTrial type="topbar" />
          </NavbarStoryFrame>
        </FreeTrialFixture>
      </NavbarProviders>
    )
  },
}
