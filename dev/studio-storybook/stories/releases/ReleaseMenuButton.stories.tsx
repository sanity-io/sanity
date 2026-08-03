import {ArchiveIcon} from '@sanity/icons/Archive'
import {CopyIcon} from '@sanity/icons/Copy'
import {TrashIcon} from '@sanity/icons/Trash'
import {Card, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo, useState} from 'react'
import {ResourceCacheContext} from 'sanity/_singletons'
import {route, RouterProvider} from 'sanity/router'
import {expect, userEvent, within} from 'storybook/test'

// Real components from their real paths (org contract: read the real thing, do not reimplement).
import {type ReleaseActionComponent} from '../../../../packages/sanity/src/core/config/releases/actions'
import {Chip} from '../../../../packages/sanity/src/core/releases/components/Chip'
import {ReleaseActionsResolver} from '../../../../packages/sanity/src/core/releases/components/ReleaseActionsResolver'
import {ScheduleDatePicker} from '../../../../packages/sanity/src/core/releases/components/ScheduleDatePicker'
import {ReleaseDocumentPreview} from '../../../../packages/sanity/src/core/releases/tool/components/ReleaseDocumentPreview'
import {DuplicateReleaseToastLink} from '../../../../packages/sanity/src/core/releases/tool/components/ReleaseMenuButton/DuplicateReleaseToastLink'
import {ReleaseMenu} from '../../../../packages/sanity/src/core/releases/tool/components/ReleaseMenuButton/ReleaseMenu'
import {
  type ActionResult,
  ReleaseMenuButton,
} from '../../../../packages/sanity/src/core/releases/tool/components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleasePreviewCard} from '../../../../packages/sanity/src/core/releases/tool/components/ReleaseMenuButton/ReleasePreviewCard'
import {
  type ResourceCache,
  useResourceCache,
} from '../../../../packages/sanity/src/core/store/ResourceCacheProvider'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../../packages/sanity/src/core/studio/constants'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {allReleaseFixtures, documentsInRelease, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const VALID_DOCS = documentsInRelease.valid()

function MenuStage({children, note}: {children: ReactNode; note?: string}) {
  return (
    <Stack gap={3}>
      {note && (
        <Text size={1} muted>
          {note}
        </Text>
      )}
      <Card radius={2} shadow={2} style={{maxWidth: 320}}>
        <Menu>{children}</Menu>
      </Card>
    </Stack>
  )
}

/**
 * Wraps a story in its own permission cache that never resolves, by reading the real seeded
 * `ResourceCache` (from the outer `WithStudioProviders` decorator) and shadowing only the
 * `ReleasePermissions` namespace. Every other namespace (presence, project, releases, grants,
 * preview store) passes straight through to the real seeded values, so the rest of the harness
 * behaves exactly as it does everywhere else in this file - only the permission check is frozen.
 */
const stuckPermissionsStore = {
  checkWithPermissionGuard: () => new Promise<boolean>(() => {}),
  permissions: {},
}

function StuckPermissionCheck({children}: {children: ReactNode}) {
  const outer = useResourceCache()
  const stuck = useMemo<ResourceCache>(
    () => ({
      get: <T,>(options: {namespace: string; dependencies: (object | null)[]}) =>
        // oxlint-disable-next-line no-unsafe-type-assertion -- narrowing to the caller's generic is the whole point of a resource cache lookup
        (options.namespace === 'ReleasePermissions'
          ? stuckPermissionsStore
          : outer.get(options)) as T | undefined,
      set: (options) => outer.set(options),
    }),
    [outer],
  )
  return <ResourceCacheContext.Provider value={stuck}>{children}</ResourceCacheContext.Provider>
}

const withReleases = WithStudioProviders({releases: allReleaseFixtures})
const withNoPermission = WithStudioProviders({
  releases: allReleaseFixtures,
  canPerformReleaseActions: false,
})
/*
 * Decorator composition order matters here: Storybook's `decorators.reduce(...)` makes the
 * LAST array element the outermost wrapper and the FIRST the innermost (the one rendered
 * closest to the raw story) - see `stories/beta/PaneDrivenBanners.stories.tsx` and
 * `stories/screens/NotAuthenticatedScreen.stories.tsx` for the same shape (a context-dependent
 * decorator first, `WithStudioProviders()` last). `StuckPermissionCheck` reads the seeded
 * `ResourceCache` via `useResourceCache()`, so it must render INSIDE `withReleases`'s
 * `StudioProvidersInner`, not outside it - putting `withReleases` first would make it the
 * inner wrapper instead, rendering `StuckPermissionCheck` above the provider it depends on
 * and throwing "Could not find `cache` context".
 */
