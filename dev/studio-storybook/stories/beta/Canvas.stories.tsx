import {type SanityDocument} from '@sanity/client'
import {Box, useRootTheme} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo} from 'react'
import {AppIdCacheContext, UserColorManagerContext} from 'sanity/_singletons'

import {LinkToCanvasDialog} from '../../../../packages/sanity/src/core/canvas/actions/LinkToCanvas/LinkToCanvasDialog'
import {LinkToCanvasDiff} from '../../../../packages/sanity/src/core/canvas/actions/LinkToCanvas/LinkToCanvasDiff'
import {type AppIdCache} from '../../../../packages/sanity/src/core/store/studio-app/appIdCache'
import {ActiveWorkspaceMatcherProvider} from '../../../../packages/sanity/src/core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {type RouterHistory} from '../../../../packages/sanity/src/core/studio/router/types'
import {useWorkspace} from '../../../../packages/sanity/src/core/studio/workspace'
import {type WorkspacesContextValue} from '../../../../packages/sanity/src/core/studio/workspaces/WorkspacesContext'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'
import {WithStudioProviders} from '../../lib/testProvider'

const schemaTypes = [
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'subtitle', title: 'Subtitle', type: 'string'},
      {name: 'year', title: 'Year', type: 'number'},
    ],
    preview: {select: {title: 'title', subtitle: 'year'}},
  },
]

const studioConfig = {
  schema: {name: 'mock', types: schemaTypes},
  // The flag under story: OFF by default. Storybook mounts the gated dialog directly.
  apps: {canvas: {enabled: true}},
}

// The document as it stands in the Studio (published) vs. the Canvas-mapped version the
// preflight would return. `getDocumentVariantType` reads the id: the published id shows
// the "Published" chip, the `drafts.` id the "Draft" chip (with the Canvas sparkle).
const originalDocument: SanityDocument = {
  _id: 'book-launch',
  _type: 'book',
  _rev: 'rev-launch-published-1',
  _createdAt: '2026-06-01T09:00:00Z',
  _updatedAt: '2026-06-01T09:00:00Z',
  title: 'Q4 launch announcement',
  subtitle: 'Everything shipping this quarter',
  year: 2026,
}

const mappedDocument: SanityDocument = {
  _id: 'drafts.book-launch',
  _type: 'book',
  _rev: 'rev-launch-canvas-1',
  _createdAt: '2026-06-01T09:00:00Z',
  _updatedAt: '2026-07-22T11:00:00Z',
  title: 'Q4 launch announcement, Canvas edit',
  subtitle: 'Everything shipping this quarter, reworked in Canvas',
  year: 2027,
}

// `useLinkToCanvas` resolves the current origin's Studio appId through the AppId cache
// (`useAppIdCache`, which THROWS without a provider). Seeding the context with a stub
// cache both satisfies that requirement and makes the dialog's early-return states
// deterministic offline — no network, no Canvas backend.
const resolvedAppCache: AppIdCache = {
  get: async () => ({appId: 'app-storybook', studioApps: []}),
}
const noAppCache: AppIdCache = {
  get: async () => undefined,
}

const noop = () => undefined

// `ChangeList` (rendered inside `LinkToCanvasDiff`) calls `useDocumentOperation`, which
// unconditionally calls `useDocumentOperationWithComlinkHistory` → `useActiveWorkspace()`.
// `WithStudioProviders` deliberately omits `ActiveWorkspaceMatcherProvider` (see the comment
// in lib/testProvider.tsx: it needs a `history` instance and this package doesn't depend on
// the `history` package). Nothing in this render path navigates, so a minimal stub satisfying
// the `RouterHistory` shape (never invoked) is enough — no need for a real history instance.
const stubHistory = {
  location: {pathname: '/', search: '', hash: '', state: null, key: 'stub'},
  listen: () => () => undefined,
  push: () => undefined,
  replace: () => undefined,
} as unknown as RouterHistory

/**
 * Supplies the two contexts the diff body needs but `WithStudioProviders` omits, scoped to just
 * this story:
 * - `ActiveWorkspaceMatcher` (via `useWorkspace()` as the active workspace) - `ChangeList` calls
 *   `useDocumentOperation` which reaches `useActiveWorkspace()`. See the `stubHistory` note above.
 * - `UserColorManager` - the diff attributes changes to authors and reads their colors; without
 *   it `ChangeList` renders its per-field "error rendering" fallback. We seed the CONTEXT value
 *   directly (not `UserColorManagerProvider`, which calls `useColorSchemeValue()` unconditionally
 *   and would then demand the Studio color-scheme context the harness also omits). The manager is
 *   built from the current `@sanity/ui` theme scheme, which is always present here.
 */
