import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {Card, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CanonicalReleaseContextMenu} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/CanonicalReleaseContextMenu'
import {CopyToDraftsMenuItem} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/CopyToDraftsMenuItem'
import {CopyToReleaseMenuGroup} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/CopyToReleaseMenuGroup'
import {ScheduledDraftContextMenu} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/ScheduledDraftContextMenu'
import {VersionContextMenu} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/VersionContextMenu'
import {VersionContextMenuDialogs} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/VersionContextMenuDialogs'
import {VersionContextMenuPopover} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/VersionContextMenuPopover'
import {useVersionContextMenu} from '../../../../packages/sanity/src/core/releases/hooks/useVersionContextMenu'
import {LATEST} from '../../../../packages/sanity/src/core/releases/util/const'
import {useScheduledDraftMenuActions} from '../../../../packages/sanity/src/core/singleDocRelease/hooks/useScheduledDraftMenuActions'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {allReleaseFixtures, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined
const noopAsync = async () => {}

/* ── Fixtures ──────────────────────────────────────────────────────────────
   Three document identities, chosen so `useDocumentVersions` (which every
   drafts/copy state below reads through `useCopyToDrafts`/`useTargetDocumentState`)
   answers something real instead of an empty fixture universe:
   - `article-launch` + its draft: a document WITH an existing draft, so
     `hasDraftVersion` is genuinely true.
   - `article-pricing`, published only: no draft exists, so `hasDraftVersion`
     is genuinely false rather than asserted.
   - `versions.rAsap.article-launch`: the version-in-a-release identity the
     "copy to release" and "discard" stories act on. */
const articleDocuments: SanityDocument[] = [
  {
    _id: 'article-launch',
    _type: 'article',
    _rev: 'rev-launch-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-01T09:00:00Z',
    title: 'Autumn campaign launch',
  },
  {
    _id: 'drafts.article-launch',
    _type: 'article',
    _rev: 'rev-launch-draft-2',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-07-10T14:00:00Z',
    title: 'Autumn campaign launch (edited)',
  },
  {
    _id: 'versions.rAsap.article-launch',
    _type: 'article',
    _rev: 'rev-launch-version-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-20T09:00:00Z',
    title: 'Autumn campaign launch (hotfix launch copy)',
  },
  {
    _id: 'article-pricing',
    _type: 'article',
    _rev: 'rev-pricing-1',
    _createdAt: '2026-05-01T09:00:00Z',
    _updatedAt: '2026-05-01T09:00:00Z',
    title: 'Pricing page',
  },
]

const previewStore = createMockPreviewUniverse({documents: articleDocuments}).store

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
]

/**
 * `activeCardinalityOneRelease` (`releaseFixtures.scheduledDraft`) already satisfies
 * `isPausedCardinalityOneRelease` (active + scheduled + cardinality:'one' + a set
 * `intendedPublishAt`) - that IS the paused state. This is the same release before it
 * paused: cardinality:'one' and scheduled, but with no `intendedPublishAt` decided yet,
 * so the condition's last clause is false and `ScheduledDraftContextMenu` still offers
 * "Edit schedule".
 */
const unpausedScheduledDraft: ReleaseDocument = {
  ...releaseFixtures.scheduledDraft,
  _id: '_.releases.rCardinalityOneUnpaused',
  name: 'rCardinalityOneUnpaused',
  metadata: {
    ...releaseFixtures.scheduledDraft.metadata,
    title: 'Scheduled draft (not yet paused)',
    intendedPublishAt: undefined,
  },
}

const copyToReleaseOptions = allReleaseFixtures.filter(
  (release) => release._id !== releaseFixtures.scheduledLocked._id,
)

/** For `MenuItem`/`MenuGroup`-level components, which need a real `<Menu>` ancestor or
 * `useMenu()` throws. */
function MenuFrame({children, note}: {children: React.ReactNode; note?: string}) {
  return (
    <Stack gap={3}>
      {note && (
        <Text size={1} muted>
          {note}
        </Text>
      )}
      <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 320}}>
        <Menu>{children}</Menu>
      </Card>
    </Stack>
  )
}

