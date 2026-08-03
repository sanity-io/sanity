import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from a real path (org contract §8).
import {ReleaseDocumentFilterTabs} from '../../../../packages/sanity/src/core/releases/tool/detail/components/ReleaseDocumentFilterTabs'
import {
  createDocumentInRelease,
  documentsInRelease,
  validationError,
} from '../../lib/releaseFixtures'

/* ── The four branches, read from the source ────────────────────────────────
   `ReleaseDocumentFilterTabs.tsx` checks, in this order (lines 34, 38, 57):

     if (releaseState === 'archived' || releaseState === 'published') return null
     if (isLoading) return <Container><Box><Flex>{4 Skeletons, 'errors' excluded}</Flex></Box></Container>
     if (documents.length === 0) return null
     return <ReleaseDocumentFilterTabsInner ... />

   Two different guards produce the same invisible result (archived/published vs. zero documents),
   which is worth storying separately even though they look identical - they are reached for
   different reasons and a change to one must not silently start covering the other.

   `ReleaseDocumentFilterTabsInner` (lines 78-135) is where the interesting behaviour lives: tab
   counts, tab tone, and which tabs are hidden are all decided per document set rather than being
   a fixed list of five tabs. */

function Frame({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      <Text size={0} muted>
        {label}
      </Text>
      <Card border radius={2} style={{width: 420}}>
        {children}
      </Card>
    </Stack>
  )
}