const withStuckPermission = [
  (Story: () => ReactNode) => (
    <StuckPermissionCheck>
      <Story />
    </StuckPermissionCheck>
  ),
  withReleases,
]

/* `ReleaseDocumentPreview` resolves a real preview through `useDocumentPreviewValues`, which
   reads the seeded `documentPreviewStore` - the version doc and its published counterpart get
   deliberately different titles, so `isGoingToBePublished` switching which one resolves is a
   visible difference rather than a described one. Two more fixtures below have no `title` field
   at all (not `title: ''` - an empty string still fails the `=== undefined` check the fallback
   relies on, which is a different, untested code path); `article-deleted` is deliberately never
   added to the store, to reach the "resolved to nothing" branch on purpose. */
const previewSchemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
]
const previewDocuments = [
  {
    _id: 'versions.rASAP.article-launch',
    _type: 'article',
    _rev: 'rev-version-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-20T09:00:00Z',
    title: 'Autumn campaign launch (release copy)',
  },
  {
    _id: 'article-launch',
    _type: 'article',
    _rev: 'rev-published-1',
    _createdAt: '2026-01-01T09:00:00Z',
    _updatedAt: '2026-01-01T09:00:00Z',
    title: 'Autumn campaign launch (published copy)',
  },
  {
    _id: 'versions.rASAP.article-alpha',
    _type: 'article',
    _rev: 'rev-alpha-1',
    _createdAt: '2026-06-02T09:00:00Z',
    _updatedAt: '2026-06-02T09:00:00Z',
    // No `title` field - a real document an editor never named, not an empty string.
  },
  {
    _id: 'versions.rASAP.article-beta',
    _type: 'article',
    _rev: 'rev-beta-1',
    _createdAt: '2026-06-03T09:00:00Z',
    _updatedAt: '2026-06-03T09:00:00Z',
    // A second, different document, also never named.
  },
]
const withDocumentPreview = WithStudioProviders({
  releases: allReleaseFixtures,
  previewStore: createMockPreviewUniverse({documents: previewDocuments}).store,
  config: {schema: {name: 'mock', types: previewSchemaTypes}},
})

