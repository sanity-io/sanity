import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {type DocumentGroupEvent} from '../../../../packages/sanity/src/core/store/events/types'
import {EventsTimeline} from '../../../../packages/sanity/src/structure/panes/document/timeline/events/EventsTimeline'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

const AUTHORS = ['p-ada', 'p-bo', 'p-mira']

/**
 * Fixed timestamps, descending. The timeline renders relative times ("2 days ago"), so pinned
 * instants keep the stories readable without making them lie about ordering - the newest event is
 * genuinely newest, it is just always the same distance from a moving now.
 */
const at = (daysAgo: number, hour = 9) =>
  new Date(Date.UTC(2026, 6, 24 - daysAgo, hour, 30)).toISOString()

const event = (
  id: string,
  type: string,
  daysAgo: number,
  extra: Record<string, unknown> = {},
): DocumentGroupEvent =>
  ({
    id,
    type,
    timestamp: at(daysAgo),
    author: AUTHORS[Number(id.slice(-1)) % AUTHORS.length],
    documentVariantType: 'draft',
    documentId: 'article-launch',
    revisionId: `rev-${id}`,
    versionId: 'article-launch',
    versionRevisionId: `vrev-${id}`,
    ...extra,
  }) as unknown as DocumentGroupEvent

const HISTORY: DocumentGroupEvent[] = [
  event('e1', 'editDocumentVersion', 0, {
    contributors: ['p-ada', 'p-bo'],
    transactions: [{type: 'editTransaction', author: 'p-ada', timestamp: at(0), revisionId: 'r1'}],
  }),
  event('e2', 'publishDocumentVersion', 1, {publishCause: 'document.publish'}),
  event('e3', 'editDocumentVersion', 2, {
    contributors: ['p-mira'],
    transactions: [{type: 'editTransaction', author: 'p-mira', timestamp: at(2), revisionId: 'r3'}],
  }),
  event('e4', 'publishDocumentVersion', 5, {publishCause: 'release.publish', releaseId: 'rAsap'}),
  event('e5', 'createDocumentVersion', 9),
]

function Frame({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} shadow={1} style={{width: 340, overflow: 'hidden'}}>
      {children}
    </Card>
  )
}

const meta: Meta<typeof EventsTimeline> = {
  title: 'Document Status/Events Timeline',
  component: EventsTimeline,
  decorators: [WithStudioProviders()],
  args: {
    events: HISTORY,
    hasMoreEvents: false,
    onLoadMore: noop,
    onSelect: noop,
    listMaxHeight: '380px',
  },
  parameters: {
    docs: {
      description: {
        component: [
          'A single editing session produces dozens of mutations, and showing them raw would ' +
            'bury a publish event under forty keystroke transactions, so the design decision ' +
            'that makes this panel usable is merging.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/timeline/events/EventsTimeline.tsx` |',
          '| Tier | SERVICE |',
          '| Patterns | `undo-timeline` · `draft-publish-lifecycle` |',
          '',
          'The revision history panel: every publish, edit, unpublish and schedule that has ' +
            'happened to a document, newest first, and the control for jumping back to any of ' +
            'them. Entirely prop-driven: an array of events, a selected id, and two callbacks. ' +
            'No store, no query.',
          '',
          'Events are typed rather than free-text: `publishDocumentVersion` carries a ' +
            '`publishCause` distinguishing a manual publish from a release publish from a ' +
            'scheduled one. The same visible action has three different meanings, and the ' +
            'history knows which.',
          '',
          "> **Why it matters:** this is the studio's answer to what happened to this document " +
            'and can I go back. Consecutive edits by the same people collapse into one row ' +
            'carrying every contributor and the transactions inside it, "Ada and Bo edited ' +
            'this", expandable to the detail. The timeline is a summary of history rather than ' +
            'a log of it, and that is the difference between a panel an editor uses and one ' +
            'they scroll past.',
          '',
          'Harness note: timestamps are pinned to fixed instants. The panel renders relative ' +
            'times, so the labels drift as the real clock moves; the ordering and the merging, ' +
            'which are what the stories are about, do not.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:undo-timeline',
    'pattern:draft-publish-lifecycle',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof EventsTimeline>

export const Default: Story = {
  name: 'A document with history',
  parameters: {
    docs: {
      description: {
        story:
          'Five events, newest first: an edit, a publish, another edit, a release publish, and the original creation. Read the two publish rows against each other - one was a person pressing Publish, the other was a release going out, and they say so.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <EventsTimeline {...args} />
    </Frame>
  ),
}

export const WithSelection: Story = {
  name: 'An event selected',
  parameters: {
    docs: {
      description: {
        story:
          'Selecting an event is how you look at the document as it was at that moment. Click the rows: selection is stateful here, so the panel behaves as it does in the studio rather than posing.\n\nThe selected row is marked rather than merely highlighted, because this selection changes what the whole document pane beside it is showing - a subtle hover-style treatment would under-report the consequence.',
      },
    },
  },
  render: function SelectionStory(args) {
    const [selected, setSelected] = useState<string | undefined>('e2')
    return (
      <Frame>
        <EventsTimeline
          {...args}
          selectedEventId={selected}
          onSelect={(evt) => setSelected((evt as {id: string}).id)}
        />
      </Frame>
    )
  },
}

export const HasMore: Story = {
  name: 'More history available',
  args: {hasMoreEvents: true},
  parameters: {
    docs: {
      description: {
        story:
          'With `hasMoreEvents`, the list offers to fetch older events rather than pretending the history ends. Paginating history is not optional at scale - a document edited daily for two years has thousands of events - and the panel is honest that what you are looking at is a window.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <EventsTimeline {...args} />
    </Frame>
  ),
}

export const SingleEvent: Story = {
  name: 'A newly created document',
  args: {events: [HISTORY[4]]},
  parameters: {
    docs: {
      description: {
        story:
          'One event, because the document was just created. The panel renders it as a normal row rather than substituting an empty state - correct, since "created" is real history and the shortest possible true answer.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <EventsTimeline {...args} />
    </Frame>
  ),
}

export const Empty: Story = {
  name: 'No events',
  args: {events: []},
  parameters: {
    docs: {
      description: {
        story:
          'An empty event list. Storied to pin what the panel does with nothing to show, which in a history view is a state you reach whenever the event log has not loaded yet or has been cleared.',
      },
    },
  },
  render: (args) => (
    <Stack gap={3}>
      <Frame>
        <EventsTimeline {...args} />
      </Frame>
      <Text size={0} muted>
        the frame is the story boundary; whatever is inside it is the panel&apos;s own empty state
      </Text>
    </Stack>
  ),
}

export const LongHistory: Story = {
  name: 'A long history, scrolling',
  args: {
    events: [
      ...HISTORY,
      ...Array.from({length: 14}, (_v, i) =>
        event(`x${i}`, i % 3 === 0 ? 'publishDocumentVersion' : 'editDocumentVersion', 10 + i, {
          publishCause: 'document.publish',
          contributors: [AUTHORS[i % 3]],
          transactions: [
            {
              type: 'editTransaction',
              author: AUTHORS[i % 3],
              timestamp: at(10 + i),
              revisionId: `rx${i}`,
            },
          ],
        }),
      ),
    ],
    hasMoreEvents: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Nineteen events against a `listMaxHeight`, which is where the panel spends most of its real life. Scroll it: the height is a prop rather than a fixed value, because the panel shares a pane with a document header whose height varies.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <EventsTimeline {...args} />
    </Frame>
  ),
}