function ConfirmChangesDiffBody() {
  const workspace = useWorkspace()
  const {scheme} = useRootTheme()
  const userColorManager = useMemo(() => createUserColorManager({scheme}), [scheme])
  return (
    <UserColorManagerContext.Provider value={userColorManager}>
      <ActiveWorkspaceMatcherProvider
        activeWorkspace={workspace as unknown as WorkspacesContextValue[number]}
        history={stubHistory}
        setActiveWorkspace={noop}
      >
        <Box style={{maxWidth: 480}} padding={3}>
          <LinkToCanvasDiff originalDocument={originalDocument} mappedDocument={mappedDocument} />
        </Box>
      </ActiveWorkspaceMatcherProvider>
    </UserColorManagerContext.Provider>
  )
}

const meta: Meta = {
  title: 'Canvas/Canvas',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    docs: {
      description: {
        component: [
          'Moving a document out of Studio into another app is a trust moment for the author, and ' +
            'this flow earns that trust by never redirecting silently: it runs a preflight, and when ' +
            'the mapping into Canvas would alter content, it shows the diff and asks first.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/canvas/actions/LinkToCanvas/`, Studio-only (no design-system equivalent) |',
          '| Flag | `apps.canvas.enabled`, default off (`AppsOptions.canvas`, `core/config/types.ts`, plus a `fallbackStudioOrigin`). When enabled, the plugin registers the Edit in Canvas / Link to Canvas / Unlink document actions and the linked-document banner |',
          '| Tier | SERVICE. A cross-app hand-off (Studio to Canvas) layered on the document, not editing-core, not chrome |',
          '| Audit | ⚪ not-audited. Canvas is a companion app outside the CMS-pattern benchmark; storied here to document the in-Studio integration surface |',
          '| Patterns | `content-versioning` |',
          '',
          'That confirmation body is the substance worth studying here. Linking a document to Canvas ' +
            "runs a preflight that maps the Studio document into Canvas's model; when that mapping " +
            'would change content, the dialog shows the diff and asks the author to confirm before ' +
            'redirecting. `useLinkToCanvas` is deep and backend-bound (it resolves the Studio appId, ' +
            'POSTs a preflight, then resolves the organization redirect), so the *diff and redirecting ' +
            'states require a live Canvas backend* and are not reachable offline.',
          '',
          'What this file stories instead: the confirmation diff body (`LinkToCanvasDiff`) rendered ' +
            'directly with fixture documents, a real `@sanity/diff` comparison through the real ' +
            '`ChangeList`, which is the substantive content of the dialog, plus the dialog’s two ' +
            'deterministic offline states (missing document id, Studio app not found), driven by a ' +
            'stub AppId cache. The linked-document banner (`CanvasLinkedBanner`) is a separate ' +
            'surface, storied under Document Banners/In a live pane → "Canvas linked", not ' +
            'duplicated here.',
          '',
          '> **Why it matters:** the whole flow is opt-in, `apps.canvas.enabled` defaults off, so ' +
            'none of this runs, no dialog, no redirect, no banner, unless a workspace turns ' +
            'Canvas on.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:content-versioning',
    'audit:not-audited',
    'source:studio-only',
    'tier:service',
    'flag:apps.canvas.enabled',
  ],
}

export default meta
type Story = StoryObj

/**
 * The confirmation diff body: the real `LinkToCanvasDiff` computing an `@sanity/diff`
 * comparison between the Studio document and the Canvas-mapped version, rendered through
 * the real field `ChangeList`. The Published → Draft version chips (the Canvas target
 * carries the sparkle) sit above the changed-field list, here the title, subtitle and
 * year all differ. This is the substance the diff-state dialog wraps.
 */
export const ConfirmChangesDiff: Story = {
  name: 'Confirm changes · document diff',
  render: () => <ConfirmChangesDiffBody />,
}

/**
 * The real `LinkToCanvasDialog` with a resolved Studio app but no document to link: the
 * hook short-circuits to `missing-document-id` and renders the dialog chrome around the
 * critical error card, a deterministic offline render of the dialog shell.
 */
export const LinkDialogMissingDocument: Story = {
  name: 'Link dialog · missing document',
  parameters: {docs: {story: {inline: false, height: '360px'}}},
  render: () => (
    <AppIdCacheContext.Provider value={resolvedAppCache}>
      <LinkToCanvasDialog document={undefined} onClose={noop} />
    </AppIdCacheContext.Provider>
  ),
}

/**
 * The real dialog when no Studio app resolves for the origin (the AppId cache returns
 * nothing): the hook reports the `error` state with the "Studio app not found" message,
 * the offline failure mode when Canvas is configured but the studio app is not deployed
 * and no `fallbackStudioOrigin` is set.
 */
export const LinkDialogAppNotFound: Story = {
  name: 'Link dialog · studio app not found',
  parameters: {docs: {story: {inline: false, height: '360px'}}},
  render: () => (
    <AppIdCacheContext.Provider value={noAppCache}>
      <LinkToCanvasDialog document={originalDocument} onClose={noop} />
    </AppIdCacheContext.Provider>
  ),
}
