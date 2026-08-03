import {type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AddDocumentSearch} from '../../../../packages/sanity/src/core/releases/tool/detail/AddDocumentSearch'
import {ArchivedReleaseBanner} from '../../../../packages/sanity/src/core/releases/tool/detail/ArchivedReleaseBanner'
import {CopyReleaseActions} from '../../../../packages/sanity/src/core/releases/tool/detail/CopyReleaseActions'
import {DocumentActions} from '../../../../packages/sanity/src/core/releases/tool/detail/documentTable/DocumentActions'
import {DocumentType} from '../../../../packages/sanity/src/core/releases/tool/detail/documentTable/DocumentTableColumnDefs'
import {
  type AddDocumentToReleaseEvent,
  type ArchiveReleaseEvent,
  type CreateReleaseEvent,
  type DiscardDocumentFromReleaseEvent,
  type EditReleaseEvent,
  type PublishReleaseEvent,
  type ReleaseEvent,
  type ScheduleReleaseEvent,
} from '../../../../packages/sanity/src/core/releases/tool/detail/events/types'
import {type ReleaseEvents} from '../../../../packages/sanity/src/core/releases/tool/detail/events/useReleaseEvents'
import {ReleaseActivityList} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseActivityList'
import {ReleaseDashboardActivityPanel} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseDashboardActivityPanel'
import {ReleaseDashboardDetails} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseDashboardDetails'
import {ReleaseDashboardFooter} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseDashboardFooter'
import {ReleaseDashboardHeader} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseDashboardHeader'
import {ReleaseDateInput} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseDateInput'
import {ReleaseDetailsEditor} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseDetailsEditor'
import {ReleaseStatusItems} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseStatusItems'
import {ReleaseTypePicker} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseTypePicker'
import {type NotArchivedRelease} from '../../../../packages/sanity/src/core/releases/util/util'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {
  allReleaseFixtures,
  createDocumentInRelease,
  releaseFixtures,
} from '../../lib/releaseFixtures'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithSearchProviders} from '../../lib/searchHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/** The documents the activity feed's document events point at, so their previews resolve. */
const activityFixtureDocuments = [
  {
    _id: 'article-launch',
    _type: 'article',
    _rev: 'rev-launch-1',
    _createdAt: '2026-05-01T09:00:00Z',
    _updatedAt: '2026-05-14T11:30:00Z',
    title: 'The launch announcement',
  },
  {
    _id: 'article-pricing',
    _type: 'article',
    _rev: 'rev-pricing-1',
    _createdAt: '2026-05-02T09:00:00Z',
    _updatedAt: '2026-05-15T11:30:00Z',
    title: 'Pricing, revisited',
  },
]

/**
 * Fixture release events, built locally because this file is the only chapter that needs a full
 * `ReleaseEvent[]`. `origin` matters: `createRelease`/`editRelease` can come from the translog (see
 * `isTranslogEvent` in `events/types.ts`), everything else here is an Events API event.
 */
let eventCounter = 0
function mkEvent<T extends ReleaseEvent>(event: Omit<T, 'id' | 'author' | 'releaseName'>): T {
  // `event` carries every member-specific field the caller supplied for T; only the three fields
  // added below are missing.
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {
    id: `event-${++eventCounter}`,
    author: 'doug',
    releaseName: 'rDetail',
    ...event,
  } as T
}

const created = mkEvent<CreateReleaseEvent>({
  type: 'createRelease',
  timestamp: '2026-07-01T09:00:00Z',
  origin: 'translog',
  change: {releaseType: 'asap'},
})
const addedDoc = mkEvent<AddDocumentToReleaseEvent>({
  type: 'addDocumentToRelease',
  timestamp: '2026-07-01T09:05:00Z',
  origin: 'events',
  documentId: 'doc-1',
  documentType: 'author',
  versionId: 'versions.rDetail.doc-1',
  revisionId: 'rev-1',
  versionRevisionId: 'rev-1-v',
})
const scheduled = mkEvent<ScheduleReleaseEvent>({
  type: 'scheduleRelease',
  timestamp: '2026-07-02T10:00:00Z',
  origin: 'events',
  publishAt: '2026-07-10T08:00:00Z',
})
const discardedDoc = mkEvent<DiscardDocumentFromReleaseEvent>({
  type: 'discardDocumentFromRelease',
  timestamp: '2026-07-03T11:00:00Z',
  origin: 'events',
  documentId: 'doc-2',
  documentType: 'author',
  versionId: 'versions.rDetail.doc-2',
  versionRevisionId: 'rev-2-v',
})
const edited = mkEvent<EditReleaseEvent>({
  type: 'editRelease',
  timestamp: '2026-07-04T12:00:00Z',
  origin: 'translog',
  change: {intendedPublishDate: '2026-07-12T08:00:00Z'},
})
const published = mkEvent<PublishReleaseEvent>({
  type: 'publishRelease',
  timestamp: '2026-07-12T08:00:01Z',
  origin: 'events',
})
const archivedEvent = mkEvent<ArchiveReleaseEvent>({
  type: 'archiveRelease',
  timestamp: '2026-07-20T09:00:00Z',
  origin: 'events',
})

