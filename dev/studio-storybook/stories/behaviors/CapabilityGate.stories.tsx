import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {ResourceCacheContext} from 'sanity/_singletons'

// Real component from its real path (org contract §8). CapabilityGate conditionally
// renders its children based on whether the Studio *rendering context* (default vs a host
// like the Dashboard / core UI) provides a named capability. It reads that from a
// RenderingContextStore resolved out of the resource cache.
import {CapabilityGate} from '../../../../packages/sanity/src/core/components/CapabilityGate'
import {
  type CapabilityRecord,
  type RenderingContextStore,
} from '../../../../packages/sanity/src/core/store/renderingContext/types'
import {type ResourceCache} from '../../../../packages/sanity/src/core/store/ResourceCacheProvider'

/**
 * A minimal resource cache seeded with a RenderingContextStore that reports a fixed set
 * of capabilities. This is the whole dependency CapabilityGate has — far lighter than the
 * full studio provider stack, and it lets a story pin capabilities to show *both* gate
 * branches deterministically (WithStudioProviders always resolves the `default` context,
 * which provides none).
 */
function withCapabilities(capabilities: CapabilityRecord): Decorator {
  const store: RenderingContextStore = {
    renderingContext: of({name: 'default', metadata: {}}),
    capabilities: of(capabilities),
  }
  const values = new Map<string, unknown>([['RenderingContextStore', store]])
  // Signature mirrors the sanctioned lib/testProvider.tsx seeded cache (dependency
  // identity is ignored — there is one mock world here).
  const cache: ResourceCache = {
    get: <T,>({namespace}: {namespace: string}) => values.get(namespace) as T | undefined,
    set: ({namespace, value}) => {
      if (!values.has(namespace)) values.set(namespace, value)
    },
  }
  return (Story) => (
    // `cache` is built once per factory call (module scope), so the value is stable
    // despite the rule's heuristic.
    // oxlint-disable-next-line react/jsx-no-constructed-context-values
    <ResourceCacheContext.Provider value={cache}>
      <Story />
    </ResourceCacheContext.Provider>
  )
}