const meta: Meta = {
  title: 'Releases/Release Menu Button',
  parameters: {
    docs: {
      description: {
        component: [
          'Every permission-gated row in this menu stays disabled with an explanatory tooltip ' +
            'rather than disappearing, the same choice CreateReleaseMenuItem makes. But that ' +
            'restraint does not extend everywhere: confirmation itself is not uniform across the ' +
            'six mutating actions this menu can take, and one of them has no permission check at ' +
            'all.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/components/ReleaseMenuButton/`, `packages/sanity/src/core/releases/components/` (top level), `packages/sanity/src/core/releases/tool/` (top level), `packages/sanity/src/core/releases/tool/components/` (top level) |',
          '| Tier | SERVICE |',
          '| Patterns | `destructive-confirmation` · `menu-item` |',
          '| Coverage | the ellipsis menu and everything it is built from: the item list (`ReleaseMenu`), the button/popover/confirm-dialog shell (`ReleaseMenuButton`), a toast-only link (`DuplicateReleaseToastLink`), the confirm-dialog preview card (`ReleasePreviewCard`), plus the shared pieces the release surfaces reuse: a pill button wrapper (`Chip`), the custom-action hook resolver (`ReleaseActionsResolver`), the schedule-time picker (`ScheduleDatePicker`), and the clickable document row (`ReleaseDocumentPreview`) |',
          '',
          '`MenuNoPermission` below shows the whole menu in the hidden-or-disabled state at once.',
          '',
          'Delete, archive and duplicate all open a dialog naming the release (via ' +
            '`ReleasePreviewCard`) plus a document count ("This will delete 3 document ' +
            'versions."). But that count is all it says, not which three, matching the pattern ' +
            'ledger 113 found in the revert dialog one level up. And when the release is empty, ' +
            'the count sentence does not render at all, the dialog is just the header and the ' +
            'preview card (`ConfirmDeleteEmptyRelease`). Unschedule and unarchive skip ' +
            'confirmation entirely: their `confirmDialog` config is `false` for both, and ' +
            "`ReleaseMenuButton`'s own effect fires the action the instant it is selected. Nothing " +
            'in the row itself signals which kind of click an item is (`UnscheduleHasNoConfirmation` ' +
            'shows the same click producing no dialog at all, next to ones that do).',
          '',
          'Does anything proceed past a permission check still in flight? No, for the six checked ' +
            'actions. Every permission flag in `ReleaseMenu` starts life as a nullable boolean, ' +
            'and every place it gates a `disabled` prop reads null as falsy, so the row is ' +
            'disabled from the very first paint, before the async permission check has even ' +
            'settled. `ButtonPermissionCheckNeverResolves` proves this by freezing the check ' +
            'forever: the button stays disabled indefinitely rather than opening a window where ' +
            'it is clickable.',
          '',
          'Tracing every fixture release state against both values of `ignoreCTA`, at least one ' +
            'menu item always survives; the closest to empty is `MenuLocked`, where Archive ' +
            'renders disabled-with-tooltip alongside a live Unschedule and Duplicate. A menu with ' +
            'zero rows is not a state this component reaches on its own.',
          '',
          '> **Why it matters:** unschedule has no permission check at all. There is no permission ' +
            'state for it and its disabled prop is just the caller-supplied flag, every other ' +
            'mutating action in this menu is gated on a resolved grant, this one is not gated on ' +
            'anything.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:destructive-confirmation',
    'pattern:menu-item',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/* ────────────────────────────────────────────────────────────────────────
   ReleaseMenu - the item list. Five returns (unschedule, publish-or-schedule
   pair, duplicate, archive-or-unarchive, delete), enumerated by release state
   and by `ignoreCTA`, which hides only the CTA that matches the release's own
   type rather than every primary action. */

export const MenuAsapActive: Story = {
  name: 'ReleaseMenu - active, asap',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'An active asap release. `ActionsOrder` puts publish first for this type. Publish, Duplicate, Archive - Unschedule and Delete are both null (state is not scheduled/scheduling, and not archived/published).',
      },
    },
  },
  render: () => (
    <MenuStage>
      <ReleaseMenu
        release={releaseFixtures.asap}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

export const MenuScheduledActive: Story = {
  name: 'ReleaseMenu - active, scheduled type (ordering)',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          '`releaseType: "scheduled"` flips `ActionsOrder` to `[scheduleMenuItem, publishMenuItem]`, so Schedule appears before Publish - the only visible effect of the type on an otherwise-identical active release. Duplicate and Archive follow, same as the asap case.',
      },
    },
  },
  render: () => (
    <MenuStage>
      <ReleaseMenu
        release={releaseFixtures.scheduled}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

export const MenuIgnoreCtaOnScheduledType: Story = {
  name: 'ReleaseMenu - ignoreCTA, scheduled type',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          "`ignoreCTA` is meant to hide the CTA a release's own header already shows - but it only hides the CTA that *matches* the release type. For a scheduled-type release that means Schedule is hidden (its condition is `ignoreCTA && releaseType === 'scheduled'`) while Publish stays, because publishing now instead of waiting is a still-available secondary action, not the one already on the header. Unschedule is hidden outright (its condition is just `ignoreCTA`, no type check).",
      },
    },
  },
  render: () => (
    <MenuStage note="Same release as above, ignoreCTA now true: Schedule drops out, Publish stays.">
      <ReleaseMenu
        ignoreCTA
        release={releaseFixtures.scheduled}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

export const MenuLocked: Story = {
  name: 'ReleaseMenu - scheduled (locked)',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'A release in the `scheduled` state (committed, not just intended) is locked: Unschedule appears, Duplicate is live, and Archive renders but disabled - its tooltip explains why (`action.archive.tooltip`) rather than the permission-error copy, because here the block is the lock, not the grant.',
      },
    },
  },
  render: () => (
    <MenuStage>
      <ReleaseMenu
        release={releaseFixtures.scheduledLocked}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

export const MenuArchived: Story = {
  name: 'ReleaseMenu - archived',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story: 'Archived releases offer exactly two rows: Unarchive and Delete.',
      },
    },
  },
  render: () => (
    <MenuStage>
      <ReleaseMenu
        release={releaseFixtures.archived}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

export const MenuPublished: Story = {
  name: 'ReleaseMenu - published',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'A published release offers exactly one row: Delete. Everything else nulls out (archive/unarchive returns null for `state === "published"`, duplicate returns null for published or archived, publish/schedule return null for non-active states, unschedule is not scheduled).',
      },
    },
  },
  render: () => (
    <MenuStage>
      <ReleaseMenu
        release={releaseFixtures.published}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

export const MenuNoPermission: Story = {
  name: 'ReleaseMenu - without permission',
  decorators: [withNoPermission],
  parameters: {
    docs: {
      description: {
        story:
          'The same active-asap menu, seeded with `canPerformReleaseActions: false`. Every row still renders; each is disabled and its tooltip names the missing grant (`permissions.error.archive`, `.duplicate`, and so on). Hidden rows would give an editor nothing to ask about - a disabled row with a reason at least names who to ask.',
      },
    },
  },
  render: () => (
    <MenuStage>
      <ReleaseMenu
        release={releaseFixtures.asap}
        documents={VALID_DOCS}
        disabled={false}
        setSelectedAction={() => {}}
      />
    </MenuStage>
  ),
}

/* ────────────────────────────────────────────────────────────────────────
   ReleaseMenuButton - the button, popover and confirm-dialog shell around
   `ReleaseMenu`. These stories click through the real popover (a body-level
   portal), so each play function scopes its queries to
   `canvasElement.ownerDocument.body` rather than the canvas alone. */

export const ButtonClosed: Story = {
  name: 'ReleaseMenuButton - closed',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story: 'The default, unopened state: one bleed-mode ellipsis button.',
      },
    },
  },
  render: () => (
    <ReleaseMenuButton release={releaseFixtures.asap} documentsCount={3} documents={VALID_DOCS} />
  ),
}