const mixedEvents: ReleaseEvent[] = [
  archivedEvent,
  published,
  edited,
  discardedDoc,
  scheduled,
  addedDoc,
  created,
]

function releaseEvents(overrides: Partial<ReleaseEvents> = {}): ReleaseEvents {
  return {
    events: mixedEvents,
    loading: false,
    error: null,
    hasMore: false,
    loadMore: () => undefined,
    ...overrides,
  }
}

/**
 * `ReleaseTypePicker` only accepts a release it knows is not archived. The shared fixtures are
 * typed broadly as `ReleaseDocument` (see `releaseFixtures.ts`'s `satisfies` clause), so a fixture
 * that is, at runtime, `state: 'active' | 'scheduled' | 'published'` still needs narrowing here.
 */
function notArchived(release: ReleaseDocument): NotArchivedRelease {
  // Every fixture passed through here is a known, non-archived state; only the fixtures module's
  // broad `ReleaseDocument` typing is lost.
  // oxlint-disable-next-line no-unsafe-type-assertion
  return release as NotArchivedRelease
}

function Stage({children, label}: {children: React.ReactNode; label?: string}) {
  return (
    <Stack gap={3}>
      {label && (
        <Text size={0} muted>
          {label}
        </Text>
      )}
      <Card border radius={2} padding={3} style={{maxWidth: 640}}>
        {children}
      </Card>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Releases/Release Detail',
  // A preview store is seeded, not just releases. The activity list renders a
  // `ReleaseDocumentPreview` under every document event, which reads through
  // `useDocumentPreviewValues`. Without a seeded store that resolves against a real
  // preview universe rather than a live API, those rows fail during render.
  decorators: [
    WithStudioProviders({
      releases: allReleaseFixtures,
      previewStore: createMockDocumentPreviewStore({documents: activityFixtureDocuments}),
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          '`ReleaseDetail.tsx` itself takes no props and reaches straight for live data, so it ' +
            'is not storied here; every piece under it takes its release and its documents as ' +
            'props instead, so the screen can be examined piece by piece rather than as a whole.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/detail/` |',
          '| Tier | SERVICE |',
          '| Coverage | the header and its copy menu, the details panel (pin, type picker, title/description editor, error and warning banners), the footer (status pills and the publish/schedule/revert action), the activity panel and its virtualised event list, and the two pieces the document table renders per row (the row action menu and the truncating type label) |',
          '',
          'The parts a release detail screen is assembled from. `ReleaseDetail.tsx` reaches ' +
            'straight for live data (`useActiveReleases`, `useArchivedReleases`, ' +
            '`useReleaseDocuments` running a real GROQ query, `useReleaseEvents`, and a ' +
            "`releaseId` read off `router.state` that this harness's fixed, empty router state " +
            'can never supply), the same standing rule as the releases overview root. The In ' +
            'Context story at the end assembles the pieces the way `ReleaseDetail.tsx` stacks ' +
            'them, as the closest stand-in for the screen.',
          '',
          '> **Why it matters:** a release detail screen carries three different kinds of ' +
            '"something is wrong" (a publish/schedule error, a missing permission, one invalid ' +
            'document) plus an activity feed that mixes two data sources, the translog and the ' +
            'Events API. Each is a distinct visual state below, because collapsing any pair of ' +
            'them into one rendering would leave the editor unable to tell why the screen is ' +
            'blocked.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:draft-publish-lifecycle',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------
// ReleaseDashboardHeader (packages/.../detail/ReleaseDashboardHeader.tsx)
// One return (lines 43-86): back-to-releases button, truncated title, copy menu,
// and the activity toggle. The title falls back to a placeholder at half opacity
// when untitled (line 66), and the activity button reports `selected` (line 80)
// when the caller's `inspector` state is `'activity'`.
// ---------------------------------------------------------------------------

export const Header: Story = {
  name: 'ReleaseDashboardHeader',
  parameters: {
    docs: {
      description: {
        story:
          'A titled, open release, activity panel closed. The back button always reads "Releases" regardless of state; only its destination changes underneath (open releases go to the active list, everything else to the archived one).',
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDashboardHeader
        release={releaseFixtures.asap}
        inspector={undefined}
        setInspector={() => undefined}
      />
    </Stage>
  ),
}

export const HeaderUntitledWithActivityOpen: Story = {
  name: 'ReleaseDashboardHeader - untitled, activity open',
  parameters: {
    docs: {
      description: {
        story:
          'Two independent branches at once: no title set, so the placeholder text renders at half opacity instead of an empty header; and the activity button is `selected`, which is what the caller sets when the inspector panel below is showing.',
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDashboardHeader
        release={{
          ...releaseFixtures.undecided,
          metadata: {...releaseFixtures.undecided.metadata, title: ''},
        }}
        inspector="activity"
        setInspector={() => undefined}
      />
    </Stage>
  ),
}

// ---------------------------------------------------------------------------
// CopyReleaseActions (packages/.../detail/CopyReleaseActions.tsx)
// One return (lines 66-98): a share-icon menu button with three copy actions.
// No conditional branches: the menu content is the same regardless of release
// state, so one story is the whole component.
// ---------------------------------------------------------------------------

export const CopyActions: Story = {
  name: 'CopyReleaseActions',
  parameters: {
    docs: {
      description: {
        story:
          "The header's share menu: copy link, copy id, copy title. Open it to see all three; " +
          'each pushes a toast and logs telemetry rather than doing anything to the release ' +
          'itself, so it is safe to leave enabled on every release state.',
      },
    },
  },
  render: () => (
    <Stage>
      <CopyReleaseActions release={releaseFixtures.scheduled} />
    </Stage>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseDashboardDetails (packages/.../detail/ReleaseDashboardDetails.tsx)
// Main return (lines 98-192). `shouldDisplayError` (line 51) gates an inline
// summary (125-136) and a full error card (151-171); `shouldDisplayWarnings`
// (line 53) gates the permission-missing pair (137-146, 173-187, not exercised
// here, see the docblock note below); archived releases skip the pin and type
// picker (lines 102, 123) and add `ArchivedReleaseBanner` (line 189).
// ---------------------------------------------------------------------------

export const DetailsActive: Story = {
  name: 'ReleaseDashboardDetails - active, clean',
  parameters: {
    docs: {
      description: {
        story:
          'An open, healthy release: the pin toggle, the type picker, the validation progress indicator, and the title/description editor. Nothing below is an error or a warning, so neither of those cards is present.',
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDashboardDetails release={releaseFixtures.asap} documents={[]} />
    </Stage>
  ),
}

export const DetailsPublishFailed: Story = {
  name: 'ReleaseDashboardDetails - publish failed',
  parameters: {
    docs: {
      description: {
        story:
          "The release carries an `error` (the asap-failed fixture), so `shouldDisplayError` is true: an inline summary line appears in the toolbar row and the full error card (with the raw message inside a collapsible `Details`) appears below the editor.\n\n**Not exercised:** the permission-missing sibling of this branch needs `useReleasePermissions().checkWithPermissionGuard` to resolve `false`, which means a second `WithStudioProviders({canPerformReleaseActions: false})` harness. Left as a documented gap rather than doubling this file's workspace compilation for one card.",
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDashboardDetails release={releaseFixtures.asapFailed} documents={[]} />
    </Stage>
  ),
}

export const DetailsArchived: Story = {
  name: 'ReleaseDashboardDetails - archived',
  parameters: {
    docs: {
      description: {
        story:
          'An archived release. The pin toggle and type picker are gone (there is nothing left to pin or reschedule), and `ArchivedReleaseBanner` appears at the bottom explaining the retention policy in their place.',
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDashboardDetails release={releaseFixtures.archived} documents={[]} />
    </Stage>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseDetailsEditor (packages/.../detail/ReleaseDetailsEditor.tsx)
// One return (lines 48-55), but `disabled` (line 53) flips on whether the
// release is open (`getIsReleaseOpen`, checked in the mount effect at lines
// 32-46) and whether the permission check it kicks off resolves true.
// ---------------------------------------------------------------------------

export const DetailsEditorOpen: Story = {
  name: 'ReleaseDetailsEditor - open, editable',
  parameters: {
    docs: {
      description: {
        story:
          "An active release: the title and description fields are editable. Typing debounces 200ms before calling `updateRelease`, which this harness's mock client accepts silently.",
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDetailsEditor release={releaseFixtures.asap} />
    </Stage>
  ),
}

export const DetailsEditorReadOnly: Story = {
  name: 'ReleaseDetailsEditor - published, read-only',
  parameters: {
    docs: {
      description: {
        story:
          "A published release. `getIsReleaseOpen` is false, so the mount effect never even asks whether the user has update permission: the fields are disabled unconditionally, because a published release's title is a record of what shipped, not something left open to edit.",
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseDetailsEditor release={releaseFixtures.published} />
    </Stage>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseTypePicker (packages/.../detail/ReleaseTypePicker.tsx)
// The published branch is a static `Card` pill (lines 235-243); every other
// state is a `Button` (244-260) that is `disabled` (line 246) exactly when
// `isReleaseScheduledOrScheduling` (line 115) is true, i.e. the release is
// locked into `state: 'scheduled'`.
// ---------------------------------------------------------------------------

export const TypePickerStates: Story = {
  name: 'ReleaseTypePicker - asap, scheduled, undecided',
  parameters: {
    docs: {
      description: {
        story:
          'The three open release types, each with its own icon and tone: asap (a bolt, caution), scheduled with a publish date (a clock, suggest), undecided (a dot, neutral). Click any of them to open the popover and see the same `TabList` plus, for scheduled, the date input and calendar.',
      },
    },
  },
  render: () => (
    <Flex gap={3} wrap="wrap">
      <ReleaseTypePicker release={notArchived(releaseFixtures.asap)} />
      <ReleaseTypePicker release={notArchived(releaseFixtures.scheduled)} />
      <ReleaseTypePicker release={notArchived(releaseFixtures.undecided)} />
    </Flex>
  ),
}

export const TypePickerLockedAndPublished: Story = {
  name: 'ReleaseTypePicker - locked, published',
  parameters: {
    docs: {
      description: {
        story:
          "Two states that stop being an editable control. Locked: the release is actually `state: 'scheduled'`, not merely typed that way, so the button is disabled with a tooltip explaining why. Published: the component renders no button at all, only a static pill, because a published release's timing is history rather than a setting.",
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Stage label="locked (state: scheduled)">
        <ReleaseTypePicker release={notArchived(releaseFixtures.scheduledLocked)} />
      </Stage>
      <Stage label="published">
        <ReleaseTypePicker release={notArchived(releaseFixtures.published)} />
      </Stage>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseDateInput (packages/.../detail/ReleaseDateInput.tsx)
// One return (lines 42-52): a lazy text input whose value is empty until an
// `intendedPublishAt` is supplied.
// ---------------------------------------------------------------------------

export const DateInputStates: Story = {
  name: 'ReleaseDateInput',
  parameters: {
    docs: {
      description: {
        story:
          'The date field the type picker\'s "scheduled" tab embeds. With a date it shows the formatted value; with none it is blank, waiting for the calendar or a typed date to fill it in.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Stage label="a date is set">
        <ReleaseDateInput
          intendedPublishAt={new Date('2026-08-01T14:30:00Z')}
          setIntendedPublishAt={() => undefined}
          setIsIntendedScheduleDateInPast={() => undefined}
        />
      </Stage>
      <Stage label="no date yet">
        <ReleaseDateInput
          intendedPublishAt={undefined}
          setIntendedPublishAt={() => undefined}
          setIsIntendedScheduleDateInPast={() => undefined}
        />
      </Stage>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------
// ArchivedReleaseBanner (packages/.../detail/ArchivedReleaseBanner.tsx)
// One return (lines 30-64); the heading text is a ternary on `state` (line 38)
// and the retention sentence (lines 40-59) only appears when the project's
// subscription reports a `maxRetentionDays` feature.
// ---------------------------------------------------------------------------

export const ArchivedVsPublishedBanner: Story = {
  name: 'ArchivedReleaseBanner - archived vs. published',
  parameters: {
    docs: {
      description: {
        story:
          'Same component, two headings. Archived reads "this will be removed"; published reads differently because nothing is scheduled for removal, it already shipped.\n\n**Harness note:** the retention sentence depends on `useProjectSubscriptions`, which requests `/subscriptions/project/:id`. This harness\'s mock client has no data registered for that path, so the request resolves to `projectSubscriptions: null` and `retentionDays` is `undefined`, the honest "we do not know the retention window" state rather than a fabricated one.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Stage label="archived">
        <ArchivedReleaseBanner release={releaseFixtures.archived} />
      </Stage>
      <Stage label="published">
        <ArchivedReleaseBanner release={releaseFixtures.published} />
      </Stage>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseStatusItems (packages/.../detail/ReleaseStatusItems.tsx)
// No events beyond creation renders the single "created" item (lines 43-57);
// a publish or archive/unarchive event in the list adds a second item
// (lines 58-74) instead of replacing the first.
// ---------------------------------------------------------------------------

export const StatusItemsStates: Story = {
  name: 'ReleaseStatusItems',
  parameters: {
    docs: {
      description: {
        story:
          'The footer\'s left-hand status pills. Every release shows "created"; a release that has since published, archived, or unarchived gets a second pill next to it rather than losing the first, so the footer reads as a short history rather than a single current status.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Stage label="just created">
        <ReleaseStatusItems events={[created]} release={releaseFixtures.asap} />
      </Stage>
      <Stage label="created, then published">
        <ReleaseStatusItems events={[created, published]} release={releaseFixtures.published} />
      </Stage>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseDashboardFooter (packages/.../detail/ReleaseDashboardFooter.tsx)
// `releaseActionButton` (lines 22-64) switches on release state and type:
// unschedule, schedule, publish-all, revert, or nothing for an archived
// release. The status items and menu button (lines 66-87) are constant.
// ---------------------------------------------------------------------------

export const FooterStates: Story = {
  name: 'ReleaseDashboardFooter - action button by state',
  parameters: {
    docs: {
      description: {
        story:
          'The same footer, four releases. Asap shows "Publish all"; a release with an undecided-then-scheduled date shows "Schedule"; published shows "Revert"; archived shows no action at all, only the status pills and the overflow menu, because there is nothing left an archived release can do.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Stage label="asap">
        <ReleaseDashboardFooter documents={[]} release={releaseFixtures.asap} events={[created]} />
      </Stage>
      <Stage label="scheduled">
        <ReleaseDashboardFooter
          documents={[]}
          release={releaseFixtures.scheduled}
          events={[created]}
        />
      </Stage>
      <Stage label="published">
        <ReleaseDashboardFooter
          documents={[]}
          release={releaseFixtures.published}
          events={[created, published]}
        />
      </Stage>
      <Stage label="archived - no action button">
        <ReleaseDashboardFooter
          documents={[]}
          release={releaseFixtures.archived}
          events={[created, archivedEvent]}
        />
      </Stage>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseActivityList + ReleaseActivityListItem
// (packages/.../detail/ReleaseActivityList.tsx, ReleaseActivityListItem.tsx)
// The list virtualises its rows (lines 81-98) and adds a loader row at the end
// whenever `hasMore || isLoading` (line 83, rendered at 127-130). Each item
// picks its sentence from `ACTIVITY_TEXT_118N` (lines 32-42) and only the two
// document events render a preview underneath (lines 154-156).
// ---------------------------------------------------------------------------

export const ActivityListMixedEvents: Story = {
  name: 'ReleaseActivityList - mixed event types',
  parameters: {
    docs: {
      description: {
        story:
          'Seven event types in one feed: created, a document added (with its preview card underneath), scheduled, a document discarded (also previewed), edited, published, archived. This is what `ReleaseDashboardActivityPanel` renders inside, and it is virtualised, so the list needs a real scroll container rather than an auto-height one, hence the fixed-height frame.',
      },
    },
  },
  render: () => (
    <ScreenFrame height={420}>
      <ReleaseActivityList
        events={mixedEvents}
        releaseTitle="Detail screen fixtures"
        releaseId="_.releases.rDetail"
        hasMore={false}
        loadMore={() => undefined}
        isLoading={false}
      />
    </ScreenFrame>
  ),
}

export const ActivityListLoadingMore: Story = {
  name: 'ReleaseActivityList - loading older events',
  parameters: {
    docs: {
      description: {
        story:
          '`hasMore` is true, so a loader row is virtualised in below the last event. Scrolling to it is what triggers `loadMore` in the real component (the `useEffect` at lines 92-98); here it is a permanent fixture rather than a live pagination cursor.',
      },
    },
  },
  render: () => (
    <ScreenFrame height={300}>
      <ReleaseActivityList
        events={[created, addedDoc]}
        releaseTitle="Detail screen fixtures"
        releaseId="_.releases.rDetail"
        hasMore
        loadMore={() => undefined}
        isLoading={false}
      />
    </ScreenFrame>
  ),
}

// ---------------------------------------------------------------------------
// ReleaseDashboardActivityPanel (packages/.../detail/ReleaseDashboardActivityPanel.tsx)
// The whole panel is gated on `show` (line 34): false renders nothing via
// `AnimatePresence`. When shown, an error with no events yet renders a caution
// card (lines 56-62) and a loading state with no events yet renders a loader
// (lines 63-65); either way the list underneath still mounts.
// ---------------------------------------------------------------------------

export const ActivityPanelOpen: Story = {
  name: 'ReleaseDashboardActivityPanel - open',
  parameters: {
    docs: {
      description: {
        story:
          "The resizable panel the header's activity button toggles, holding the same mixed-event feed as the list story above. Its width is draggable between 320 and 800px.",
      },
    },
  },
  render: () => (
    <ScreenFrame height={420}>
      <ReleaseDashboardActivityPanel events={releaseEvents()} release={releaseFixtures.asap} show />
    </ScreenFrame>
  ),
}

export const ActivityPanelClosed: Story = {
  name: 'ReleaseDashboardActivityPanel - closed, renders nothing',
  parameters: {
    docs: {
      description: {
        story:
          '`show={false}`. `AnimatePresence` has nothing to animate out because nothing was ever rendered in: the whole panel, including its own padding and border, is absent rather than collapsed to zero width. The dashed frame below is the story stage, not the component.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 480}}>
      <ReleaseDashboardActivityPanel
        events={releaseEvents()}
        release={releaseFixtures.asap}
        show={false}
      />
      <Text size={0} muted>
        the dashed box is the story frame; the panel itself rendered nothing
      </Text>
    </Card>
  ),
}

export const ActivityPanelErrorAndLoading: Story = {
  name: 'ReleaseDashboardActivityPanel - error and loading, no events yet',
  parameters: {
    docs: {
      description: {
        story:
          'Two states that only appear before any event has arrived: an errored feed shows a caution card instead of a silent empty list, and a still-loading feed shows a loader instead of looking finished with nothing to show. Once even one event lands, both cards step aside for the list.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <ScreenFrame height={260}>
        <ReleaseDashboardActivityPanel
          events={releaseEvents({
            events: [],
            error: new Error('mock activity feed error'),
          })}
          release={releaseFixtures.asap}
          show
        />
      </ScreenFrame>
      <ScreenFrame height={260}>
        <ReleaseDashboardActivityPanel
          events={releaseEvents({events: [], loading: true})}
          release={releaseFixtures.asap}
          show
        />
      </ScreenFrame>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------
// DocumentActions (packages/.../detail/documentTable/DocumentActions.tsx)
// `GuardedDocumentActions` (lines 137-156) renders a disabled button when the
// document's type is not in the schema (144-152); otherwise `DocumentActionsInner`
// (18-135) renders the real menu, discard and unpublish, each gated by its own
// permission check and current document state.
// ---------------------------------------------------------------------------

const authorDocInRelease = createDocumentInRelease({
  id: 'doc-author-1',
  type: 'author',
  title: 'Ada Lovelace',
})

export const DocumentActionsMenu: Story = {
  name: 'DocumentActions - the row menu',
  parameters: {
    docs: {
      description: {
        story:
          "The overflow menu each document-table row carries: discard the version, or unpublish once the release goes live. The type (`author`) is registered in this harness's schema, so `GuardedDocumentActions` hands off to the real menu.",
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentActions document={authorDocInRelease} releaseTitle="Detail screen fixtures" />
    </Stage>
  ),
}

export const DocumentActionsUnknownType: Story = {
  name: 'DocumentActions - schema type not found',
  parameters: {
    docs: {
      description: {
        story:
          'A document whose `_type` is not registered in the schema at all, the guard branch at lines 144-152. Rather than crash trying to look up permissions for a type that does not exist, the component renders a disabled button with a "type not found" tooltip and stops there. A real studio would only reach this for a document type removed from the schema after documents of that type were released.',
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentActions
        document={createDocumentInRelease({id: 'doc-orphan', type: 'retiredType'})}
        releaseTitle="Detail screen fixtures"
      />
    </Stage>
  ),
}

// ---------------------------------------------------------------------------
// DocumentType (packages/.../detail/documentTable/DocumentTableColumnDefs.tsx)
// Exported "for unit testing only" (line 67), but exported all the same. Two
// appearances: plain text (113-117) or, when the rendered width overflows,
// the same text wrapped in a tooltip (119-125). The truncation branch depends
// on a `ResizeObserver` measuring real layout, which a fixture cannot force
// without a second schema type (and this harness's config merges one level
// deep, replacing rather than extending), so only the untruncated appearance
// is storied here.
// ---------------------------------------------------------------------------

export const DocumentTypeLabel: Story = {
  name: 'DocumentType',
  parameters: {
    docs: {
      description: {
        story:
          'The type-column cell in the document table: the schema type\'s title, resolved live through `useSchema()`. "Author" is short enough not to truncate; the tooltip-on-truncate branch is a real ResizeObserver measurement rather than a prop and is not exercised here (see the note above).',
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentType type="author" />
    </Stage>
  ),
}

// ---------------------------------------------------------------------------
// AddDocumentSearch (packages/.../detail/AddDocumentSearch.tsx)
// One return (lines 21-35): its own Layer/Search/Portal providers wrapping the
// shared `SearchPopover`, with `idsInRelease` disabling rows already in the
// release. Needs the search chapter's harness (a schema with real fields and a
// groq-js-backed client), not the plain releases decorator above, so this
// story overrides it.
// ---------------------------------------------------------------------------

export const AddDocumentSearchOpen: Story = {
  name: 'AddDocumentSearch - open',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The popover `ReleaseSummary`\'s "Add document" button opens, reusing the navbar search machinery scoped to this release: results already in the release are disabled rather than hidden, so a document that was already added is recognisable rather than missing. See `Search/Search Popover` for the harness this borrows and why it runs the `groqLegacy` strategy offline.',
      },
    },
  },
  render: () => (
    <div style={{position: 'relative', height: 480}}>
      <AddDocumentSearch
        open
        onClose={() => undefined}
        releaseId="_.releases.rDetail"
        idsInRelease={['doc-1']}
      />
    </div>
  ),
}

// ---------------------------------------------------------------------------
// In Context: the detail screen assembled from its own parts, in the shape
// ReleaseDetail.tsx (lines 102-134) stacks them. The live screen itself is not
// storied (see the component docblock); this is the nearest a fixture-driven
// story gets to it.
// ---------------------------------------------------------------------------

const inContextRelease: ReleaseDocument = releaseFixtures.asap

export const InContext: Story = {
  name: 'In context - the screen assembled',
  parameters: {
    docs: {
      description: {
        story:
          'Header, details panel, footer and activity panel, stacked the way ' +
          '`ReleaseDetail.tsx` composes them around whatever `ReleaseSummary` renders in the ' +
          'middle (see `Releases/Release Summary` for that piece). Toggle in your head: ' +
          "everything here is prop-driven, so this assembly is possible without the screen's " +
          'own data-fetching root.',
      },
    },
  },
  render: function InContextStory() {
    return (
      <ScreenFrame height={620}>
        <Flex direction="column" flex={1} height="fill" overflow="hidden">
          <Card flex="none" padding={3}>
            <ReleaseDashboardHeader
              release={inContextRelease}
              inspector="activity"
              setInspector={() => undefined}
            />
          </Card>
          <Flex flex={1}>
            <Flex direction="column" flex={1} height="fill">
              <Card flex={1} overflow="auto">
                <ReleaseDashboardDetails release={inContextRelease} documents={[]} />
                <Card padding={4} tone="transparent">
                  <Text size={1} muted align="center">
                    ReleaseSummary&apos;s document table lives here, see Releases/Release Summary
                  </Text>
                </Card>
              </Card>
              <ReleaseDashboardFooter
                documents={[]}
                release={inContextRelease}
                events={mixedEvents}
              />
            </Flex>
            <ReleaseDashboardActivityPanel
              events={releaseEvents()}
              release={inContextRelease}
              show
            />
          </Flex>
        </Flex>
      </ScreenFrame>
    )
  },
}
