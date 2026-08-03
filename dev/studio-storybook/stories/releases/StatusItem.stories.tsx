import {type User} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {UserColorManagerContext} from 'sanity/_singletons'

import {RelativeTime} from '../../../../packages/sanity/src/core/components/RelativeTime'
import {
  AvatarSkeleton,
  UserAvatar,
} from '../../../../packages/sanity/src/core/components/userAvatar/UserAvatar'
import {StatusItem} from '../../../../packages/sanity/src/core/releases/tool/components/StatusItem'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'
import {WithStudioProviders} from '../../lib/testProvider'

// UserAvatar resolves its hue through the UserColorManager context. These stories pass
// fully-resolved `User` objects rather than ids, so no user store is needed - only the
// colour manager. Same approach as Lists & Data/UserAvatar.
const colorManager = createUserColorManager({scheme: 'dark'})
const WithUserColor: Decorator = (Story) => (
  <UserColorManagerContext.Provider value={colorManager}>
    <Story />
  </UserColorManagerContext.Provider>
)

/**
 * StatusItem itself needs nothing at all - it is layout. What needs the studio stack is what
 * gets PUT in it: the real call site passes a live `RelativeTime`, and that reads the locale
 * through Sanity's own `LocaleContext` (not react-i18next's), which only `WithStudioProviders`
 * supplies. Leave it out and the two stories with a timestamp in them render nothing while the
 * two without one render fine, which is a confusing way to find out.
 */
const decorators = [WithUserColor, WithStudioProviders()]

const ada: User = {id: 'ada', displayName: 'Ada Okafor', email: 'ada@example.com'}
const bo: User = {id: 'bo', displayName: 'Bo Lindqvist', email: 'bo@example.com'}

const meta: Meta<typeof StatusItem> = {
  title: 'Releases/Status Item',
  component: StatusItem,
  decorators,
  args: {text: 'Created 2 days ago'},
  parameters: {
    docs: {
      description: {
        component: [
          'Twenty lines of layout with no logic in it at all, storied anyway because the ' +
            'alignment it performs is finicky and easy to get subtly wrong by hand.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/components/StatusItem.tsx` |',
          '| Tier | CHROME |',
          '',
          'One line of "who did what, when" in the footer of a release dashboard: an optional ' +
            'avatar, a muted line of text, nothing else. `ReleaseStatusItems` above it renders two ' +
            'of these side by side and depends on both matching exactly.',
          '',
          '> **Why it matters:** with an avatar the text gets a smaller left padding than usual, ' +
            'and the avatar box carries a small negative margin on an inner element. Both exist to ' +
            'pull the avatar and the text onto a shared optical baseline, because an avatar is a ' +
            'circle and text is not: aligning their bounding boxes leaves the circle looking low. ' +
            'That negative margin is the kind of correction that gets deleted by anyone tidying up ' +
            'who has not seen the two variants next to each other, which is exactly what the ' +
            'first story below is for.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:releases', 'chapter:cms', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof StatusItem>

export const WithAndWithoutAvatar: Story = {
  name: 'With and without an avatar',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The two forms, stacked so the compensating padding is visible. Both lines of text start at the same optical position despite one of them having a 21px avatar in front of it - that is the `paddingLeft` swap doing its job. Cover the avatar and the two rows still read as a column.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={2} style={{maxWidth: 320}}>
      <Stack gap={1}>
        <StatusItem avatar={<UserAvatar size={0} user={ada} />} text="Created by Ada, 2 days ago" />
        <StatusItem text="Created 2 days ago" />
      </Stack>
    </Card>
  ),
}

export const LoadingAvatar: Story = {
  name: 'Before the author is known',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The release dashboard renders its footer before the event log has loaded, so it has a timestamp but not yet an author. Rather than shift the layout when the avatar arrives, it renders an `AvatarSkeleton` of the same size - the row is laid out once and stays put.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={2} style={{maxWidth: 320}}>
      <StatusItem avatar={<AvatarSkeleton $size={0} />} text="Created 2 days ago" />
    </Card>
  ),
}

export const RichText: Story = {
  name: 'A composed text node',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          '`text` is a `ReactNode`, not a string, which is what lets the real call site put a live `RelativeTime` inside it. The timestamp keeps itself current without the status item knowing anything about time.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={2} style={{maxWidth: 320}}>
      <StatusItem
        avatar={<UserAvatar size={0} user={bo} />}
        text={
          <>
            Published <RelativeTime time="2026-07-24T09:15:00Z" useTemporalPhrase minimal />
          </>
        }
      />
    </Card>
  ),
}

export const InContext: Story = {
  name: 'In context - a release dashboard footer',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'What `ReleaseStatusItems` builds: at most two of these in a row, the creation event and then whichever one of publish, archive or unarchive happened last. It is a deliberately short history - the footer answers "who made this and what became of it", and the full event list lives in the activity panel.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={2}>
      <Flex flex={1} gap={1}>
        <StatusItem
          testId="status-createRelease"
          avatar={<UserAvatar size={0} user={ada} />}
          text={
            <>
              Created <RelativeTime time="2026-07-18T11:00:00Z" useTemporalPhrase minimal />
            </>
          }
        />
        <StatusItem
          testId="status-publishRelease"
          avatar={<UserAvatar size={0} user={bo} />}
          text={
            <>
              Published <RelativeTime time="2026-07-24T09:15:00Z" useTemporalPhrase minimal />
            </>
          }
        />
      </Flex>
    </Card>
  ),
}
