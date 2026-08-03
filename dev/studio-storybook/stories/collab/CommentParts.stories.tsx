import {type CurrentUser, type User} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {CommentsAvatar} from '../../../../packages/sanity/src/core/comments/components/avatars/CommentsAvatar'
import {CommentBreadcrumbs} from '../../../../packages/sanity/src/core/comments/components/CommentBreadcrumbs'
import {CommentDeleteDialog} from '../../../../packages/sanity/src/core/comments/components/CommentDeleteDialog'
import {CommentReactionsBar} from '../../../../packages/sanity/src/core/comments/components/reactions/CommentReactionsBar'
import {type CommentReactionItem} from '../../../../packages/sanity/src/core/comments/types'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'

const ada: User = {id: 'ada', displayName: 'Ada Okafor', email: 'ada@example.com'}
const bo: User = {id: 'bo', displayName: 'Bo Lindqvist', email: 'bo@example.com'}
const mira: User = {id: 'mira', displayName: 'Mira Haddad', email: 'mira@example.com'}
const prince: User = {id: 'prince', displayName: 'Prince', email: 'prince@example.com'}

const currentUser: CurrentUser = {
  id: 'ada',
  name: 'Ada Okafor',
  email: 'ada@example.com',
  // oxlint-disable-next-line no-deprecated -- role remains a required (if deprecated) field on CurrentUser; roles is also provided
  role: '',
  roles: [],
}

const reaction = (shortName: string, userId: string): CommentReactionItem =>
  ({shortName, userId, _key: `${shortName}-${userId}`, addedAt: '2026-07-24T10:00:00Z'}) as never