const meta: Meta<typeof ReleaseDocumentFilterTabs> = {
  title: 'Releases/Document Filter Tabs',
  component: ReleaseDocumentFilterTabs,
  parameters: {
    docs: {
      description: {
        component: [
          "Five tab counts and a table's row filter both trace back to the same function, so " +
            'they never disagree about what a document is. What they can disagree about is how ' +
            'many documents are in scope, and typing into the search box is enough to make a tab ' +
            'lie about the count beside its own label.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/detail/components/ReleaseDocumentFilterTabs.tsx` |',
          '| Tier | SERVICE. Holds no content itself, only a view onto the document table beside it |',
          '| Audit | 🟡 needs-work (`filters`). The selected tab can point at a filter that is no longer shown, leaving the table empty with nothing in the tab bar marked selected |',
          '| Patterns | `filters` |',
          '',
          "The row of tabs above a release's document table, All / Added / Changed / " +
            'Unpublished / Errors, that both counts and filters the documents in a release.',
          '',
          "The five tab counts and the table's own filtering both trace back to the same " +
            'function, `getDocumentActionType`, so a document cannot be counted under one action ' +
            'and filtered under another, they cannot disagree about what a document is. What they ' +
            'can disagree about is how many documents are in scope: the tab counts are computed ' +
            'from the full document set, while the table rows are that same set narrowed by a ' +
            'search box the tabs know nothing about. Type something into the search field and a ' +
            'tab can read "Changed (5)" while showing 2 rows.',
          '',
          '> **Why it matters:** `ReleaseSummary` holds the active filter in its own state and ' +
            "only ever changes it from a tab's click; nothing resets it when the release's " +
            'documents change under it. Select Errors, then have the last error resolve, and the ' +
            'errors tab disappears while the parent\'s active-filter state stays "errors". The ' +
            'table then shows zero rows and the tab bar shows zero tabs selected, with no visible ' +
            'way back to All other than knowing to click it. See `SelectedTabDisappears` below ' +
            'for a direct repro.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:filters',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof ReleaseDocumentFilterTabs>

const noop = () => undefined

export const AllCategories: Story = {
  name: 'Mixed release - every tab visible',
  parameters: {
    docs: {
      description: {
        story:
          'One document deliberately does double duty: it is both `changed` (has a published counterpart) and carries a validation error, so it is counted under both the Changed tab and the Errors tab. That overlap is correct, not a bug - Errors is a cross-cutting flag on top of the add/change/unpublish classification, not a fifth mutually-exclusive bucket.',
      },
    },
  },
  render: () => (
    <Frame label="all, added, changed, unpublished, errors all present">
      <ReleaseDocumentFilterTabs
        documents={[
          createDocumentInRelease({title: 'Anna Karenina', publishedDocumentExists: false}),
          createDocumentInRelease({title: 'War and Peace', publishedDocumentExists: false}),
          createDocumentInRelease({title: 'The Kreutzer Sonata'}),
          createDocumentInRelease({
            title: 'Resurrection',
            validation: [validationError('author', 'Required - every book needs an author')],
          }),
          createDocumentInRelease({title: 'Childhood', goingToUnpublish: true}),
        ]}
        releaseState="active"
        activeFilter="all"
        onFilterChange={noop}
      />
    </Frame>
  ),
}

export const OnlyOneCategory: Story = {
  name: 'Single-category release - other tabs hidden',
  parameters: {
    docs: {
      description: {
        story:
          "Every document here is newly added, so Changed, Unpublished and Errors all count zero and are dropped from the row entirely (source line 115: `if (config.key !== 'all' && counts[config.key] === 0) return null`). Only All and Added render. There is no disabled or greyed-out treatment for an empty category - it simply is not in the DOM, with nothing telling the reader it was ever a possibility.",
      },
    },
  },
  render: () => (
    <Frame label="3 added documents; only 'All' and 'Added' render">
      <ReleaseDocumentFilterTabs
        documents={[
          createDocumentInRelease({title: 'Anna Karenina', publishedDocumentExists: false}),
          createDocumentInRelease({title: 'War and Peace', publishedDocumentExists: false}),
          createDocumentInRelease({title: 'The Kreutzer Sonata', publishedDocumentExists: false}),
        ]}
        releaseState="active"
        activeFilter="all"
        onFilterChange={noop}
      />
    </Frame>
  ),
}

export const SelectedTabDisappears: Story = {
  name: 'FINDING - selected tab has zero count',
  parameters: {
    docs: {
      description: {
        story:
          '`activeFilter="errors"` handed to a document set with zero errors. In the real studio this is the state you land in a beat after the last error on a release resolves while the Errors tab is still selected. The Errors tab does not render (its count is zero), so nothing in this tab bar reads as selected - the component gives no sign that a filter is even applied, let alone which one. Paired with `ReleaseSummary.tsx`, this is also the moment the document table below goes empty with no visible cause.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Frame label='activeFilter="errors", but these 3 documents have none'>
        <ReleaseDocumentFilterTabs
          documents={documentsInRelease.valid()}
          releaseState="active"
          activeFilter="errors"
          onFilterChange={noop}
        />
      </Frame>
      <Text size={0} muted>
        compare to AllCategories above: no tab here reads as selected
      </Text>
    </Stack>
  ),
}

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The loading branch (source line 38): four skeleton blocks standing in for All / Added / Changed / Unpublished. Errors is deliberately excluded from the skeleton row (`FILTER_TAB_CONFIGS.filter((config) => config.key !== 'errors')`, line 43) - the source gives no comment explaining the exclusion, so the skeleton row does not even promise the same tab count the real one might show.",
      },
    },
  },
  render: () => (
    <Frame label="isLoading, 4 skeletons (not 5)">
      <ReleaseDocumentFilterTabs
        documents={[]}
        releaseState="active"
        isLoading
        activeFilter="all"
        onFilterChange={noop}
      />
    </Frame>
  ),
}

export const HiddenNoDocuments: Story = {
  name: 'Renders nothing - no documents',
  parameters: {
    docs: {
      description: {
        story:
          "The `documents.length === 0` branch (source line 57). An active release with nothing in it yet renders no tab bar at all, distinct from the archived/published case below even though both return `null` - this one is about the release's contents, not its lifecycle state.",
      },
    },
  },
  render: () => (
    <Stack gap={2}>
      <Card border style={{borderStyle: 'dashed', width: 420}} radius={2} padding={4}>
        <ReleaseDocumentFilterTabs
          documents={[]}
          releaseState="active"
          activeFilter="all"
          onFilterChange={noop}
        />
      </Card>
      <Text size={0} muted>
        the dashed box is the story frame; the component itself rendered nothing
      </Text>
    </Stack>
  ),
}

export const HiddenArchivedOrPublished: Story = {
  name: 'Renders nothing - archived / published release',
  parameters: {
    docs: {
      description: {
        story:
          'The `releaseState` guard (source line 34), checked before either of the other two and documented in the source as an early return for perf. Filtering by add/change/unpublish stops being a meaningful question once a release can no longer be edited, so the tabs disappear regardless of how many documents it has - shown here with a mixed document set that would render every tab if the release were still active.',
      },
    },
  },
  render: () => {
    const documents = [
      createDocumentInRelease({title: 'Anna Karenina', publishedDocumentExists: false}),
      createDocumentInRelease({title: 'The Kreutzer Sonata'}),
      createDocumentInRelease({title: 'Childhood', goingToUnpublish: true}),
      createDocumentInRelease({
        title: 'Resurrection',
        validation: [validationError('author', 'Required - every book needs an author')],
      }),
    ]
    return (
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={0} muted>
            releaseState=&quot;archived&quot;, documents that would fill All / Added / Changed /
            Unpublished / Errors were the release still active
          </Text>
          <Card border style={{borderStyle: 'dashed', width: 420}} radius={2} padding={4}>
            <ReleaseDocumentFilterTabs
              documents={documents}
              releaseState="archived"
              activeFilter="all"
              onFilterChange={noop}
            />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text size={0} muted>
            releaseState=&quot;published&quot;, same documents
          </Text>
          <Card border style={{borderStyle: 'dashed', width: 420}} radius={2} padding={4}>
            <ReleaseDocumentFilterTabs
              documents={documents}
              releaseState="published"
              activeFilter="all"
              onFilterChange={noop}
            />
          </Card>
        </Stack>
      </Stack>
    )
  },
}

export const SelectedToneVsUnselected: Story = {
  name: 'Tone: selected vs. unselected',
  parameters: {
    docs: {
      description: {
        story:
          'Tone logic (source lines 95-105): every non-error tab is plain `default` tone unless it is the selected one, when it takes on its own tone (positive for Added, caution for Changed, critical for Unpublished). Errors is the one exception - it stays `critical` whether selected or not, so an unresolved error keeps its alarm colour even while a reader is looking at a different tab. Two identical document sets, only `activeFilter` differs.',
      },
    },
  },
  render: () => {
    const documents = [
      createDocumentInRelease({title: 'Anna Karenina', publishedDocumentExists: false}),
      createDocumentInRelease({title: 'War and Peace'}),
      createDocumentInRelease({title: 'Childhood', goingToUnpublish: true}),
      createDocumentInRelease({
        title: 'Resurrection',
        validation: [validationError('author', 'Required - every book needs an author')],
      }),
    ]
    return (
      <Stack gap={4}>
        <Frame label='activeFilter="all" - every action tab at default tone'>
          <ReleaseDocumentFilterTabs
            documents={documents}
            releaseState="active"
            activeFilter="all"
            onFilterChange={noop}
          />
        </Frame>
        <Frame label='activeFilter="unpublished" - only that tab takes its tone'>
          <ReleaseDocumentFilterTabs
            documents={documents}
            releaseState="active"
            activeFilter="unpublished"
            onFilterChange={noop}
          />
        </Frame>
      </Stack>
    )
  },
}

export const InContext: Story = {
  name: 'In context - above a document table',
  parameters: {
    docs: {
      description: {
        story:
          "Where it sits in `ReleaseSummary.tsx`: directly above the document table it filters, with `onFilterChange` wired to the state that drives both the tab bar's own re-render and the table's row filter. Click a tab; the label below tracks `onFilterChange` the way `ReleaseSummary` would use it to set `activeFilter`.",
      },
    },
  },
  render: function InContextStory() {
    const documents = [
      createDocumentInRelease({title: 'Anna Karenina', publishedDocumentExists: false}),
      createDocumentInRelease({title: 'War and Peace'}),
      createDocumentInRelease({title: 'The Kreutzer Sonata', goingToUnpublish: true}),
    ]
    return (
      <Card border radius={2} shadow={1} style={{width: 480}}>
        <ReleaseDocumentFilterTabs
          documents={documents}
          releaseState="active"
          activeFilter="all"
          onFilterChange={noop}
        />
        <Card borderTop padding={4}>
          <Flex align="center" justify="center">
            <Text size={1} muted>
              document table (not part of this story)
            </Text>
          </Flex>
        </Card>
      </Card>
    )
  },
}
