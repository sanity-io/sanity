import {type User} from '@sanity/types'
import {type AvatarSize, type AvatarStatus, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {UserColorManagerContext} from 'sanity/_singletons'

// Real component from its real path (org contract §8). UserAvatar resolves a user's
// identity (image or generated initials), a deterministic per-user colour, and an
// optional presence-status dot: the atom behind every presence surface in Studio.
import {UserAvatar} from '../../../../packages/sanity/src/core/components/userAvatar/UserAvatar'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'

// UserAvatar reads its colour from `useUserColor` → the UserColorManager context, which
// the Studio provider stack normally supplies. These stories don't need the whole stack
// (no user store: every story passes a resolved `User` object, not an id), so the one
// missing piece is provided directly. The manager is scheme-fixed here; hues stay legible
// in both themes.
const colorManager = createUserColorManager({scheme: 'dark'})
const WithUserColor: Decorator = (Story) => (
  <UserColorManagerContext.Provider value={colorManager}>
    <Story />
  </UserColorManagerContext.Provider>
)

const ada: User = {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@sanity.io'}
const grace: User = {id: 'grace', displayName: 'Grace Hopper', email: 'grace@sanity.io'}
const alan: User = {id: 'alan', displayName: 'Alan Turing', email: 'alan@sanity.io'}
const katherine: User = {id: 'kat', displayName: 'Katherine Johnson', email: 'kat@sanity.io'}
const prince: User = {id: 'prince', displayName: 'Prince', email: 'prince@sanity.io'}
const roster = [ada, grace, alan, katherine, prince]

/**
 * A 1×1 transparent SVG data URI: a resolvable image so the image-avatar path renders
 * without a network request (the studio's CSP blocks external hosts).
 */
const pixel =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23556" /></svg>',
  )
const adaWithImage: User = {...ada, imageUrl: pixel}

function Labelled({label, children}: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2} style={{textAlign: 'center'}}>
      <Flex justify="center">{children}</Flex>
      <Text size={0} muted>
        {label}
      </Text>
    </Stack>
  )
}

