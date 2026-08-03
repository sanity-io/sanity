import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DeleteScheduledDraftDialog} from '../../../../packages/sanity/src/core/singleDocRelease/components/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../../../../packages/sanity/src/core/singleDocRelease/components/PublishScheduledDraftDialog'
import {
  createScheduledDraftPreviewStore,
  scheduledDraftDocuments,
  scheduledDraftMembership,
  scheduledDraftReleases,
} from '../../lib/scheduledDraftFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const schemaTypes = [
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
      {name: 'year', title: 'Year', type: 'number'},
    ],
    preview: {select: {title: 'title', subtitle: 'year'}},
  },
]

const studioConfig = {
  schema: {name: 'mock', types: schemaTypes},
  // The flag under story: OFF by default. Storybook mounts the gated dialogs directly,
  // so the render doesn't depend on it — the release store is seeded instead (below).
  // Set for fidelity: in a real studio this is what registers the scheduled-draft
  // document actions, menu item and override banner.
  scheduledDrafts: {enabled: true},
  releases: {enabled: true},
}

const previewStore = createScheduledDraftPreviewStore({
  documents: scheduledDraftDocuments,
  membership: scheduledDraftMembership,
})

// The scheduled-draft release that holds the "Q4 launch announcement" version
// document, and (for Delete) its published id.
const [scheduledRelease, emptyRelease] = scheduledDraftReleases
const PUBLISHED_ID = 'book-launch'

const noop = () => undefined

const meta: Meta = {
  title: 'Scheduling/Scheduled Drafts',
  decorators: [
    WithStudioProviders({
      config: studioConfig,
      previewStore,
      releases: scheduledDraftReleases,
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Scheduling one document to publish itself is a small feature with a big trust ' +
            'requirement: the author is handing the publish button to a clock. These dialogs are ' +
            'where that hand-off is made honest.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/singleDocRelease/components/`, Studio-only (no design-system equivalent) |',
          '| Flag | `scheduledDrafts.enabled`, default off (`DefaultPluginsWorkspaceOptions`, `core/config/types.ts`). When enabled, the plugin registers the scheduled-draft document actions, the perspective-navbar menu item, and the override banner |',
          '| Tier | SERVICE. A document-lifecycle primitive composed from the releases machinery (a single-document `scheduled` release), not editing-core, not chrome |',
          '| Audit | 🔴 needs-work (`draft-publish-lifecycle`, `content-versioning`). The benchmark flagged Studio versioning surfaces as under-explained. A scheduled draft is a release wearing a simpler hat; these confirmation dialogs are the moments the mechanism is made legible to an author |',
          '| Patterns | `draft-publish-lifecycle` · `content-versioning` |',
          '',
          'Spelling out exactly what happens and when means nobody is surprised by content going ' +
            'live while they sleep. Under the hood it is the full releases machinery, deliberately ' +
            'wearing a simpler hat.',
          '',
          'A scheduled draft is a single-document `scheduled` release: the edited version document ' +
            'is parked in a release whose `intendedPublishAt` fires the publish. Both dialogs run the ' +
            'real hooks, `useScheduledDraftDocument` resolves the version document (and its live ' +
            '`Preview`) through the release-bundle seam, and `useScheduleDraftOperations` provides ' +
            'the confirm handlers, against a fixture preview store (a `partOfRelease` id-set override) ' +
            'and a seeded releases store. See `lib/scheduledDraftFixtures.ts`.',
          '',
          'The confirm handlers are the real operations store running against the mock client; in a ' +
            'static story nothing invokes them (autodocs never clicks), so the dialogs render their ' +
            'upcoming-schedule state cleanly. The override banner and navbar menu item are gated ' +
            'surfaces too, the banner is storied under Document Banners/In a live pane → "Scheduled ' +
            'draft override", not duplicated here.',
          '',
          '> **Why it matters:** a scheduled draft is not a separate primitive, it is a ' +
            'single-document scheduled release wearing a simpler hat. If you touch the releases ' +
            'machinery, you touch this too; the two stay in lockstep by design.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:draft-publish-lifecycle',
    'pattern:content-versioning',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
    'flag:scheduledDrafts.enabled',
  ],
}

export default meta
type Story = StoryObj

/**
 * The Publish dialog: "publish now" over an upcoming scheduled draft. It previews the
 * scheduled version document (resolved live through the release bundle) and explains
 * that confirming publishes immediately rather than waiting for the scheduled time.
 * The confirm button runs the real `publishScheduledDraft` (unschedule → publish).
 */
export const PublishNow: Story = {
  name: 'Publish · upcoming schedule',
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => (
    <PublishScheduledDraftDialog release={scheduledRelease} documentType="book" onClose={noop} />
  ),
}

/**
 * The Delete dialog when the local draft has diverged from the scheduled version: the
 * real `useDocumentVersions` path finds a draft whose revision differs from the
 * scheduled version, so the dialog surfaces the "copy these changes to your draft?"
 * checkbox before deleting the schedule. This is the closest thing the two dialogs
 * have to a conflict state, there is no separate validation-blocked or read-only
 * variant in either dialog.
 */
export const DeleteWithCopyChoice: Story = {
  name: 'Delete · divergent draft (copy choice)',
  parameters: {docs: {story: {inline: false, height: '560px'}}},
  render: () => (
    <DeleteScheduledDraftDialog
      release={scheduledRelease}
      documentId={PUBLISHED_ID}
      documentType="book"
      onClose={noop}
    />
  ),
}

/**
 * The Delete dialog with no divergent draft to preserve (the empty-release branch):
 * the schedule is already current, so there is nothing to copy, a straight delete
 * confirmation with no checkbox.
 */
export const DeleteNoChanges: Story = {
  name: 'Delete · no divergent draft',
  parameters: {docs: {story: {inline: false, height: '440px'}}},
  render: () => (
    <DeleteScheduledDraftDialog release={emptyRelease} documentId={undefined} onClose={noop} />
  ),
}