/** For the whole-menu components (`CanonicalReleaseContextMenu`, `ScheduledDraftContextMenu`,
 * `VersionContextMenu`), which already return their OWN `<Menu>` root - wrapping those in
 * another `<Menu>` would nest two menu contexts for no reason. */
function CardFrame({children, note}: {children: React.ReactNode; note?: string}) {
  return (
    <Stack gap={3}>
      {note && (
        <Text size={1} muted>
          {note}
        </Text>
      )}
      <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 320}}>
        {children}
      </Card>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Releases/Release Document Menus',
  decorators: [
    WithStudioProviders({
      config: {
        schema: {name: 'mock', types: schemaTypes},
        document: {drafts: {enabled: true}},
      },
      previewStore,
      releases: [...allReleaseFixtures, unpausedScheduledDraft],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Hidden and disabled are two different vocabularies for the same idea, whether an ' +
            "action is currently reachable, and this family's two context menus mostly line up " +
            'the choice with whether an explanation is possible. Mostly.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/documentHeader/contextMenu/` (the menu family), `.../documentHeader/dialog/` (`CopyToDraftsDialog`, `CopyToNewReleaseDialog`) and `.../dialog/DiscardVersionDialog.tsx` (shared with the release detail table) |',
          '| Tier | SERVICE |',
          '| Audit | 🟡 needs-work (`menu-item`, `confirmation-dialog`). A release-locked, permission-fine Discard row disables with no tooltip at all, the one state in this family that disables without saying why. See `CanonicalDiscardLockedNoExplanation` below |',
          '| Patterns | `menu-item` · `confirmation-dialog` |',
          '',
          "The right-click menu on a document's version chip, the one place an editor acts on a " +
            'specific draft, published document, or release version (view the release, copy it ' +
            'elsewhere, discard it), plus the three dialogs that confirm what the menu starts.',
          '',
          '`VersionContextMenu` is a pure router: it renders `ScheduledDraftContextMenu` when the ' +
            'chip names a scheduled draft (a cardinality-`one` release) and ' +
            '`CanonicalReleaseContextMenu` for every other perspective (draft, published, or an ' +
            'ordinary release version). Both compose the same `CopyToReleaseMenuGroup`, which in ' +
            'turn nests `CopyToDraftsMenuItem` and a row per release via `VersionContextMenuItem` ' +
            '(storied separately, see `Releases/Version Chips`). `VersionContextMenuDialogs` ' +
            'renders whichever of the three confirmation dialogs the menu opened, keyed by one ' +
            '`dialogState` string.',
          '',
          '`CanonicalReleaseContextMenu` hides the whole "copy to release" group when neither ' +
            'releases nor copy-to-drafts apply, and hides Discard entirely on a published ' +
            'document or when the caller sets `isDiscardable={false}`; both are permanent, ' +
            'structural facts about the perspective, not transient permission checks, so there is ' +
            'nothing to explain and hiding is honest. The same Discard item, when the ' +
            'copy-to-release/discard-permission group is otherwise showable, goes ' +
            'disabled-with-tooltip for a permissions gap, it says why on hover, the way ' +
            'CreateReleaseMenuItem always does for its own two disabled states. `locked` is the ' +
            'odd one out: it folds into the same disabled flag the permission check uses, but the ' +
            "tooltip's own suppression reads only the permission flag, so a release-locked, " +
            'permission-fine Discard row is disabled with no tooltip at all. ' +
            "`ScheduledDraftContextMenu`'s three actions go further: their disabled prop is typed " +
            "straight off the house MenuItem's plain DOM disabled, and the hook never attaches " +
            'tooltip props either, so a busy scheduled-draft action cannot explain itself even if ' +
            'a future change wanted it to.',
          '',
          'All three confirmation dialogs name the consequence rather than asking a bare ' +
            'question. `DiscardVersionDialog` states it is permanent ("cannot be undone") and ' +
            'names the release; `CopyToDraftsDialog` (title "Draft version already exists") ' +
            'spells out that confirming overrides that existing draft, and its confirm button ' +
            'reads "Yes, override Draft" rather than a generic "Confirm". None of the three ' +
            'reproduces the ledger-113 shape (a confirmation that shows only a count).',
          '',
          '`CanonicalReleaseContextMenu`/`ScheduledDraftContextMenu` each call ' +
            '`useHasCopyToDraftOption` once to decide whether to mount ' +
            "`CopyToReleaseMenuGroup`'s drafts row at all, and pass the answer down. " +
            '`CopyToDraftsMenuItem` then calls the same hook again itself, purely to decide ' +
            'whether to return `null`. The second call always agrees with the first, so it is ' +
            'redundant rather than dead: it runs on every render, it just can never disagree with ' +
            'the answer its own parent already had.',
          '',
          '> **Why it matters:** `CopyToDraftsMenuItem` branches on whether a draft already exists ' +
            'to decide whether to confirm first or copy immediately, but the query that answers ' +
            'that question starts unresolved and reads as "no draft" while it loads. A click ' +
            'landing before the query settles takes the immediate, no-confirmation path even when ' +
            "a draft genuinely exists. Contrast `CanonicalReleaseContextMenu`'s own permission " +
            'checks, which default to a disabled control while unresolved rather than to the more ' +
            'permissive branch: this is the one action in the family that resolves its own race ' +
            'the wrong way.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:menu-item',
    'pattern:confirmation-dialog',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/* ── CanonicalReleaseContextMenu ───────────────────────────────────────── */

export const CanonicalFull: Story = {
  name: 'CanonicalReleaseContextMenu - version in a release',
  parameters: {
    docs: {
      description: {
        story:
          'A version inside "Hotfix launch": view-release link, the copy-to-release group (with a copy-to-drafts row, since drafts are enabled for this workspace), and an enabled Discard.',
      },
    },
  },
  render: () => (
    <CardFrame>
      <CanonicalReleaseContextMenu
        bundleId="rAsap"
        release={releaseFixtures.asap}
        onDiscard={noop}
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        hasCreatePermission
        hasDiscardPermission
        isPublished={false}
        documentType="article"
        releases={copyToReleaseOptions}
        releasesLoading={false}
      />
    </CardFrame>
  ),
}

export const CanonicalPublishedHidesDiscard: Story = {
  name: 'CanonicalReleaseContextMenu - published (Discard hidden)',
  parameters: {
    docs: {
      description: {
        story:
          'The published chip reuses this same menu. `isPublished` gates the whole `!isPublished && isDiscardable` block, so there is no Discard row here at all - not disabled, absent - because publishing is undone through Unpublish, not this menu.',
      },
    },
  },
  render: () => (
    <CardFrame>
      <CanonicalReleaseContextMenu
        bundleId="published"
        onDiscard={noop}
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        hasCreatePermission
        hasDiscardPermission
        isPublished
        documentType="article"
        releases={copyToReleaseOptions}
        releasesLoading={false}
      />
    </CardFrame>
  ),
}

export const CanonicalNotDiscardable: Story = {
  name: 'CanonicalReleaseContextMenu - isDiscardable=false',
  parameters: {
    docs: {
      description: {
        story:
          'Not published this time - a draft, with permission to discard it - but the caller passed `isDiscardable={false}`. Same absence as the published case, different reason: this is a caller-level policy, not a fact about the perspective.',
      },
    },
  },
  render: () => (
    <CardFrame>
      <CanonicalReleaseContextMenu
        bundleId="draft"
        onDiscard={noop}
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        hasCreatePermission
        hasDiscardPermission
        isPublished={false}
        isDiscardable={false}
        documentType="article"
        releases={copyToReleaseOptions}
        releasesLoading={false}
      />
    </CardFrame>
  ),
}

export const CanonicalDiscardDeniedWithTooltip: Story = {
  name: 'CanonicalReleaseContextMenu - Discard disabled, explained',
  parameters: {
    docs: {
      description: {
        story:
          'No discard permission. The row stays visible, disabled, tone `critical`, and its `tooltipProps` explains why on hover - the same pattern `CreateReleaseMenuItem` uses for its own two disabled states.',
      },
    },
  },
  render: () => (
    <CardFrame>
      <CanonicalReleaseContextMenu
        bundleId="rAsap"
        release={releaseFixtures.asap}
        onDiscard={noop}
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        hasCreatePermission
        hasDiscardPermission={false}
        isPublished={false}
        documentType="article"
        releases={copyToReleaseOptions}
        releasesLoading={false}
      />
    </CardFrame>
  ),
}

export const CanonicalDiscardLockedNoExplanation: Story = {
  name: 'CanonicalReleaseContextMenu - Discard disabled, unexplained (finding)',
  parameters: {
    docs: {
      description: {
        story:
          'The finding: `locked` and permission both fold into the same `disabled` expression, but the tooltip only reads `hasDiscardPermission`. Here permission is granted and only `locked` is true, so Discard renders disabled with the tooltip suppressed, hover it and nothing explains why a permitted action will not run.',
      },
    },
  },
  render: () => (
    <CardFrame>
      <CanonicalReleaseContextMenu
        bundleId="rScheduled"
        release={releaseFixtures.scheduledLocked}
        onDiscard={noop}
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        locked
        hasCreatePermission
        hasDiscardPermission
        isPublished={false}
        documentType="article"
        releases={copyToReleaseOptions}
        releasesLoading={false}
      />
    </CardFrame>
  ),
}

/* ── ScheduledDraftContextMenu ─────────────────────────────────────────── */

export const ScheduledDraftActive: Story = {
  name: 'ScheduledDraftContextMenu - not yet paused',
  parameters: {
    docs: {
      description: {
        story:
          'Publish now, Edit schedule, a link to view all scheduled drafts, the copy-to-release group, then Delete schedule. None of these three actions can attach a disabled reason even when busy - see the component doc for why.',
      },
    },
  },
  render: function ScheduledDraftActiveStory() {
    const scheduledDraftMenuActions = useScheduledDraftMenuActions({
      release: unpausedScheduledDraft,
      documentType: 'article',
      documentId: 'article-launch',
    })
    return (
      <CardFrame>
        <ScheduledDraftContextMenu
          releases={copyToReleaseOptions}
          bundleId="rCardinalityOneUnpaused"
          release={unpausedScheduledDraft}
          onCreateRelease={noop}
          onCopyToDrafts={noopAsync}
          onCreateVersion={noop}
          hasCreatePermission
          scheduledDraftMenuActions={scheduledDraftMenuActions}
          documentType="article"
        />
      </CardFrame>
    )
  },
}

export const ScheduledDraftPaused: Story = {
  name: 'ScheduledDraftContextMenu - paused (Edit schedule hidden)',
  parameters: {
    docs: {
      description: {
        story:
          '`releaseFixtures.scheduledDraft` (active + scheduled + cardinality `one` + a set `intendedPublishAt`) satisfies `isPausedCardinalityOneRelease`. "Edit schedule" is HIDDEN, not disabled - a paused scheduled draft has nothing left to reschedule from this menu.',
      },
    },
  },
  render: function ScheduledDraftPausedStory() {
    const scheduledDraftMenuActions = useScheduledDraftMenuActions({
      release: releaseFixtures.scheduledDraft,
      documentType: 'article',
      documentId: 'article-launch',
    })
    return (
      <CardFrame>
        <ScheduledDraftContextMenu
          releases={copyToReleaseOptions}
          bundleId="rCardinalityOne"
          release={releaseFixtures.scheduledDraft}
          onCreateRelease={noop}
          onCopyToDrafts={noopAsync}
          onCreateVersion={noop}
          hasCreatePermission
          scheduledDraftMenuActions={scheduledDraftMenuActions}
          documentType="article"
        />
      </CardFrame>
    )
  },
}

/* ── CopyToReleaseMenuGroup ────────────────────────────────────────────── */

export const CopyToReleaseGroupOpen: Story = {
  name: 'CopyToReleaseMenuGroup - populated',
  parameters: {
    docs: {
      description: {
        story:
          'The submenu on its own: a copy-to-drafts row, one row per available release (via `VersionContextMenuItem`), a divider, then "Create release". Locked releases are filtered out before this component ever sees them - by its caller, not by this component.',
      },
    },
  },
  render: () => (
    <MenuFrame>
      <CopyToReleaseMenuGroup
        releases={copyToReleaseOptions}
        bundleId="draft"
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        disabled={false}
        hasCreatePermission
        hasCopyToDraftOption
        isReleasesEnabled
        documentType="article"
      />
    </MenuFrame>
  ),
}

export const CopyToReleaseGroupDenied: Story = {
  name: 'CopyToReleaseMenuGroup - no create permission',
  parameters: {
    docs: {
      description: {
        story:
          'No permission to create a release. The GROUP itself is disabled with a tooltip explaining why - this is the "copy to release" analog of the Discard tooltip above, and it does not have the locked-menu\'s gap: there is only one reason this can be disabled, so there is only one thing to say.',
      },
    },
  },
  render: () => (
    <MenuFrame>
      <CopyToReleaseMenuGroup
        releases={copyToReleaseOptions}
        bundleId="draft"
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        disabled
        hasCreatePermission={false}
        hasCopyToDraftOption
        isReleasesEnabled
        documentType="article"
      />
    </MenuFrame>
  ),
}

/* ── CopyToDraftsMenuItem ──────────────────────────────────────────────── */

export const CopyToDraftsWithExistingDraft: Story = {
  name: 'CopyToDraftsMenuItem - existing draft (confirms first)',
  parameters: {
    docs: {
      description: {
        story:
          '`drafts.article-launch` exists in the fixture universe, so `useCopyToDrafts` resolves `hasDraftVersion: true` for real - not asserted. Clicking this row opens the confirmation dialog (`onClick`) rather than copying immediately, because copying would discard that draft first.',
      },
    },
  },
  render: () => (
    <MenuFrame>
      <CopyToDraftsMenuItem documentType="article" fromRelease="rAsap" onClick={noopAsync} />
    </MenuFrame>
  ),
}

export const CopyToDraftsNoExistingDraft: Story = {
  name: 'CopyToDraftsMenuItem - no existing draft (copies immediately)',
  parameters: {
    docs: {
      description: {
        story:
          '`article-pricing` has no draft in the fixture universe, so `hasDraftVersion` resolves `false` for real. Clicking this row skips the confirmation dialog entirely and calls `handleCopyToDrafts()` directly - see the component doc for the race this creates while the version query is still loading.',
      },
    },
  },
  render: () => (
    <MenuFrame>
      <CopyToDraftsMenuItem documentType="article" fromRelease="rAsap" onClick={noopAsync} />
    </MenuFrame>
  ),
}

export const CopyToDraftsHiddenFromDraftPerspective: Story = {
  name: 'CopyToDraftsMenuItem - hidden (fromRelease="draft")',
  parameters: {
    docs: {
      description: {
        story:
          "`useHasCopyToDraftOption` refuses the draft and published perspectives outright - copying a draft to itself is not a menu item. The component returns `null`: the gap between the two markers below is the whole render, same convention as `PaneMenuButtonItem`'s empty-group story.",
      },
    },
  },
  render: () => (
    <MenuFrame note='fromRelease="draft" - the row between the markers renders nothing.'>
      <Card padding={2} tone="transparent">
        <Text size={1} muted>
          before
        </Text>
      </Card>
      <CopyToDraftsMenuItem documentType="article" fromRelease="draft" onClick={noopAsync} />
      <Card padding={2} tone="transparent">
        <Text size={1} muted>
          after
        </Text>
      </Card>
    </MenuFrame>
  ),
}

/* ── VersionContextMenu (the router) ──────────────────────────────────── */

export const RouterResolvesCanonical: Story = {
  name: 'VersionContextMenu - resolves to CanonicalReleaseContextMenu',
  parameters: {
    docs: {
      description: {
        story:
          'Rendered with no `isScheduledDraft`, so the router falls through to `CanonicalReleaseContextMenu`. `hasCreatePermission`/`hasDiscardPermission` are computed internally here (`checkWithPermissionGuard`, `useDocumentPairPermissions`) against the seeded mock stores, rather than passed in by hand - both start `null`/`false` and resolve to the seeded `true` a tick after mount, same as a real studio.',
      },
    },
  },
  render: () => (
    <CardFrame>
      <VersionContextMenu
        documentGroupId="article-launch"
        versionId="versions.rAsap.article-launch"
        releases={copyToReleaseOptions}
        releasesLoading={false}
        fromRelease="rAsap"
        onDiscard={noop}
        onCreateRelease={noop}
        onCopyToDrafts={noopAsync}
        onCreateVersion={noop}
        type="article"
        release={releaseFixtures.asap}
      />
    </CardFrame>
  ),
}

export const RouterResolvesScheduledDraft: Story = {
  name: 'VersionContextMenu - resolves to ScheduledDraftContextMenu',
  parameters: {
    docs: {
      description: {
        story:
          'Same component, `isScheduledDraft` this time and a real `scheduledDraftMenuActions` built by calling `useScheduledDraftMenuActions` (exactly what `useVersionContextMenu` does internally) - the router switches to `ScheduledDraftContextMenu`.',
      },
    },
  },
  render: function RouterResolvesScheduledDraftStory() {
    const scheduledDraftMenuActions = useScheduledDraftMenuActions({
      release: unpausedScheduledDraft,
      documentType: 'article',
      documentId: 'article-launch',
    })
    return (
      <CardFrame>
        <VersionContextMenu
          documentGroupId="article-launch"
          versionId="versions.rCardinalityOneUnpaused.article-launch"
          releases={copyToReleaseOptions}
          releasesLoading={false}
          fromRelease="rCardinalityOneUnpaused"
          onDiscard={noop}
          onCreateRelease={noop}
          onCopyToDrafts={noopAsync}
          onCreateVersion={noop}
          type="article"
          release={unpausedScheduledDraft}
          isScheduledDraft
          scheduledDraftMenuActions={scheduledDraftMenuActions}
        />
      </CardFrame>
    )
  },
}

/* ── VersionContextMenuPopover (right-click, for real) ────────────────── */

function PopoverDemo() {
  const {
    contextMenu,
    handleContextMenu,
    popoverRef,
    referenceElement,
    setReferenceElement,
    dialogState,
    closeDialog,
    openDiscardDialog,
    openCreateReleaseDialog,
    handleCopyToDrafts,
    handleAddVersion,
    isScheduledDraft,
    scheduledDraftMenuActions,
    sourceReleasePerspective,
  } = useVersionContextMenu({
    documentGroupId: 'article-launch',
    versionId: 'versions.rAsap.article-launch',
    documentType: 'article',
  })

  return (
    <Stack gap={3}>
      <Text size={1} muted>
        Right-click the card. This is the actual `useVersionContextMenu` +{' '}
        `VersionContextMenuPopover` + `VersionContextMenuDialogs` composition `VersionChip` uses -
        the chip itself only adds the trigger button and left-click selection on top.
      </Text>
      <button
        type="button"
        aria-label="Autumn campaign launch - right-click for version actions"
        ref={setReferenceElement}
        onContextMenu={handleContextMenu}
        style={{width: 220, padding: 0, border: 0, background: 'none', cursor: 'context-menu'}}
      >
        <Card padding={3} radius={2} border tone="suggest">
          <Text size={1} weight="medium">
            Autumn campaign launch
          </Text>
        </Card>
      </button>
      <VersionContextMenuPopover
        contextMenu={contextMenu}
        popoverRef={popoverRef}
        referenceElement={referenceElement}
        documentGroupId="article-launch"
        versionId="versions.rAsap.article-launch"
        documentType="article"
        bundleId="rAsap"
        releases={copyToReleaseOptions}
        releasesLoading={false}
        onDiscard={openDiscardDialog}
        onCreateRelease={openCreateReleaseDialog}
        onCopyToDrafts={handleCopyToDrafts}
        onCreateVersion={handleAddVersion}
        release={releaseFixtures.asap}
        isScheduledDraft={isScheduledDraft}
        scheduledDraftMenuActions={scheduledDraftMenuActions}
      />
      <VersionContextMenuDialogs
        dialogState={dialogState}
        onClose={closeDialog}
        versionId="versions.rAsap.article-launch"
        documentType="article"
        title="Autumn campaign launch"
        sourceReleasePerspective={sourceReleasePerspective}
        onCreateVersion={handleAddVersion}
        onCopyToDrafts={handleCopyToDrafts}
        scheduledDraftDialogs={isScheduledDraft && scheduledDraftMenuActions.dialogs}
      />
    </Stack>
  )
}

export const PopoverRightClickToOpen: Story = {
  name: 'VersionContextMenuPopover - right-click, live',
  parameters: {
    docs: {
      description: {
        story:
          'The `translate` offset (`useVersionContextMenu`) positions the popover at the click point rather than anchored to a corner of the trigger, so it opens where you actually clicked inside the card - try right-clicking a different spot.',
      },
    },
  },
  render: () => <PopoverDemo />,
}

/* ── VersionContextMenuDialogs (the three confirmations) ──────────────── */

export const DialogDiscardVersion: Story = {
  name: 'VersionContextMenuDialogs - discard-version (DiscardVersionDialog)',
  parameters: {
    docs: {
      description: {
        story:
          'The version at `versions.rAsap.article-launch` is real in the fixture universe, so the preview inside resolves for real. Confirm stays disabled until `useTargetDocumentState` reports `ready` - the one place in this family that correctly withholds the destructive action until its own dependency has resolved (contrast the Copy-to-drafts finding above).',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <VersionContextMenuDialogs
        dialogState="discard-version"
        onClose={noop}
        versionId="versions.rAsap.article-launch"
        documentType="article"
        title={releaseFixtures.asap.metadata.title}
        sourceReleasePerspective={releaseFixtures.asap}
        onCreateVersion={noop}
        onCopyToDrafts={noopAsync}
      />
    ),
}

export const DialogCreateRelease: Story = {
  name: 'VersionContextMenuDialogs - create-release (CopyToNewReleaseDialog)',
  parameters: {
    docs: {
      description: {
        story:
          'Copying the draft into a brand-new release: the release form plus a preview of the source document, keyed by the "add to new release" confirm button (disabled while the form is invalid or its date has drifted into the past).',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <VersionContextMenuDialogs
        dialogState="create-release"
        onClose={noop}
        versionId="drafts.article-launch"
        documentType="article"
        title="Draft"
        sourceReleasePerspective={LATEST}
        onCreateVersion={noop}
        onCopyToDrafts={noopAsync}
      />
    ),
}

export const DialogCopyToDrafts: Story = {
  name: 'VersionContextMenuDialogs - copy-to-drafts (CopyToDraftsDialog)',
  parameters: {
    docs: {
      description: {
        story:
          'This is the confirmation `CopyToDraftsMenuItem` opens when a draft already exists (see the "existing draft" story above). Title "Draft version already exists", a description that says the existing draft will be overridden, and a confirm button reading "Yes, override Draft" rather than a bare "Confirm" - it names the consequence, not just the question.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <VersionContextMenuDialogs
        dialogState="copy-to-drafts"
        onClose={noop}
        versionId="versions.rAsap.article-launch"
        documentType="article"
        title={releaseFixtures.asap.metadata.title}
        sourceReleasePerspective={releaseFixtures.asap}
        onCreateVersion={noop}
        onCopyToDrafts={noopAsync}
      />
    ),
}