const meta: Meta<typeof UserAvatar> = {
  title: 'Lists & Data/UserAvatar',
  component: UserAvatar,
  decorators: [WithUserColor],
  args: {user: ada, size: 1},
  argTypes: {
    size: {control: 'inline-radio', options: [0, 1, 2, 3]},
    status: {control: 'select', options: [undefined, 'online', 'editing', 'inactive']},
    withTooltip: {control: 'boolean'},
  },
  render: (props) => (
    <Card padding={3} radius={2} shadow={1} style={{display: 'inline-block'}}>
      <UserAvatar {...props} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'Every face in Studio is this one component, and it does more than paint a circle: ' +
            'hand it a resolved user and it works out their identity, assigns them a ' +
            'deterministic colour, and can hang a presence dot in the corner.',
          '',
          '|          |                                                                                                                                                                                                                                                                                                                                                                                 |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/components/userAvatar/UserAvatar.tsx`, Studio-only (no DS equivalent)                                                                                                                                                                                                                                                                                 |',
          '| Tier     | SERVICE. Resolves three things around the `@sanity/ui` `Avatar` primitive: the user (image URL or generated initials), a deterministic per-user colour from the `UserColorManager`, and an optional presence-status dot. Given a bare user id it also loads the user (`useUser`) and shows a sized skeleton while pending                                                       |',
          '| Audit    | 🟢 holds. As an identity-rendering primitive it is solid: legible initials fallback, per-user colour, image-load error recovery, a loading skeleton sized to match. Caveat (`similarity`): its presence-status dot (`online`/`editing`/`inactive`) is signalled by colour alone, the same `collaborative-presence` colour-only trait the audit flagged across presence surfaces |',
          '| Patterns | `collaborative-presence` · `similarity`                                                                                                                                                                                                                                                                                                                                         |',
          '',
          'Hand it a resolved `User` and it works out the identity (their photo, or initials ' +
            'generated from the name when there is no photo), assigns a deterministic colour so ' +
            'the same person is always the same hue across the app, and can hang a ' +
            'presence-status dot in the corner. Hand it a bare user id instead and it loads the ' +
            'user itself and holds a sized skeleton while it waits.',
          '',
          'Passing a `User` object renders immediately; passing a `string` id routes through ' +
            '`useUser` (needs the full store, not exercised here, every story supplies a resolved ' +
            'user). `size` accepts `0-3` (legacy `small`/`medium`/`large` are mapped). ' +
            '`withTooltip` wraps it in the Studio tooltip showing the display name. It is the ' +
            'atom that composes into presence stacks, the navbar presence menu, task assignees, ' +
            'and release activity.',
          '',
          '> **Why it matters:** the avatar itself holds up, but its presence dot signals ' +
            'online, editing, or inactive by colour alone, the same `collaborative-presence` ' +
            'trait the audit flagged across presence surfaces. In grayscale the three states ' +
            'collapse to one dot in one corner and "who is actively editing" is lost. The ' +
            'Current/Recommended pair below pairs the dot with a label.',
          '',
          'The last story shows it in context: the presence roster in the editor header of Anna ' +
            'Karenina, co-edited live.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:lawsofux',
    'pattern:collaborative-presence',
    'pattern:similarity',
    'audit:holds',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof UserAvatar>

/** Playground: swap user, size, status and tooltip from the controls. */
export const Default: Story = {}

/** The four sizes (`0–3`), initials fallback, one user so only scale varies. */
export const Sizes: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Flex align="center" gap={4}>
        {([0, 1, 2, 3] as AvatarSize[]).map((size) => (
          <Labelled key={size} label={`size=${size}`}>
            <UserAvatar user={grace} size={size} />
          </Labelled>
        ))}
      </Flex>
    </Card>
  ),
}

/** Deterministic per-user colour: the same roster, each hue derived from the user id. */
export const Colors: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Flex align="center" gap={3} wrap="wrap">
        {roster.map((user) => (
          <Labelled key={user.id} label={user.displayName ?? user.id}>
            <UserAvatar user={user} size={2} />
          </Labelled>
        ))}
      </Flex>
    </Card>
  ),
}

/**
 * Initials fallback (no `imageUrl`) beside a resolved image. Note `Prince`: a single
 * name yields a single-letter initial; two-part names yield first+last.
 */
export const InitialsAndImage: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Flex align="center" gap={4}>
        <Labelled label="two names → AL">
          <UserAvatar user={ada} size={2} />
        </Labelled>
        <Labelled label="single name → P">
          <UserAvatar user={prince} size={2} />
        </Labelled>
        <Labelled label="with imageUrl">
          <UserAvatar user={adaWithImage} size={2} />
        </Labelled>
      </Flex>
    </Card>
  ),
}

/** The presence-status dot in each state, plus the no-status baseline. */
export const PresenceStates: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Flex align="center" gap={4}>
        <Labelled label="no status">
          <UserAvatar user={ada} size={2} />
        </Labelled>
        {(['online', 'editing', 'inactive'] as AvatarStatus[]).map((status) => (
          <Labelled key={status} label={status}>
            <UserAvatar user={ada} size={2} status={status} />
          </Labelled>
        ))}
      </Flex>
    </Card>
  ),
}

/** `withTooltip`: hover reveals the display name via the Studio tooltip. */
export const WithTooltip: Story = {
  args: {user: katherine, size: 2, withTooltip: true},
  parameters: {controls: {include: []}},
}

/** A presence stack: several users overlapped, the pattern behind the navbar menu. */
export const PresenceRoster: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Flex>
        {roster.map((user, i) => (
          <div key={user.id} style={{marginLeft: i === 0 ? 0 : -6}}>
            <UserAvatar user={user} size={1} withTooltip />
          </div>
        ))}
      </Flex>
    </Card>
  ),
}

