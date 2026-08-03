import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from a real path (org contract §8).
import {CommentsListStatus} from '../../../../packages/sanity/src/core/comments/components/list/CommentsListStatus'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── The four branches, read from the source ────────────────────────────────
   `CommentsListStatus.tsx` checks, in this order (lines 38, 50, 54):

     if (error) return <Flex ...><Text>{t('list-status.error')}</Text></Flex>
     if (loading) return <LoadingBlock showText title={t('list-status.loading')} />
     if (hasNoComments) return <Flex ...><Text>{emptyStateMessages[status].title}</Text>
                                  <Text>{emptyStateMessages[status].message}</Text></Flex>
     return null

   The `hasNoComments` branch reads `emptyStateMessages[status]`, a two-entry record keyed by
   `CommentStatus` ('open' | 'resolved'), so it produces two distinct appearances rather than one.
   Four return statements, five distinct appearances: error, loading, empty-open, empty-resolved,
   and nothing (the fourth statement, reached once real comments exist - the caller,
   `CommentsList.tsx`, renders its own list past this point). */

function Panel({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} overflow="hidden" style={{width: 320, height: 200, display: 'flex'}}>
      {children}
    </Card>
  )
}

const meta: Meta = {
  title: 'Collaboration/Comments List Status',
  decorators: [WithStudioProviders()],
  parameters: {
    // Every story fixes error/loading/hasNoComments/status to demonstrate one branch of the
    // ladder; controls would let a reader assemble a combination the source cannot reach.
    controls: {include: []},
    docs: {
      description: {
        component: [
          "The status slot at the top of a document's comments list is what shows in place of " +
            'the thread list while it errors, loads, or has nothing in it yet.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/comments/components/list/CommentsListStatus.tsx` |',
          '| Tier | CHROME. It never renders a comment itself, only the states around the absence of one |',
          '',
          'It is a pure `if`-ladder over four flags (`error`, `loading`, `hasNoComments`, `status`), checked in that order, with no memo and no local state. The empty-state copy branches again on `status` (`open` vs `resolved`), so the same `hasNoComments` flag produces two different messages depending on which tab the reader is looking at.',
          '',
          '> **Why the order matters:** the parent list component derives its empty flag from the thread count alone, independent of whether a fetch is in flight, so while a first fetch is loading there are no comments yet, and the empty flag is already true by the time the loading flag is also true. Checking the error and loading branches before the empty-comments branch is what keeps a loading list from flashing an empty-state message before its first paint.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:cms', 'pattern:empty-states', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Error_: Story = {
  name: 'Error',
  parameters: {
    docs: {
      description: {
        story:
          "The error branch (source line 38). Its text is a fixed generic sentence, `t('list-status.error')` - the passed-in `Error` object is never read for a message, so any `Error` produces the same copy. Checked before `loading` and `hasNoComments`, so a stale error from a previous fetch outranks both, however those flags are set on the next render.",
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsListStatus
        error={new Error('The comments dataset could not be reached (404).')}
        hasNoComments={false}
        loading={false}
        status="open"
      />
    </Panel>
  ),
}

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The loading branch (source line 50): `LoadingBlock`, not the `Flex`/`Text` shape the other three branches share. It is the only branch that delegates to a shared primitive instead of composing its own layout inline.',
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsListStatus error={null} hasNoComments={false} loading status="open" />
    </Panel>
  ),
}

export const EmptyOpen: Story = {
  name: 'Empty - open',
  parameters: {
    docs: {
      description: {
        story:
          'The empty-state branch (source line 54) with `status="open"`: "No open comments yet." / "Open comments on this document will be shown here." This is what a reader sees on a document with zero comments at all, since it opens on the open tab.',
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsListStatus error={null} hasNoComments loading={false} status="open" />
    </Panel>
  ),
}

export const EmptyResolved: Story = {
  name: 'Empty - resolved',
  parameters: {
    docs: {
      description: {
        story:
          'The same branch with `status="resolved"`: "No resolved comments yet." / "Resolved comments on this document will be shown here." Reached by switching to the resolved tab on a document where every thread is still open (or there are none).',
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsListStatus error={null} hasNoComments loading={false} status="resolved" />
    </Panel>
  ),
}

export const HasComments: Story = {
  name: 'Has comments (renders nothing)',
  parameters: {
    docs: {
      description: {
        story:
          'The fourth return, `null` (source line 72). Reached once `error`, `loading` and `hasNoComments` are all falsy - the ordinary case once a thread exists. This component draws nothing at that point; `CommentsList.tsx` renders the actual thread list past it. The frame below is empty by design, not a broken story.',
      },
    },
  },
  render: () => (
    <Stack gap={2}>
      <Panel>
        <CommentsListStatus error={null} hasNoComments={false} loading={false} status="open" />
      </Panel>
      <Text size={0} muted>
        (nothing rendered here - the thread list takes over)
      </Text>
    </Stack>
  ),
}

export const Matrix: Story = {
  name: 'All states',
  // Enumeration story: the docs canvas is 540px and this content is 1205px tall, so
  // 665px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {
    docs: {
      story: {height: '1229px'},
      description: {
        story:
          'All five appearances side by side: the four visible branches, plus a labeled stand-in for the null return.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      {(
        [
          {
            label: 'error',
            node: (
              <CommentsListStatus
                error={new Error('The comments dataset could not be reached (404).')}
                hasNoComments={false}
                loading={false}
                status="open"
              />
            ),
          },
          {
            label: 'loading',
            node: <CommentsListStatus error={null} hasNoComments={false} loading status="open" />,
          },
          {
            label: 'empty, status="open"',
            node: <CommentsListStatus error={null} hasNoComments loading={false} status="open" />,
          },
          {
            label: 'empty, status="resolved"',
            node: (
              <CommentsListStatus error={null} hasNoComments loading={false} status="resolved" />
            ),
          },
        ] as const
      ).map(({label, node}) => (
        <Stack key={label} gap={2}>
          <Text size={0} muted weight="semibold">
            {label}
          </Text>
          <Panel>{node}</Panel>
        </Stack>
      ))}
      <Stack gap={2}>
        <Text size={0} muted weight="semibold">
          has comments (returns null)
        </Text>
        <Panel>
          <CommentsListStatus error={null} hasNoComments={false} loading={false} status="open" />
        </Panel>
      </Stack>
    </Stack>
  ),
}

export const InContext: Story = {
  name: 'In context - above an empty thread list',
  parameters: {
    docs: {
      description: {
        story:
          'The empty-open state as it sits in `CommentsList.tsx`: this component fills the space where threads would otherwise be, inside the same `flex={1}` column the real list scrolls in.',
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsListStatus error={null} hasNoComments loading={false} status="open" />
    </Panel>
  ),
}
