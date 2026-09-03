import {type User} from '@sanity/types'
import {type AvatarSize, type AvatarStatus, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {UserAvatar} from '../UserAvatar'

const ada: User = {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@example.com'}
const grace: User = {id: 'grace', displayName: 'Grace Hopper', email: 'grace@example.com'}
const alan: User = {id: 'alan', displayName: 'Alan Turing', email: 'alan@example.com'}
const katherine: User = {id: 'kat', displayName: 'Katherine Johnson', email: 'kat@example.com'}
const prince: User = {id: 'prince', displayName: 'Prince', email: 'prince@example.com'}
const ROSTER = [ada, grace, alan, katherine, prince]

const SIZES: AvatarSize[] = [0, 1, 2, 3]
const STATUSES: AvatarStatus[] = ['online', 'editing', 'inactive']

// An inline SVG so the image path renders without a network request.
const PIXEL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#556" /></svg>',
  )
const adaWithImage: User = {...ada, imageUrl: PIXEL}

function Labelled(props: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2} style={{textAlign: 'center'}}>
      <Flex justify="center">{props.children}</Flex>
      <Text muted size={0}>
        {props.label}
      </Text>
    </Stack>
  )
}

/**
 * The avatar behind every presence surface in the studio. Given a resolved
 * `User` it renders the `@sanity/ui` `Avatar` with the user's image, or
 * initials generated from `displayName` when there is none, coloured by the
 * `UserColorManager` so the same person keeps the same hue everywhere. Given a
 * bare user id it loads the user through the user store and shows a sized
 * skeleton while pending. `status` adds the presence dot and `withTooltip`
 * wraps it in the studio `Tooltip` showing the display name. Rendered inside
 * `TestWrapper` for the colour manager; every story passes a resolved user, so
 * the store is never hit.
 */
const meta = {
  title: 'Core Components/User Avatar',
  component: UserAvatar,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
  args: {user: ada},
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof UserAvatar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The size scale, one colour per user, the initials fallback beside an image
 * (a single name yields one initial), the presence states, and an overlapped
 * roster as the navbar and document header stack them.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5}>
      <Flex align="center" gap={4}>
        {SIZES.map((size) => (
          <Labelled key={size} label={`size ${size}`}>
            <UserAvatar size={size} user={grace} />
          </Labelled>
        ))}
      </Flex>
      <Flex align="center" gap={3} wrap="wrap">
        {ROSTER.map((user) => (
          <Labelled key={user.id} label={user.displayName ?? user.id}>
            <UserAvatar size={2} user={user} />
          </Labelled>
        ))}
      </Flex>
      <Flex align="center" gap={4}>
        <Labelled label="two names">
          <UserAvatar size={2} user={ada} />
        </Labelled>
        <Labelled label="single name">
          <UserAvatar size={2} user={prince} />
        </Labelled>
        <Labelled label="imageUrl">
          <UserAvatar size={2} user={adaWithImage} />
        </Labelled>
      </Flex>
      <Flex align="center" gap={4}>
        <Labelled label="no status">
          <UserAvatar size={2} user={ada} />
        </Labelled>
        {STATUSES.map((status) => (
          <Labelled key={status} label={status}>
            <UserAvatar size={2} status={status} user={ada} />
          </Labelled>
        ))}
      </Flex>
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 420}}>
        <Flex align="center" gap={4} justify="space-between">
          <Stack gap={2}>
            <Text muted size={0} weight="medium">
              Book
            </Text>
            <Text size={2} weight="semibold">
              Anna Karenina
            </Text>
          </Stack>
          <Flex align="center">
            {ROSTER.map((user, index) => (
              <div key={user.id} style={{marginLeft: index === 0 ? 0 : -6}}>
                <UserAvatar size={1} status={index < 2 ? 'editing' : 'online'} user={user} />
              </div>
            ))}
          </Flex>
        </Flex>
      </Card>
    </Stack>
  ),
}

/**
 * `withTooltip` wraps the avatar in the studio tooltip. The `play` function
 * hovers it so the open tooltip is captured.
 */
export const WithTooltip: Story = {
  args: {size: 2, user: katherine, withTooltip: true},
  render: (args) => (
    <Flex align="center" justify="center" style={{minHeight: 160}}>
      <UserAvatar {...args} />
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByText('KJ'))
    // The tooltip portals to document.body and opens after the shared delay
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Katherine Johnson')).toBeVisible(), {
      timeout: 3000,
    })
  },
}
