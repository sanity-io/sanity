import {Card, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CreateReleaseMenuItem} from '../../../../packages/sanity/src/core/releases/components/CreateReleaseMenuItem'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

const meta: Meta<typeof CreateReleaseMenuItem> = {
  title: 'Releases/Create Release Menu Item',
  component: CreateReleaseMenuItem,
  args: {onCreateRelease: noop},
  parameters: {
    docs: {
      description: {
        component: [
          'This component never hides itself. Both of its failure modes render the row, greyed, ' +
            'with an explanation on hover, rather than removing it, and that restraint is why it ' +
            'exists as a component rather than a plain menu row.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/CreateReleaseMenuItem.tsx` |',
          '| Tier | SERVICE |',
          '',
          'The "New release" row that appears in the perspective menu and the releases tool. ' +
            'One menu item, three states, and the two that are not the happy path are the reason ' +
            'it is a component at all: it renders enabled, or disabled because you are at the ' +
            'plan limit, or disabled because you lack permission, and in both disabled cases it ' +
            'attaches a tooltip saying which.',
          '',
          'The permission check is a live request in a real studio (`checkWithPermissionGuard` ' +
            'against the release-operations store). The harness seeds a `ReleasePermissions` ' +
            'value into the resource cache, which is where `useReleasePermissions` looks before ' +
            'it builds a real store, the same seam `useReleasesStore` uses. The limit comes from ' +
            '`workspace.releases.limit`, so it is set per story through the config.',
          '',
          '> **Why it matters:** an action that vanishes teaches an editor nothing, and leaves ' +
            'them unable to tell an interface that lacks the feature from one that has it and is ' +
            'withholding it. The tooltip converts a dead end into an answerable question, ask an ' +
            'administrator, or upgrade the plan. The two reasons are also checked in a fixed ' +
            'order, limit before permission, so an editor at both never sees a permissions ' +
            'message they cannot act on.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:releases', 'chapter:cms', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj<typeof CreateReleaseMenuItem>

function Frame({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 280}}>
      <Menu>{children}</Menu>
    </Card>
  )
}

export const Enabled: Story = {
  name: 'Enabled',
  decorators: [WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        story:
          'Three active releases against no configured limit. The row is live and clicking it opens the create dialog.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <CreateReleaseMenuItem {...args} />
    </Frame>
  ),
}

export const LimitReached: Story = {
  name: 'At the release limit',
  decorators: [
    WithStudioProviders({
      releases: fixtureReleases,
      config: {releases: {enabled: true, limit: 3}},
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A workspace capped at three releases, with three already active. The row is disabled ' +
          'and its tooltip names the number - hover it. This is the state a plan boundary ' +
          'produces. The count in the message comes from the workspace config rather than a ' +
          'hard-coded string, so it stays true across plans.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <CreateReleaseMenuItem {...args} />
    </Frame>
  ),
}

export const NoPermission: Story = {
  name: 'Without permission',
  decorators: [WithStudioProviders({releases: fixtureReleases, canPerformReleaseActions: false})],
  parameters: {
    docs: {
      description: {
        story:
          'The same row for an editor whose role cannot create releases. Visually identical to the limit case, deliberately - both are "you cannot do this right now" - and distinguished only by the tooltip, because the remedy is different: one is a conversation with an administrator, the other with whoever owns the plan.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <CreateReleaseMenuItem {...args} />
    </Frame>
  ),
}

export const InContext: Story = {
  name: 'In context - the bottom of a perspective menu',
  decorators: [WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        story:
          'Where it sits: last in the menu that lists the releases you can switch into, below the ones that already exist. The placement is the argument - having looked through what is there and not found it, the next thing offered is making it.',
      },
    },
  },
  render: (args) => (
    <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 280}}>
      <Stack gap={2}>
        <Card padding={2} tone="transparent">
          <Text size={0} muted weight="medium">
            RELEASES
          </Text>
        </Card>
        <Menu>
          <CreateReleaseMenuItem {...args} />
        </Menu>
      </Stack>
    </Card>
  ),
}