const meta: Meta = {
  title: 'Collaboration/Comment Parts',
  decorators: [WithStudioProviders()],
  parameters: {
    // Each story is a fixed illustration of one part; no shared component prop type to
    // control from a meta-level panel.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A comment thread is assembled from four small pieces, and each one holds a decision ' +
            'of its own: the author avatar, the field breadcrumb, the reactions bar, and the ' +
            'delete confirmation.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/comments/components/` |',
          '| Tier | CHROME |',
          '',
          'The thread itself is already storied under CMS Patterns/Comments. These are the ' +
            'parts it composes.',
          '',
          '> **Why it matters:** comments in a studio are anchored to a field, not to a ' +
            'document, and that single fact shapes three of these four components. The breadcrumb ' +
            'exists because a comment several levels deep into a document is meaningless without ' +
            'its path. It elides the middle rather than the end, because the first and last ' +
            'segments carry the most meaning, the document type you are in and the field you are ' +
            'on, while the middle is array indices nobody reads. And the elision is not a ' +
            'truncation: the hidden segments go into a tooltip, so the path is folded rather than ' +
            'lost.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:cms', 'pattern:collaboration', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Avatars: Story = {
  name: 'CommentsAvatar - initials from a name',
  parameters: {
    docs: {
      description: {
        story:
          'Deriving initials looks trivial and is not. The regexes are Unicode property escapes (`\\p{Alpha}`, `\\p{White_Space}`) rather than `[A-Za-z]` and `\\s`, so a name in any script produces initials rather than an empty avatar - the ASCII version silently returns nothing for most of the world.\n\nThe rule is first-and-last, not first-two, so a middle name does not displace the family name. And a single-word name yields one initial rather than a padded pair. Note "Prince" below.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      {[ada, bo, mira, prince].map((user) => (
        <Stack key={user.id} gap={3} style={{textAlign: 'center', minWidth: 110}}>
          <Flex justify="center">
            <CommentsAvatar user={user} size={1} />
          </Flex>
          <Text size={0} muted>
            {user.displayName}
          </Text>
        </Stack>
      ))}
      <Stack gap={3} style={{textAlign: 'center', minWidth: 110}}>
        <Flex justify="center">
          <CommentsAvatar user={null} size={1} />
        </Flex>
        <Text size={0} muted>
          no user
        </Text>
      </Stack>
    </Flex>
  ),
}

export const Breadcrumbs: Story = {
  name: 'CommentBreadcrumbs - a short path',
  parameters: {
    docs: {
      description: {
        story:
          'Under the limit, so every segment is shown. This is where a comment lives: not "on ' +
          'this document" but on one field inside it. The thread header spends its width on a ' +
          'path.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={3}>
      <CommentBreadcrumbs titlePath={['Article', 'Title']} maxLength={4} />
    </Card>
  ),
}

export const BreadcrumbsElided: Story = {
  name: 'CommentBreadcrumbs - the middle folded away',
  parameters: {
    docs: {
      description: {
        story:
          'Past the limit, and the interesting behaviour appears. The component keeps `ceil(max/2) - 1` segments from the front and `floor(max/2)` from the back, and collapses everything between them into a single `...` carrying the hidden segments in a tooltip. Hover it.\n\nEliding the MIDDLE is the decision. A conventional truncation would drop the tail, which here is the field you actually commented on - the one segment that cannot be guessed. The front and back are the orienting information; the middle is array indices and object wrappers.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={3}>
      <CommentBreadcrumbs
        titlePath={['Article', 'Content', 'Section', '2', 'Call to action', 'Heading']}
        maxLength={4}
      />
    </Card>
  ),
}

export const Reactions: Story = {
  name: 'CommentReactionsBar',
  parameters: {
    docs: {
      description: {
        story:
          'Reactions grouped by emoji with a count, plus the add-reaction button. Two details worth noticing.\n\nThe grouping is **sorted by first appearance** rather than by count, and the source says why: sorting by count means the row reorders itself whenever anybody reacts, so the button you were about to click moves out from under your cursor. Stable order beats useful order for a control you interact with.\n\nAnd hovering a group names the people in it. A count answers "how many"; the tooltip answers "who", which in a review thread is the question actually being asked.',
      },
    },
  },
  render: function ReactionsStory() {
    const [reactions, setReactions] = useState<CommentReactionItem[]>([
      reaction(':+1:', 'bo'),
      reaction(':+1:', 'mira'),
      reaction(':heart:', 'ada'),
      reaction(':eyes:', 'bo'),
    ])
    return (
      <Card border radius={2} padding={2} style={{maxWidth: 420}}>
        <CommentReactionsBar
          currentUser={currentUser}
          mode="default"
          reactions={reactions}
          onSelect={(option) => {
            setReactions((current) => {
              const mine = current.find(
                (r) => r.shortName === option.shortName && r.userId === currentUser.id,
              )
              return mine
                ? current.filter((r) => r !== mine)
                : [...current, reaction(option.shortName, currentUser.id)]
            })
          }}
        />
      </Card>
    )
  },
}

export const ReactionsEmpty: Story = {
  name: 'CommentReactionsBar - nothing yet',
  parameters: {
    docs: {
      description: {
        story:
          'With no reactions the bar collapses to just the add button. Storied because the empty state of a reactions row is where most implementations either reserve dead space or vanish entirely, and this one does neither - the affordance stays, at its minimum size.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={2} style={{maxWidth: 420}}>
      <CommentReactionsBar
        currentUser={currentUser}
        mode="default"
        reactions={[]}
        onSelect={() => undefined}
      />
    </Card>
  ),
}

export const DeleteThread: Story = {
  name: 'CommentDeleteDialog - deleting a thread',
  parameters: {
    docs: {
      description: {
        story:
          'Deleting the FIRST comment in a thread deletes the whole thread, and the dialog says so. `isParent` swaps every string - title, body and confirm label - rather than showing one generic message with a caveat.\n\nThat is the right shape for a destructive confirm: the difference between losing one comment and losing a conversation is exactly what the reader needs to weigh, and burying it in a subclause is how people delete things they meant to keep.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <CommentDeleteDialog
        commentId="c1"
        error={null}
        isParent
        loading={false}
        onClose={() => undefined}
        onConfirm={() => undefined}
      />
    ),
}

export const DeleteComment: Story = {
  name: 'CommentDeleteDialog - deleting one reply',
  parameters: {
    docs: {
      description: {
        story:
          'The same dialog with `isParent: false`. Read the two side by side in the canvas: same layout, same critical confirm, entirely different stakes, and the copy is the only thing carrying that.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <CommentDeleteDialog
        commentId="c2"
        error={null}
        isParent={false}
        loading={false}
        onClose={() => undefined}
        onConfirm={() => undefined}
      />
    ),
}

export const DeleteFailed: Story = {
  name: 'CommentDeleteDialog - the delete failed',
  parameters: {
    docs: {
      description: {
        story:
          'The error branch, which is the state most confirm dialogs never implement. The dialog stays open with the failure shown inside it rather than closing and firing a toast - correct, because the action did not happen and closing would imply it had.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <CommentDeleteDialog
        commentId="c1"
        error={new Error('Network request failed')}
        isParent
        loading={false}
        onClose={() => undefined}
        onConfirm={() => undefined}
      />
    ),
}
