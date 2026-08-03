import {type PortableTextBlock, type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {
  ReleasesUpsellContext,
  SingleDocReleaseEnabledContext,
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
} from 'sanity/_singletons'
import {userEvent, within} from 'storybook/test'

import {type ReleasesUpsellContextValue} from '../../../../packages/sanity/src/core/releases/contexts/upsell/types'
import {CalendarPopover} from '../../../../packages/sanity/src/core/releases/tool/overview/CalendarPopover'
import {ReleaseColumnValidationLoading} from '../../../../packages/sanity/src/core/releases/tool/overview/columnCells/ReleaseColumnValidationLoading'
import {ReleaseDocumentsCounter} from '../../../../packages/sanity/src/core/releases/tool/overview/columnCells/ReleaseDocumentsCounter'
import {ReleaseNameCell} from '../../../../packages/sanity/src/core/releases/tool/overview/columnCells/ReleaseName'
import {ScheduledDraftDocumentPreview} from '../../../../packages/sanity/src/core/releases/tool/overview/columnCells/ScheduledDraftDocumentPreview'
import {ScheduledDraftMetadataCell} from '../../../../packages/sanity/src/core/releases/tool/overview/columnCells/ScheduledDraftMetadataCell'
import {ScheduledDraftWarningCell} from '../../../../packages/sanity/src/core/releases/tool/overview/columnCells/ScheduledDraftWarningCell'
import {ConfirmScheduledDraftsDialog} from '../../../../packages/sanity/src/core/releases/tool/overview/ConfirmScheduledDraftsDialog'
import {DateFilterButton} from '../../../../packages/sanity/src/core/releases/tool/overview/ReleaseCalendarFilter'
import {ReleaseMenuButtonWrapper} from '../../../../packages/sanity/src/core/releases/tool/overview/ReleaseMenuButtonWrapper'
import {ScheduledDraftMenuButtonWrapper} from '../../../../packages/sanity/src/core/releases/tool/overview/ScheduledDraftMenuButtonWrapper'
import {ScheduledDraftsEmptyState} from '../../../../packages/sanity/src/core/releases/tool/overview/ScheduledDraftsEmptyState'
import {SchedulesUpsell} from '../../../../packages/sanity/src/core/releases/tool/overview/SchedulesUpsell'
import {type UpsellData} from '../../../../packages/sanity/src/core/studio/upsell/types'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {asTableRelease, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * A day's worth of documents assigned to two of the release fixtures, so the components that
 * fetch their own data (rather than take it as a prop) have something real to fetch.
 *
 * `rASAP` (releaseFixtures.asap) gets two; `rCardinalityOne` (releaseFixtures.scheduledDraft)
 * gets one, matching the one-document contract a scheduled draft is built on.
 */
const cellFixtureDocuments: SanityDocument[] = [
  {
    _id: 'author-orwell',
    _type: 'author',
    _rev: 'rev-orwell-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-18T15:00:00Z',
    name: 'George Orwell',
  },
  {
    _id: 'author-baldwin',
    _type: 'author',
    _rev: 'rev-baldwin-1',
    _createdAt: '2026-06-02T09:00:00Z',
    _updatedAt: '2026-06-20T11:00:00Z',
    name: 'James Baldwin',
  },
]

const idsByReleaseId: Record<string, string[]> = {
  rASAP: ['author-orwell', 'author-baldwin'],
  rCardinalityOne: ['author-baldwin'],
}

function resolveReleaseDocIds(
  groqFilter: string,
  params: Record<string, unknown>,
): string[] | undefined {
  if (groqFilter !== 'sanity::partOfRelease($releaseId)') return undefined
  const releaseId = params.releaseId
  return typeof releaseId === 'string' ? (idsByReleaseId[releaseId] ?? []) : []
}

/** Resolves live. Backs the stories that show what each cell looks like once its own fetch settles. */
const resolvedCellStore = createMockDocumentPreviewStore({
  documents: cellFixtureDocuments,
  resolveDocumentIdSet: resolveReleaseDocIds,
})

/**
 * Same documents, same resolution, but delayed far past any story's lifetime. `useReleaseDocuments`
 * (and everything built on it: the validation cell, the scheduled-draft preview, the metadata cell)
 * starts every stream with `{loading: true}` and stays there until the store answers - so a store
 * that never answers within the story's lifetime is the honest way to freeze that first frame.
 */
const loadingCellStore = createMockDocumentPreviewStore({
  documents: cellFixtureDocuments,
  delayMs: 24 * 60 * 60 * 1000,
  resolveDocumentIdSet: resolveReleaseDocIds,
})

const cellReleases = [releaseFixtures.asap, releaseFixtures.scheduledDraft]

const withDefaultReleases = WithStudioProviders({releases: [releaseFixtures.asap]})
const withResolvedCells = WithStudioProviders({
  releases: cellReleases,
  previewStore: resolvedCellStore,
})
const withLoadingCells = WithStudioProviders({
  releases: cellReleases,
  previewStore: loadingCellStore,
})
const withNoDocuments = WithStudioProviders({
  releases: [releaseFixtures.scheduledDraft],
  previewStore: createMockDocumentPreviewStore({documents: [], resolveDocumentIdSet: () => []}),
})

const asapRelease = asTableRelease(releaseFixtures.asap)
const scheduledDraftRelease = asTableRelease(releaseFixtures.scheduledDraft)

const cellProps = {id: 'gallery-cell', style: {}}

function upsellDescription(text: string): PortableTextBlock[] {
  return [
    {
      _type: 'block',
      _key: 'k1',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'k1s', text, marks: []}],
    },
  ]
}