export const ButtonOpenMenu: Story = {
  name: 'ReleaseMenuButton - open',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story: 'Clicked open, on an active asap release: Publish, Duplicate, Archive.',
      },
    },
  },
  render: () => (
    <ReleaseMenuButton release={releaseFixtures.asap} documentsCount={3} documents={VALID_DOCS} />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('release-menu-button'))
    await within(canvasElement.ownerDocument.body).findByTestId('archive-release-menu-item')
  },
}

export const ButtonConfirmDelete: Story = {
  name: 'ReleaseMenuButton - confirm delete',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'Delete opens a confirm dialog: the `ReleasePreviewCard` names the release, and the description names a count - "This will delete 3 document versions." - not which three.',
      },
    },
  },
  render: () => (
    <ReleaseMenuButton
      release={releaseFixtures.published}
      documentsCount={VALID_DOCS.length}
      documents={VALID_DOCS}
    />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('release-menu-button'))
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByTestId('delete-release-menu-item'))
    await body.findByTestId('confirm-delete-dialog')
  },
}

export const ButtonConfirmDeleteEmptyRelease: Story = {
  name: 'ReleaseMenuButton - confirm delete, empty release',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'The same dialog with `documentsCount={0}`. `{!!documentsCount && <Text>...}` is false, so the count sentence does not render at all - the confirmation is the header and the preview card, nothing naming what (if anything) is lost.',
      },
    },
  },
  render: () => (
    <ReleaseMenuButton release={releaseFixtures.published} documentsCount={0} documents={[]} />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('release-menu-button'))
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByTestId('delete-release-menu-item'))
    await body.findByTestId('confirm-delete-dialog')
  },
}

export const ButtonUnscheduleHasNoConfirmation: Story = {
  name: 'ReleaseMenuButton - unschedule has no confirmation',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'Unschedule looks exactly like every other row until you click it. `RELEASE_ACTION_MAP.unschedule.confirmDialog` is `false`, so `ReleaseMenuButton`\'s effect fires the action immediately - no dialog, and (unschedule has no `toastSuccessI18nKey`) no toast either on success. The play function clicks it and asserts no `[data-testid$="-dialog"]` ever appears, the direct contrast to `ButtonConfirmDelete` above.',
      },
    },
  },
  render: () => (
    <ReleaseMenuButton
      release={releaseFixtures.scheduledLocked}
      documentsCount={VALID_DOCS.length}
      documents={VALID_DOCS}
    />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('release-menu-button'))
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByTestId('unschedule-release-menu-item'))
    await expect(body.queryByTestId(/confirm-.*-dialog/)).toBeNull()
  },
}

export const ButtonPermissionCheckNeverResolves: Story = {
  name: 'ReleaseMenuButton - permission check never resolves',
  decorators: withStuckPermission,
  parameters: {
    docs: {
      description: {
        story:
          'The permission promise never settles (see `StuckPermissionCheck` above). Every row that depends on a resolved grant stays disabled indefinitely, because the `useState<boolean | null>(null)` default reads as falsy - there is no window, however brief, where the row is clickable while the check is still pending.',
      },
    },
  },
  render: () => (
    <ReleaseMenuButton release={releaseFixtures.asap} documentsCount={3} documents={VALID_DOCS} />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('release-menu-button'))
    const archiveItem = await within(canvasElement.ownerDocument.body).findByTestId(
      'archive-release-menu-item',
    )
    await expect(archiveItem).toHaveAttribute('data-disabled')
  },
}