const meta: Meta<typeof CapabilityGate> = {
  title: 'Laws & Behaviors/CapabilityGate',
  component: CapabilityGate,
  parameters: {
    docs: {
      description: {
        component: [
          'CapabilityGate lets the same Studio code render standalone and embedded without ' +
            'duplicating chrome. Studio does not always run on its own: it can be embedded inside ' +
            'a host application, the Sanity Dashboard, another core UI, that already ships things ' +
            'like the global user menu or the workspace switcher.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/CapabilityGate.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. A conditional-render gate, not chrome: it is how Studio hands a responsibility (the global user menu, workspace control, comlink) to whatever *hosts* it |',
          '| Audit | ⚪ not-audited, architectural plumbing. Storied because it has a real, visible effect (render vs render-nothing) that is easy to get backwards, and seeing both branches side by side is the fastest way to understand the inverted default |',
          '| Patterns | `component-api-design` |',
          '| Capabilities | `globalUserMenu` · `globalWorkspaceControl` · `comlink` |',
          '',
          'A component marks a slice of the tree as "I provide this locally, unless my host ' +
            'already does" and CapabilityGate renders that local implementation only when the ' +
            'rendering context does not already provide the capability, then steps aside when the ' +
            'host takes over.',
          '',
          'The gotcha is the default `condition="unavailable"`: children render when the ' +
            'capability is absent (the local fallback fills in). Flip to `condition="available"` ' +
            'and children render only when the host provides it. The stories seed capabilities ' +
            'via a lightweight resource-cache decorator.',
          '',
          '> **Why it matters:** the default is inverted from what most people expect: setting ' +
            'the condition to unavailable renders the children, because the gate exists to supply ' +
            'a local fallback a host can override. Read it as render this unless someone upstream ' +
            'already handles it.',
          '',
          "The last story shows the gate in context: Studio's standalone top bar over the book " +
            'workspace, where the gate supplies Studio’s own user menu because no host provides ' +
            'one.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:systems',
    'pattern:component-api-design',
    'audit:not-audited',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof CapabilityGate>

function Slot({children, tone}: {children: ReactNode; tone: 'positive' | 'transparent'}) {
  return (
    <Card padding={3} radius={2} border tone={tone}>
      <Text size={1}>{children}</Text>
    </Card>
  )
}

/**
 * Default `condition="unavailable"`. The host (default context) provides no
 * capabilities, so the gate lets its local fallback through, "Local user menu" renders.
 */
export const RendersLocalFallback: Story = {
  name: 'Unavailable → local fallback renders',
  decorators: [withCapabilities({})],
  parameters: {controls: {include: []}},
  render: () => (
    <CapabilityGate capability="globalUserMenu">
      <Slot tone="positive">Local user menu (host provides none, so this shows)</Slot>
    </CapabilityGate>
  ),
}

/**
 * Same default `condition="unavailable"`, but now the host does provide
 * `globalUserMenu`, so the gate suppresses the local implementation and nothing renders
 * (the host's own menu takes over). The empty frame below is the point.
 */
export const HostProvidesIt: Story = {
  name: 'Unavailable → suppressed when host provides it',
  decorators: [withCapabilities({globalUserMenu: true})],
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={3}>
      <Text size={0} muted>
        Host provides globalUserMenu → gate renders nothing:
      </Text>
      <Card padding={3} radius={2} border tone="transparent" style={{minHeight: 44}}>
        <CapabilityGate capability="globalUserMenu">
          <Slot tone="positive">You should NOT see this</Slot>
        </CapabilityGate>
      </Card>
    </Stack>
  ),
}

/**
 * The inverse: `condition="available"` renders children only when the host provides
 * the capability. Left column has `comlink`, right does not, so only the left renders.
 */
export const AvailableCondition: Story = {
  name: 'condition="available" (inverse)',
  decorators: [withCapabilities({comlink: true})],
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4}>
      <Stack gap={3} flex={1}>
        <Text size={0} muted>
          capability=comlink (present)
        </Text>
        <Card padding={3} radius={2} border tone="transparent" style={{minHeight: 44}}>
          <CapabilityGate capability="comlink" condition="available">
            <Slot tone="positive">comlink is available → renders</Slot>
          </CapabilityGate>
        </Card>
      </Stack>
      <Stack gap={3} flex={1}>
        <Text size={0} muted>
          capability=globalWorkspaceControl (absent)
        </Text>
        <Card padding={3} radius={2} border tone="transparent" style={{minHeight: 44}}>
          <CapabilityGate capability="globalWorkspaceControl" condition="available">
            <Slot tone="positive">absent → renders nothing</Slot>
          </CapabilityGate>
        </Card>
      </Stack>
    </Flex>
  ),
}

/**
 * In context, Studio's top bar over the book workspace, running standalone. No
 * host provides `globalUserMenu`, so the gate lets Studio's own user menu through;
 * open it to confirm the local fallback is live. Embed this same Studio inside the
 * Dashboard and the host would provide that menu, the gate would step aside and
 * render nothing here. One seam, one codebase, standalone or embedded.
 */
export const InContext: Story = {
  name: 'In context',
  decorators: [withCapabilities({})],
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={3}>
      <Text size={0} muted>
        Standalone Studio over the book workspace, no host provides the global user menu, so the
        gate lets Studio render its own.
      </Text>
      <Card border radius={3} padding={2} tone="transparent">
        <Flex align="center" gap={3}>
          <Box flex={1} paddingX={2}>
            <Text size={1} weight="semibold">
              Book Studio
            </Text>
          </Box>
          <Text size={1} muted>
            Anna Karenina
          </Text>
          <CapabilityGate capability="globalUserMenu">
            <MenuButton
              id="in-context-user-menu"
              button={<Button mode="bleed" text="Jane Editor" />}
              menu={
                <Menu>
                  <MenuItem text="Edit profile" />
                  <MenuItem text="Manage project" />
                  <MenuItem text="Sign out" />
                </Menu>
              }
              popover={{placement: 'bottom-end'}}
            />
          </CapabilityGate>
        </Flex>
      </Card>
    </Stack>
  ),
}