/**
 * **Current (audit finding).** `collaborative-presence` / `similarity`: the presence
 * dot distinguishes online / editing / inactive by colour alone. Shown here beside a
 * grayscale swatch, with hue removed, the three presence states are the same dot in
 * the same corner, and "who is actively editing" is lost.
 */
export const Current: Story = {
  name: 'presence · Current (colour-only status dot)',
  tags: ['audit:needs-work'],
  parameters: {controls: {include: []}},
  render: () => {
    const Row = ({grayscale}: {grayscale?: boolean}) => (
      <Card
        padding={3}
        radius={2}
        shadow={1}
        style={grayscale ? {filter: 'grayscale(1)'} : undefined}
      >
        <Flex align="center" gap={4}>
          {(['online', 'editing', 'inactive'] as AvatarStatus[]).map((status) => (
            <Labelled key={status} label={grayscale ? 'which state?' : status}>
              <UserAvatar user={ada} size={2} status={status} />
            </Labelled>
          ))}
        </Flex>
      </Card>
    )
    return (
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            As shipped: status is the dot colour
          </Text>
          <Row />
        </Stack>
        <Stack gap={2}>
          <Text size={1} weight="medium" muted>
            The same avatars in grayscale: the states collapse
          </Text>
          <Row grayscale />
        </Stack>
      </Stack>
    )
  },
}

/**
 * **Recommended.** Keep the coloured dot, but pair it with a text label (or, in a
 * dense stack, a tooltip line) so presence reads without colour. The avatar is the
 * real `UserAvatar`; the label is the added non-colour cue. Legible in grayscale.
 */
export const Recommended: Story = {
  name: 'presence · Recommended (status dot + label)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    const labels: Record<AvatarStatus, string> = {
      online: 'Online',
      editing: 'Editing now',
      inactive: 'Away',
    }
    const Row = ({grayscale}: {grayscale?: boolean}) => (
      <Card
        padding={3}
        radius={2}
        shadow={1}
        style={grayscale ? {filter: 'grayscale(1)'} : undefined}
      >
        <Stack gap={3}>
          {(['online', 'editing', 'inactive'] as AvatarStatus[]).map((status) => (
            <Flex key={status} align="center" gap={3}>
              <UserAvatar user={ada} size={1} status={status} />
              <Text size={1}>{labels[status]}</Text>
            </Flex>
          ))}
        </Stack>
      </Card>
    )
    return (
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            Dot + label: legible with colour
          </Text>
          <Row />
        </Stack>
        <Stack gap={2}>
          <Text size={1} weight="medium" muted>
            The same rows in grayscale: still legible
          </Text>
          <Row grayscale />
        </Stack>
      </Stack>
    )
  },
}

/**
 * **In context.** The editor header for the book *Anna Karenina*, open and being co-edited.
 * On the right, the presence roster: the real `UserAvatar` for each person in the
 * document, overlapped into the stack you see top-right of every open document: each in
 * their deterministic colour, with a presence dot and a name tooltip on hover. This is the
 * "who's here" atom doing its actual job in a live editing session.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const presence: Record<string, AvatarStatus> = {
      ada: 'editing',
      grace: 'editing',
      alan: 'online',
      kat: 'inactive',
      prince: 'online',
    }
    return (
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 480}}>
        <Flex align="center" justify="space-between" gap={4}>
          <Stack gap={2}>
            <Text size={0} muted weight="medium">
              Book
            </Text>
            <Text size={2} weight="semibold">
              Anna Karenina
            </Text>
          </Stack>
          <Flex align="center">
            {roster.map((user, i) => (
              <div key={user.id} style={{marginLeft: i === 0 ? 0 : -6}}>
                <UserAvatar user={user} size={1} status={presence[user.id]} withTooltip />
              </div>
            ))}
          </Flex>
        </Flex>
      </Card>
    )
  },
}