/* ────────────────────────────────────────────────────────────────────────
   DuplicateReleaseToastLink - a renderer whose input is the duplicate
   action's already-computed result. Both fixtures render byte-identical
   text; the `if (!actionResult || !('releaseId' in actionResult)) return`
   guard only matters at click time, inside `navigateToDuplicateRelease`. */

function ToastLinkDemo({actionResult, label}: {actionResult: ActionResult; label: string}) {
  const [navigatedTo, setNavigatedTo] = useState<string | null>(null)
  return (
    <RouterProvider
      // `navigateToDuplicateRelease` calls `router.navigate({releaseId: ...})`, a plain state
      // object, never `router.navigateIntent(...)`. `route.intents('/intents')` builds a route
      // whose path template is `/intents/:intent/:params/:payload`, so encoding `{releaseId}`
      // against it throws "State object is missing the following key defined in route: 'intent'"
      // (`_resolvePathFromState.ts`) - the exact error the sweep reported. `route.create('/', [
      // route.create('/:releaseId'), route.intents('/intents')])` is the real router shape this
      // component family is tested against elsewhere (`releases/tool/detail/__tests__/
      // ReleaseSummary.test.tsx:166`); mirrored here rather than inventing a bespoke one.
      router={route.create('/', [route.create('/:releaseId'), route.intents('/intents')])}
      state={{}}
      onNavigate={(nextState) => setNavigatedTo(JSON.stringify(nextState))}
    >
      <Stack gap={3} style={{maxWidth: 360}}>
        <Text size={1} muted>
          {label}
        </Text>
        <Card border padding={3} radius={2}>
          <DuplicateReleaseToastLink actionResult={actionResult} />
        </Card>
        <Text size={1} muted>
          {navigatedTo ? `Clicked - would navigate to ${navigatedTo}` : 'Not clicked yet.'}
        </Text>
      </Stack>
    </RouterProvider>
  )
}

export const ToastLinkWithReleaseId: Story = {
  name: 'DuplicateReleaseToastLink - with a releaseId',
  parameters: {
    docs: {
      description: {
        story:
          'The shape `handleDuplicate` actually produces (`{releaseId}`). Clicking the link parses the release id back out of the document id and navigates to it - watch the line below the card update.',
      },
    },
  },
  render: () => (
    <ToastLinkDemo
      actionResult={{releaseId: '_.releases.rDuplicated'}}
      label="actionResult = {releaseId: '_.releases.rDuplicated'}"
    />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('duplicate-release-success-link'))
    await canvas.findByText(/Clicked/)
  },
}

export const ToastLinkWithoutReleaseId: Story = {
  name: 'DuplicateReleaseToastLink - without a releaseId',
  parameters: {
    docs: {
      description: {
        story:
          "A `SingleActionResult` (`{transactionId}`), the shape every non-duplicate action returns. `ActionResult` is a union wide enough to include it, so the type system allows this input even though the one real caller never passes it. Reading the source, `'releaseId' in actionResult` is `false` and the handler returns before calling `router.navigate` - but the rendered link is byte-identical to the story above. Click it: the line below the card stays 'Not clicked yet', which is the only thing that tells the two apart.",
      },
    },
  },
  render: () => (
    <ToastLinkDemo
      actionResult={{transactionId: 'tx-no-release-id'}}
      label="actionResult = {transactionId: 'tx-no-release-id'} - no releaseId key"
    />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('duplicate-release-success-link'))
    await expect(canvas.queryByText(/Clicked/)).toBeNull()
  },
}

/* ────────────────────────────────────────────────────────────────────────
   ReleasePreviewCard - avatar, title (with fallback) and time, composed for
   the confirm dialogs above. */

export const PreviewCardTitled: Story = {
  name: 'ReleasePreviewCard - titled',
  decorators: [withReleases],
  render: () => (
    <Card style={{maxWidth: 360}}>
      <ReleasePreviewCard release={releaseFixtures.scheduled} />
    </Card>
  ),
}

export const PreviewCardUntitledFallback: Story = {
  name: 'ReleasePreviewCard - untitled fallback',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          "None of the canonical release fixtures ship an empty title, so this is `releaseFixtures.scheduled` with only `metadata.title` overridden to `''` - a targeted override of one cosmetic field, not a hand-rolled release. `ReleaseTitle`'s fallback (`t('release.placeholder-untitled-release')`, 'Untitled release') takes over.",
      },
    },
  },
  render: () => (
    <Card style={{maxWidth: 360}}>
      <ReleasePreviewCard
        release={{
          ...releaseFixtures.scheduled,
          metadata: {...releaseFixtures.scheduled.metadata, title: ''},
        }}
      />
    </Card>
  ),
}