function fakeUpsellData(id: string, ctaText: string): UpsellData {
  return {
    _id: id,
    _type: 'upsellData',
    _rev: 'rev-1',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    id,
    image: null,
    descriptionText: upsellDescription('This feature is part of a higher plan.'),
    ctaButton: {text: ctaText, url: 'https://www.sanity.io/pricing'},
    secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
  }
}

const releasesUpsellValue: ReleasesUpsellContextValue = {
  mode: 'upsell',
  upsellDialogOpen: false,
  upsellData: fakeUpsellData('releases-upsell', 'Upgrade for more releases'),
  guardWithReleaseLimitUpsell: async () => undefined,
  onReleaseLimitReached: () => undefined,
  handleOpenDialog: () => undefined,
  telemetryLogs: {
    dialogSecondaryClicked: () => undefined,
    dialogPrimaryClicked: () => undefined,
    panelViewed: () => undefined,
    panelDismissed: () => undefined,
    panelPrimaryClicked: () => undefined,
    panelSecondaryClicked: () => undefined,
  },
}

const singleDocUpsellValue: SingleDocReleaseUpsellContextValue = {
  upsellDialogOpen: false,
  handleOpenDialog: () => undefined,
  handleClose: () => undefined,
  upsellData: fakeUpsellData('scheduled-drafts-upsell', 'Upgrade for scheduled drafts'),
  telemetryLogs: {
    dialogSecondaryClicked: () => undefined,
    dialogPrimaryClicked: () => undefined,
    panelViewed: () => undefined,
    panelDismissed: () => undefined,
    panelPrimaryClicked: () => undefined,
    panelSecondaryClicked: () => undefined,
  },
}

/** `SingleDocReleaseEnabledContext`'s upsell state, reused everywhere a story needs it. */
const singleDocUpsellEnabledValue = {enabled: true, mode: 'upsell'} as const