/* ────────────────────────────────────────────────────────────────────────
   Chip - a thin `forwardRef` wrapper around Button-shaped props with no
   branches of its own (no `if`, no ternary). One story showing the range of
   props it forwards, matching the exact combination `VersionChip` passes it
   in production (icon avatar + iconRight lock, `selected`, `tone`, mode). */

export const ChipVariants: Story = {
  name: 'Chip - variants',
  parameters: {
    docs: {
      description: {
        component: [
          'Chip has no logic of its own: every prop it receives is forwarded straight to the ' +
            'underlying `@sanity/ui` `Button`, and its only job is the rounded, bordered shell ' +
            '`VersionChip` builds a version indicator from.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/Chip.tsx` |',
          '| Tier | SERVICE. A shared visual primitive for the release/version chips, not itself release-aware |',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Chip text="Spring campaign" icon={ArchiveIcon} tone="caution" />
      <Chip text="Selected version" icon={CopyIcon} selected tone="primary" />
      <Chip text="Cannot remove" icon={TrashIcon} disabled mode="ghost" />
    </Stack>
  ),
}

/* ────────────────────────────────────────────────────────────────────────
   ReleaseActionsResolver - resolves a workspace's configured
   `source.releases.actions()` hooks into `ReleaseActionDescription`s and
   reports them via `onActions`. Its input is the hook-shaped functions
   themselves (what a real workspace config supplies), not a pre-decided
   description - handing it those functions is supplying input, exactly as
   `ReleaseMenuButton` does when it mounts one with real custom actions. */

const notifyStakeholders: ReleaseActionComponent = ({documents}) => ({
  label: 'Notify stakeholders',
  disabled: documents.length === 0,
  title: documents.length === 0 ? 'Nothing to notify about - the release is empty' : undefined,
})
notifyStakeholders.displayName = 'NotifyStakeholders'

const exportManifest: ReleaseActionComponent = ({release}) => ({
  label: `Export manifest for "${release.metadata.title}"`,
})
exportManifest.displayName = 'ExportManifest'

export const ActionsResolverResolved: Story = {
  name: 'ReleaseActionsResolver - resolved custom actions',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        component: [
          "This is the piece that turns a workspace's `source.releases.actions()` config into " +
            'rows `ReleaseMenuButton` appends after its own built-in ones. It uses the same ' +
            'hook-collection pattern document actions use: each configured action is called like ' +
            'a hook, its returned description collected, and the whole set reported once via ' +
            '`onActions`, an effect, not a return value; the component itself renders `null` ' +
            'unless a `children` render prop is supplied.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/ReleaseActionsResolver.tsx` |',
          '| Tier | SERVICE |',
          '',
          'This story supplies `children` to make the otherwise-invisible resolution visible: two ' +
            'fixture actions, one plain and one that disables itself with a reason when the ' +
            'release is empty, both real `ReleaseActionComponent` functions, called with the real ' +
            '`release`/`documents` props.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <ReleaseActionsResolver
      actions={[notifyStakeholders, exportManifest]}
      release={releaseFixtures.asap}
      documents={VALID_DOCS}
      onActions={() => {}}
    >
      {({states}) => (
        <Stack gap={2} style={{maxWidth: 360}}>
          {states.map((state, index) => (
            <Card
              key={index}
              border
              padding={3}
              radius={2}
              tone={state.disabled ? 'transparent' : 'positive'}
            >
              <Text size={1} weight="medium">
                {state.label}
              </Text>
              {state.title && (
                <Text size={1} muted>
                  {state.title}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      )}
    </ReleaseActionsResolver>
  ),
  play: async ({canvasElement}) => {
    await within(canvasElement).findByText('Notify stakeholders')
  },
}

/* ────────────────────────────────────────────────────────────────────────
   ScheduleDatePicker - a datetime field plus a time-zone chip button. Note
   it imports `DateTimeInput` from `core/components/inputs/DateInputs`, the
   presentational sibling of the form-field `DateTimeInput` in
   `core/form/inputs/DateInputs` - it needs no `FormValueProvider`, only the
   time-zone hooks `WithStudioProviders` already satisfies. */

export const DatePickerEmpty: Story = {
  name: 'ScheduleDatePicker - empty',
  decorators: [withReleases],
  render: function DatePickerEmptyStory() {
    const [value, setValue] = useState<Date | undefined>(undefined)
    return (
      <Card style={{maxWidth: 420}} padding={3} border radius={2}>
        <ScheduleDatePicker
          value={value}
          onChange={setValue}
          timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
        />
      </Card>
    )
  },
}

export const DatePickerWithValue: Story = {
  name: 'ScheduleDatePicker - with a value',
  decorators: [withReleases],
  parameters: {
    docs: {
      description: {
        story:
          'A fixed future instant, formatted in the current time zone. The globe button opens the shared time-zone dialog, storied in full under `Scheduling/Time Zone Dialog`.',
      },
    },
  },
  render: function DatePickerWithValueStory() {
    const [value, setValue] = useState<Date | undefined>(new Date('2027-03-15T10:30:00.000Z'))
    return (
      <Card style={{maxWidth: 420}} padding={3} border radius={2}>
        <ScheduleDatePicker
          value={value}
          onChange={setValue}
          timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
        />
      </Card>
    )
  },
}

/* ────────────────────────────────────────────────────────────────────────
   ReleaseDocumentPreview - the clickable row for one document inside a
   release. One return in the component's own body (lines 93-102): a `Card`
   wrapping `SanityDefaultPreview`, always the same shape - every difference
   below comes from what feeds it, not from a branch in this file.
   `getReleaseDocumentIntent` branches on `releaseState`/`isCardinalityOneRelease`
   to build the intent's href params, but that only changes where the link
   points - not what it looks like - so those states are named in prose, not
   restoried here. Worth noting separately: `hasValidationError` is declared
   on `ReleaseDocumentPreviewProps` but never destructured or read in the
   component body - a prop with no effect. */

export const DocumentPreviewVersion: Story = {
  name: 'ReleaseDocumentPreview - the version in the release',
  decorators: [withDocumentPreview],
  parameters: {
    docs: {
      description: {
        component: [
          'Loading and resolved to nothing are not the same signal, but this component renders ' +
            'them close to identical, and the title is the only thing on the row that tells two ' +
            'different documents apart at all.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/components/ReleaseDocumentPreview.tsx` |',
          '| Tier | SERVICE |',
          '| Audit | 🟡 needs-work. Matches the pattern ledger findings 136-138 (loading/empty) and 106 ("Untitled" covering unrelated situations) found elsewhere, confirmed here in a third subsystem |',
          '',
          'This is the clickable row for one document inside a release: an avatar/title/subtitle ' +
            'preview wrapped in an `IntentLink`, wired to the real `useDocumentPreviewValues` ' +
            'against the seeded preview store.',
          '',
          'The loading flag is the only thing that gates the skeleton, and it turns false the ' +
            'moment the store emits anything at all, including an empty snapshot for a document ' +
            'that no longer exists. The resolved value is never actually null in practice, it ' +
            'always returns the four-field object, just with every field undefined when nothing ' +
            'resolved, so an all-undefined object gets spread into the preview with the loading ' +
            'flag false. Downstream, the title default cannot tell "this document was deleted out ' +
            'from under the release" from "a real document nobody named yet", both skip the ' +
            'skeleton and land on the same word. `DocumentPreviewResolvedToNothing` and ' +
            '`DocumentPreviewTwoUntitledLookAlike` below are the two shapes of that same collapse.',
          '',
          'The preview receives exactly title, subtitle, media and description plus ' +
            'presence/placeholder flags, no document id, no revision, nothing type-specific ' +
            'beyond a shared fallback icon. For a document type whose only field is a title (as ' +
            'most are), two different documents that share a title, or that are both untitled, ' +
            'are pixel-identical here. `DocumentPreviewTwoUntitledLookAlike` puts two distinct ' +
            'fixture documents side by side to show it.',
          '',
          '> **Why it matters:** a deleted document and an unnamed one render the same row, with ' +
            'no error, no placeholder shimmer, nothing marking them apart. An editor scanning a ' +
            'release cannot tell "this is gone" from "nobody named this yet" without clicking into ' +
            'every row that looks blank.',
        ].join('\n'),
        story:
          'The default: `documentId` is the version identity (`versions.rASAP.article-launch`), and `perspectiveStack` includes the release, so the preview resolves the release copy of the title.',
      },
    },
  },
  render: () => (
    <Card style={{maxWidth: 360}} border radius={2}>
      <ReleaseDocumentPreview
        documentId="versions.rASAP.article-launch"
        documentTypeName="article"
        releaseId={releaseFixtures.asap._id}
        releaseState={releaseFixtures.asap.state}
      />
    </Card>
  ),
}

export const DocumentPreviewGoingToBePublished: Story = {
  name: 'ReleaseDocumentPreview - going to be published',
  decorators: [withDocumentPreview],
  parameters: {
    docs: {
      description: {
        story:
          "Same version id, `isGoingToBePublished`. The preview now resolves `getPublishedId(documentId)` with an empty `perspectiveStack` - the published copy of the title, not the version's - because this row is standing in for what publishing the release would replace it with.",
      },
    },
  },
  render: () => (
    <Card style={{maxWidth: 360}} border radius={2}>
      <ReleaseDocumentPreview
        documentId="versions.rASAP.article-launch"
        documentTypeName="article"
        releaseId={releaseFixtures.asap._id}
        releaseState={releaseFixtures.asap.state}
        isGoingToBePublished
      />
    </Card>
  ),
}

export const DocumentPreviewResolvedToNothing: Story = {
  name: 'ReleaseDocumentPreview - resolved to nothing (not loading)',
  decorators: [withDocumentPreview],
  parameters: {
    docs: {
      description: {
        story:
          '`article-deleted` is never added to the preview store, so the mock resolves it the way a genuinely missing document resolves: synchronously, to nothing (`observePaths` returns `null` for an unknown id - see `lib/mockDocumentPreviewStore.ts`). `previewLoading` settles to `false` immediately, so this is NOT the loading skeleton - it is the steady-state render of a row whose document is gone, and it reads exactly like `DocumentPreviewTwoUntitledLookAlike` below: a title-less card with no error, no placeholder shimmer, nothing marking it apart from a document that was simply never named.',
      },
    },
  },
  render: () => (
    <Card style={{maxWidth: 360}} border radius={2}>
      <ReleaseDocumentPreview
        documentId="versions.rASAP.article-deleted"
        documentTypeName="article"
        releaseId={releaseFixtures.asap._id}
        releaseState={releaseFixtures.asap.state}
      />
    </Card>
  ),
}

export const DocumentPreviewTwoUntitledLookAlike: Story = {
  name: 'ReleaseDocumentPreview - two different, both untitled',
  decorators: [withDocumentPreview],
  parameters: {
    docs: {
      description: {
        story:
          'Two real, different documents in the same release (`article-alpha`, `article-beta`) - neither has ever had a `title` field set. Both fall through `TemplatePreview`\'s `title = "Untitled"` default identically. Nothing else in the row (id, revision, an icon) surfaces to tell them apart; an editor scanning this release sees two identical rows and has to click into each one to find out they are different documents.',
      },
    },
  },
  render: () => (
    <Stack gap={2}>
      <Card style={{maxWidth: 360}} border radius={2}>
        <ReleaseDocumentPreview
          documentId="versions.rASAP.article-alpha"
          documentTypeName="article"
          releaseId={releaseFixtures.asap._id}
          releaseState={releaseFixtures.asap.state}
        />
      </Card>
      <Card style={{maxWidth: 360}} border radius={2}>
        <ReleaseDocumentPreview
          documentId="versions.rASAP.article-beta"
          documentTypeName="article"
          releaseId={releaseFixtures.asap._id}
          releaseState={releaseFixtures.asap.state}
        />
      </Card>
    </Stack>
  ),
}

/* ────────────────────────────────────────────────────────────────────────
   ReleasesTool - not mounted here, on purpose. */

export const ReleasesToolNote: Story = {
  name: 'ReleasesTool - a note, not a mount',
  render: () => (
    <Card border padding={4} radius={2} tone="transparent" style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Text size={1} weight="medium">
          packages/sanity/src/core/releases/tool/ReleasesTool.tsx
        </Text>
        <Text size={1} muted>
          The whole component is a two-branch router dispatcher:
        </Text>
        <Card padding={3} radius={2} tone="transparent" style={{fontFamily: 'monospace'}}>
          <Stack gap={2}>
            <Text size={1}>const {'{releaseId}'} = router.state</Text>
            <Text size={1}>{'if (releaseId) return <ReleaseDetail key={releaseId} />'}</Text>
            <Text size={1}>return {'<ReleasesOverview />'}</Text>
          </Stack>
        </Card>
        <Text size={1} muted>
          Mounting it here would only ever exercise this branch, and the branches themselves -
          `ReleaseDetail` and `ReleasesOverview` - are each deep surfaces with their own live hooks
          (`useReleaseDocuments`, `useReleasesMetadata`, `useActiveReleases`) storied separately
          elsewhere in this catalog (see `Releases/Overview Parts`). A story here would either
          duplicate that coverage or fake the router state without a real harness behind either
          branch, so this page states the dispatch instead of forcing it.
        </Text>
      </Stack>
    </Card>
  ),
}