function Stage({children, label}: {children: React.ReactNode; label?: string}) {
  return (
    <Stack gap={3}>
      {label && (
        <Text size={0} muted>
          {label}
        </Text>
      )}
      <Card border radius={2} padding={2} style={{maxWidth: 720}}>
        {children}
      </Card>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Releases/Release Overview',
  parameters: {
    docs: {
      description: {
        component: [
          'Most of these pieces call their own hook rather than take data as a prop, and the ' +
            'hooks in question run a live GROQ query, so a component cannot show anything real ' +
            'unless the story feeds the same seam the hook reads, not merely the seam a prop ' +
            'would.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/overview/` and `.../overview/columnCells/` |',
          '| Tier | SERVICE |',
          '| Patterns | `empty-states` · `bulk-actions` |',
          '| Coverage | the calendar chrome, the scheduled-drafts empty and upsell surfaces, the confirm-schedule dialog, the two per-row action menus, and the six table-cell renderers under `columnCells/`, companion to `Releases/Overview Parts` |',
          '',
          "The rest of the overview screen's parts. That companion page covers the empty state " +
            'and the four banners; this one covers everything data-fetch-backed instead. The ' +
            'overview root (`ReleasesOverview.tsx`) itself runs the live release and metadata ' +
            'queries and stays out of scope, same as its companion page.',
          '',
          '> **Why it matters:** that is a different failure mode from the banners on the ' +
            'companion page, which return null from conditions in their props. Here the component ' +
            'cannot show anything real unless the story feeds the same seam the hook reads. The ' +
            'gallery below does that with a mock document preview store, and one cell gets stuck ' +
            'because of it, for a reason that lies past the render.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:empty-states',
    'pattern:bulk-actions',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const CalendarFilterChrome: Story = {
  name: 'CalendarPopover + DateFilterButton',
  decorators: [withDefaultReleases],
  parameters: {
    docs: {
      description: {
        story:
          'The two pieces either side of the calendar filter itself. `CalendarPopover` is the trigger: a popover on a wide viewport, a dialog on a narrow one (`asDialog`), same content either way, and it manages its own open state, so the stories below open it with a click rather than a prop. `DateFilterButton` is what replaces it once a day is picked: a chip carrying the formatted date, with a close icon that fires `onClear` and plays an exit animation first, which is why removing it from the row is not instant.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="as a popover (wide viewport)">
        <div data-testid="calendar-popover-wide">
          <CalendarPopover content={<Text size={1}>Calendar content would render here.</Text>} />
        </div>
      </Stage>
      <Stage label="as a dialog (narrow viewport, asDialog)">
        <div data-testid="calendar-popover-narrow">
          <CalendarPopover
            asDialog
            content={<Text size={1}>Calendar content would render here.</Text>}
          />
        </div>
      </Stage>
      <Stage label="DateFilterButton, a day selected">
        <DateFilterButton filterDate={new Date('2026-07-14T00:00:00Z')} onClear={() => undefined} />
      </Stage>
    </Stack>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', {name: /calendar/i}))
  },
}

export const ScheduledDraftsEmptyStates: Story = {
  name: 'ScheduledDraftsEmptyState',
  decorators: [withDefaultReleases],
  parameters: {
    docs: {
      description: {
        story:
          "Takes no props at all; it reads `useSingleDocReleaseEnabled()` directly and returns `null` in upsell mode. That is invisible from the call site in `ReleasesOverview.tsx`, which renders it unconditionally whenever `cardinalityView === 'drafts'` has nothing to show - the emptiness or the upsell redirect is entirely this component's call. The \"renders nothing\" stage below overrides the context locally to prove it, the same technique the companion page uses for the banners.",
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="mode: default">
        <div style={{height: 320, display: 'flex'}}>
          <ScheduledDraftsEmptyState />
        </div>
      </Stage>
      <Stack gap={3}>
        <Text size={0} muted>
          mode: upsell (renders nothing)
        </Text>
        <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 720}}>
          <SingleDocReleaseEnabledContext.Provider value={singleDocUpsellEnabledValue}>
            <ScheduledDraftsEmptyState />
          </SingleDocReleaseEnabledContext.Provider>
        </Card>
      </Stack>
    </Stack>
  ),
}

export const SchedulesUpsellPanels: Story = {
  name: 'SchedulesUpsell',
  decorators: [withDefaultReleases],
  parameters: {
    docs: {
      description: {
        story:
          'One component, two unrelated upsell systems behind it: the `releases` branch reads `useReleasesUpsell()`, the `drafts` branch reads `useSingleDocReleaseEnabled()` **and** `useSingleDocReleaseUpsell()`. Both fall back to a safe default with no upsell data when nothing provides them - which is also why `ReleasesOverview` can mount whichever branch is current without checking first. These stories supply real context values locally (the shared harness does not, since almost every other story wants the plain, non-upselling studio) to make the panel content visible rather than the null it renders by default.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="cardinalityView: releases, upsell mode">
        <ReleasesUpsellContext.Provider value={releasesUpsellValue}>
          <div style={{height: 280, display: 'flex'}}>
            <SchedulesUpsell cardinalityView="releases" />
          </div>
        </ReleasesUpsellContext.Provider>
      </Stage>
      <Stage label="cardinalityView: drafts, upsell mode">
        <SingleDocReleaseEnabledContext.Provider value={singleDocUpsellEnabledValue}>
          <SingleDocReleaseUpsellContext.Provider value={singleDocUpsellValue}>
            <div style={{height: 280, display: 'flex'}}>
              <SchedulesUpsell cardinalityView="drafts" />
            </div>
          </SingleDocReleaseUpsellContext.Provider>
        </SingleDocReleaseEnabledContext.Provider>
      </Stage>
    </Stack>
  ),
}

export const ConfirmScheduledDraftsDialogStory: Story = {
  name: 'ConfirmScheduledDraftsDialog',
  decorators: [withDefaultReleases],
  parameters: {
    docs: {
      description: {
        story:
          'Offers to schedule every active scheduled draft in one server action (`client.action`, batched). The second sentence only appears when at least one of the drafts has an intended publish date already in the past - `releaseFixtures.scheduled` is exactly that fixture (its `intendedPublishAt` is 2023, which is why it also carries the caution warning elsewhere on this page), so the two stories below are the same dialog against two different sets rather than two different components.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="no past dates among the drafts">
        <ConfirmScheduledDraftsDialog
          activeScheduledDrafts={[releaseFixtures.scheduledDraft]}
          onClose={() => undefined}
        />
      </Stage>
      <Stage label="one draft's intended date has already passed">
        <ConfirmScheduledDraftsDialog
          activeScheduledDrafts={[releaseFixtures.scheduled, releaseFixtures.scheduledDraft]}
          onClose={() => undefined}
        />
      </Stage>
    </Stack>
  ),
}

export const RowActionMenus: Story = {
  name: 'ReleaseMenuButtonWrapper + ScheduledDraftMenuButtonWrapper',
  parameters: {
    docs: {
      description: {
        story:
          "The row-action button the table's `rowActions` slot renders, for each of the two `cardinalityView`s. Neither takes its data as a prop: `ReleaseMenuButtonWrapper` calls `useReleaseDocuments` itself, and `ScheduledDraftMenuButtonWrapper` calls `useScheduledDraftDocument`, which is the same hook one layer down. That second one has a real early return worth seeing: **it renders nothing at all until a scheduled-draft document resolves**, so a scheduled draft whose one document has been deleted underneath it shows an empty cell where the menu should be, with nothing to click and no explanation. The third stage reproduces that.",
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="ReleaseMenuButtonWrapper, a many-cardinality release">
        <ReleaseMenuButtonWrapper release={asapRelease} documentsCount={2} />
      </Stage>
      <Stage label="ScheduledDraftMenuButtonWrapper, its one document present">
        <ScheduledDraftMenuButtonWrapper release={scheduledDraftRelease} />
      </Stage>
      <Stack gap={3}>
        <Text size={0} muted>
          ScheduledDraftMenuButtonWrapper, the document is gone (renders nothing)
        </Text>
        <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 720}}>
          <ScheduledDraftMenuButtonWrapper release={scheduledDraftRelease} />
        </Card>
      </Stack>
    </Stack>
  ),
  decorators: [withResolvedCells],
}

export const ColumnCellGallery: Story = {
  name: 'The six columnCells, resolved',
  decorators: [withResolvedCells],
  parameters: {
    docs: {
      description: {
        story: [
          "Every cell under `overview/columnCells/`, called the way `Table.tsx` calls them (`<Cell datum cellProps sorting />`), against the same two release rows, once each cell's own data fetch has settled. A table rather than six stories, because the point is the comparison.",
          '',
          "The finding: `ReleaseDocumentsCounter` renders `documentCount || '-'`. A release with zero documents and a release whose count has not loaded yet are both falsy, so both print the same dash, the middle column below shows a real `0` and an `undefined` side by side, and they are indistinguishable. Nothing downstream of this cell can tell the two states apart either; the count is simply gone.",
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Grid gridTemplateColumns={4} gap={2} style={{alignItems: 'center'}}>
        <Text size={0} weight="semibold">
          release
        </Text>
        <Text size={0} weight="semibold">
          ReleaseNameCell
        </Text>
        <Text size={0} weight="semibold">
          ReleaseColumnValidationLoading
        </Text>
        <Text size={0} weight="semibold">
          ReleaseDocumentsCounter (5 / 0 / unknown)
        </Text>

        <Text size={1} muted>
          {releaseFixtures.asap.metadata.title}
        </Text>
        <Box style={{maxWidth: 260}}>
          <ReleaseNameCell datum={asapRelease} cellProps={cellProps} sorting={false} />
        </Box>
        <ReleaseColumnValidationLoading releaseId={releaseFixtures.asap._id} />
        <Flex gap={4}>
          <ReleaseDocumentsCounter documentCount={5} />
          <ReleaseDocumentsCounter documentCount={0} />
          <ReleaseDocumentsCounter documentCount={undefined} />
        </Flex>
      </Grid>

      <Card borderTop paddingTop={4}>
        <Grid gridTemplateColumns={4} gap={2} style={{alignItems: 'center'}}>
          <Text size={0} weight="semibold">
            release
          </Text>
          <Text size={0} weight="semibold">
            ScheduledDraftDocumentPreview
          </Text>
          <Text size={0} weight="semibold">
            ScheduledDraftMetadataCell
          </Text>
          <Text size={0} weight="semibold">
            ScheduledDraftWarningCell
          </Text>

          <Text size={1} muted>
            {releaseFixtures.asap.metadata.title} (asap, not scheduled)
          </Text>
          <Box style={{maxWidth: 320}}>
            <ScheduledDraftDocumentPreview
              datum={asapRelease}
              cellProps={cellProps}
              sorting={false}
            />
          </Box>
          <ScheduledDraftMetadataCell datum={asapRelease} cellProps={cellProps} sorting={false} />
          <ScheduledDraftWarningCell datum={asapRelease} cellProps={cellProps} sorting={false} />

          <Text size={1} muted>
            {releaseFixtures.scheduledDraft.metadata.title} (intended date already passed)
          </Text>
          <Box style={{maxWidth: 320}}>
            <ScheduledDraftDocumentPreview
              datum={scheduledDraftRelease}
              cellProps={cellProps}
              sorting={false}
            />
          </Box>
          <ScheduledDraftMetadataCell
            datum={scheduledDraftRelease}
            cellProps={cellProps}
            sorting={false}
          />
          <ScheduledDraftWarningCell
            datum={scheduledDraftRelease}
            cellProps={cellProps}
            sorting={false}
          />
        </Grid>
      </Card>

      <Card tone="caution" padding={3} radius={2} style={{maxWidth: 720}}>
        <Text size={1}>
          {
            'ScheduledDraftMetadataCell\'s avatar stays on its skeleton in both rows above rather than resolving to a name. That is not a harness gap: useReleaseCreator (overview/hooks/useReleaseCreator.ts) waits on useReleaseHistory, which fetches the transaction log directly with fetch() rather than through the Sanity client. In a storybook - and in a real studio the moment that endpoint errors - useReleaseHistory.ts:111-113 treats an empty history array as "still loading" (`if (!history || history.length === 0) return {..., loading: true}`), with no separate error state to fall back to. A failed history fetch and a document with no history yet are indistinguishable, and both render as a permanent skeleton.'
          }
        </Text>
      </Card>
    </Stack>
  ),
}

export const ColumnCellGalleryLoading: Story = {
  name: 'The three fetch-backed cells, loading',
  decorators: [withLoadingCells],
  parameters: {
    docs: {
      description: {
        story:
          "The same two release rows, but the document-preview store never answers within the story's lifetime, which freezes each cell's `loading` branch instead of its resolved one. `ReleaseDocumentsCounter` and `ScheduledDraftWarningCell` are excluded here: they take their data as plain props, so there is no fetch for them to be stuck in.",
      },
    },
  },
  render: () => (
    <Grid gridTemplateColumns={3} gap={2} style={{alignItems: 'center'}}>
      <Text size={0} weight="semibold">
        ReleaseColumnValidationLoading
      </Text>
      <Text size={0} weight="semibold">
        ScheduledDraftDocumentPreview
      </Text>
      <Text size={0} weight="semibold">
        ScheduledDraftMetadataCell
      </Text>

      <ReleaseColumnValidationLoading releaseId={releaseFixtures.asap._id} />
      <Box style={{maxWidth: 320}}>
        <ScheduledDraftDocumentPreview
          datum={scheduledDraftRelease}
          cellProps={cellProps}
          sorting={false}
        />
      </Box>
      <ScheduledDraftMetadataCell
        datum={scheduledDraftRelease}
        cellProps={cellProps}
        sorting={false}
      />
    </Grid>
  ),
}

export const ScheduledDraftPreviewNoDocument: Story = {
  name: 'ScheduledDraftDocumentPreview, the release has no document',
  decorators: [withNoDocuments],
  parameters: {
    docs: {
      description: {
        story:
          "Distinct from loading: here the fetch has settled and there is genuinely no first document (`firstDocument` is `undefined`, not pending). The component's `isLoading` check (`release.isLoading || documentsLoading || !firstDocument`) treats that the same as still-fetching, so the cell shows the loading skeleton forever rather than an empty-state message - the same shape of gap `ReleaseDocumentsCounter`'s dash has, one row up.",
      },
    },
  },
  render: () => (
    <Stage>
      <ScheduledDraftDocumentPreview
        datum={scheduledDraftRelease}
        cellProps={cellProps}
        sorting={false}
      />
    </Stage>
  ),
}
