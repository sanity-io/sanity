import {Badge, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../../../packages/sanity/src/core/config/components/useMiddlewareComponents'
import {type PluginOptions} from '../../../../packages/sanity/src/core/config/types'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * These stories call the REAL `useMiddlewareComponents`, the hook every `renderDefault` seam in
 * the studio is built on, against a REAL resolved workspace containing real plugins. Nothing
 * about the composition below is simulated: the chain, its order, and what each layer receives
 * as `renderDefault` are produced by `_createMiddlewareComponent` itself.
 *
 * A layer is deliberately just a labelled box. The seam being demonstrated is `studio.components
 * .navbar`, but the mechanism is identical for every other one, and rendering actual navbars
 * would put three navbars on the page and teach nothing about the ordering.
 */
interface LayerProps {
  renderDefault: (props: LayerProps) => React.JSX.Element
}

const layer =
  (label: string, tone: 'primary' | 'positive' | 'caution'): ComponentType<LayerProps> =>
  (props: LayerProps) => (
    <Card border radius={2} padding={3} tone={tone}>
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Badge tone={tone} fontSize={0}>
            {label}
          </Badge>
          <Text size={0} muted>
            calls renderDefault
          </Text>
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )

/**
 * The innermost component. Note it does NOT call `renderDefault`, per the warning in
 * `useMiddlewareComponents.tsx`: the default is handed `emptyRender`, so a default that calls
 * its own `renderDefault` renders a `<Fragment />` and the chain terminates in nothing.
 */
function StudioDefault() {
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack gap={2}>
        <Badge tone="default" fontSize={0}>
          Studio default
        </Badge>
        <Text size={0} muted>
          the innermost layer, which never calls renderDefault
        </Text>
      </Stack>
    </Card>
  )
}

/** A component that breaks the chain by never delegating. Used by story 3. */
function TerminalLayer(_props: LayerProps) {
  return (
    <Card border radius={2} padding={3} tone="critical">
      <Stack gap={2}>
        <Badge tone="critical" fontSize={0}>
          plugin-b (does not delegate)
        </Badge>
        <Text size={0} muted>
          renderDefault never called, so everything below this point is gone
        </Text>
      </Stack>
    </Card>
  )
}

const pick = (plugin: PluginOptions) =>
  plugin.studio?.components?.navbar as unknown as ComponentType<LayerProps>

/** Renders the chain the real hook produced for the currently mounted workspace. */
function Chain() {
  const Composed = useMiddlewareComponents<LayerProps>({
    pick,
    defaultComponent: StudioDefault as ComponentType<LayerProps>,
  })
  return (
    <Card padding={3} style={{maxWidth: 620}}>
      {/*
        React Compiler flags this as creating a component during render, and against an arbitrary
        factory it would be right: a new component identity each render remounts the subtree and
        resets its state. It is a false positive here because `useMiddlewareComponents` builds the
        chain inside `useMemo` keyed on the source options, so `Composed` is stable for the life of
        the workspace. This is how the studio itself mounts every one of these seams.
      */}
      {/* oxlint-disable-next-line react/react-compiler -- see above; the hook memoizes */}
      <Composed renderDefault={(() => null) as never} />
    </Card>
  )
}

// --- configs --------------------------------------------------------------------------------

const base = {name: 'default', title: 'Acme', schema: {name: 'default', types: []}}

const pluginA = {
  name: 'plugin-a',
  studio: {components: {navbar: layer('plugin-a', 'positive')}},
}
const pluginB = {
  name: 'plugin-b',
  studio: {components: {navbar: layer('plugin-b', 'caution')}},
}
const pluginBTerminal = {
  name: 'plugin-b',
  studio: {components: {navbar: TerminalLayer}},
}

const meta: Meta = {
  title: 'Customisation/The Middleware Chain',
  parameters: {
    docs: {
      description: {
        component: [
          "renderDefault means the next layer down, not Sanity's component, and installing a " +
            'single plugin that registers the same seam is enough to make those two readings ' +
            'disagree.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `core/config/components/useMiddlewareComponents.tsx`. Every studio and form component seam resolves through this hook |',
          '| Tier | CORE |',
          '',
          'Each config in the tree that registers the same seam becomes a middleware layer, and ' +
            'each one receives the layer beneath it as `renderDefault`. If you are the only ' +
            "registrant, the next layer down happens to be Sanity's default and the two readings " +
            'agree. Install a plugin that registers the same seam and they stop agreeing: your ' +
            "`renderDefault` is now that plugin's component, and Sanity's default is two layers " +
            'below. The source says so in as many words on line 20: "As we progress through the ' +
            'chain, the meaning of renderDefault changes."',
          '',
          'The order inverts the obvious guess. `useMiddlewareComponents` flattens the config ' +
            'tree, calls `.reverse()` on it, and then wraps outward. The effect is that the root ' +
            'config wraps the plugins, not the other way round. Your studio-level customisation ' +
            "is the outermost layer and runs first; a plugin's is nearer the default. Story 2 " +
            'renders that ordering rather than asserting it.',
          '',
          'And a footgun the source flags in a comment: the innermost default component is ' +
            'invoked with `renderDefault: emptyRender`. A component written as a default that ' +
            'nonetheless calls `props.renderDefault` renders an empty `<Fragment />`, silently. ' +
            'That is why `StudioDefault` in this file does not call it.',
          '',
          'Every other page here says decorate rather than replace and shows what replacing ' +
            'costs. This one shows what you are actually decorating, which on a studio with ' +
            'plugins installed is frequently not what the author assumed. A plugin that fails to ' +
            'call `renderDefault` disables every customisation registered below it, including ' +
            "Sanity's own, and nothing reports it.",
          '',
          'These stories call the real hook against real resolved workspaces. The layers are ' +
            'labelled boxes rather than navbars because the subject is the composition, not the ' +
            'component.',
          '',
          '> **Why it matters:** there is no diagnostic for a layer that fails to delegate. The ' +
            'chain does not report it and no warning is emitted, and the layers above the break ' +
            'still render fine, so the failure looks like the studio default quietly changed ' +
            'rather than like an error. If a customisation stops working after installing a ' +
            'plugin, this is the first thing to check.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:customisation', 'source:studio-only', 'tier:core'],
}

export default meta
type Story = StoryObj

export const NoPlugins: Story = {
  name: '1. One registrant - renderDefault is the default',
  decorators: [
    WithStudioProviders({
      config: {...base, studio: {components: {navbar: layer('root config', 'primary')}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "A workspace with one component registered and no plugins. The chain is two layers: the root config wrapping the studio default.\n\nThis is the mental model most people carry, and against this configuration it is correct. `renderDefault` is Sanity's component, decorating is safe, and nothing surprising happens. Every other page in this chapter is written against a studio shaped like this one.",
      },
    },
  },
  render: () => <Chain />,
}

export const WithPlugins: Story = {
  name: '2. Three registrants - read the nesting order',
  decorators: [
    WithStudioProviders({
      config: {
        ...base,
        plugins: [pluginA, pluginB],
        studio: {components: {navbar: layer('root config', 'primary')}},
      } as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The same root config plus two plugins, each registering the same seam. The real hook produced this nesting; read it outside in.\n\n**The root config is outermost.** Then the plugins, then Sanity's default innermost. So the component registered on the workspace is the first to run and the last to be wrapped, and each plugin's `renderDefault` resolves to the plugin declared after it rather than to Sanity.\n\nThat ordering comes from `flattened.reverse()` on line 77, and the comment beside it explains the intent: the Components API should order consistently with the other config APIs. It is a defensible choice and it is not the one most people guess, which is why it is worth seeing rendered.\n\n**What this means in practice.** A `renderDefault` call in the root config component here renders plugin-a's navbar, which renders plugin-b's, which renders Sanity's. If plugin-a changes what it does in a minor release, the root config's decoration decorates something different, without the root config changing.",
      },
    },
  },
  render: () => <Chain />,
}

export const BrokenChain: Story = {
  name: '3. A layer that does not delegate',
  decorators: [
    WithStudioProviders({
      config: {
        ...base,
        plugins: [pluginA, pluginBTerminal],
        studio: {components: {navbar: layer('root config', 'primary')}},
      } as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The same three registrants, except plugin-b never calls `renderDefault`.\n\nEverything below it is gone: Sanity\'s default component is not rendered, and would not be rendered no matter what it contained. The two layers **above** plugin-b are unaffected and still render, so the failure is not total and does not look like a failure. It looks like the studio default quietly changed.\n\n**This is the practical hazard in the middleware design.** The advice "decorate rather than replace" is usually framed as a cost to the author who replaces: they lose validation, presence, and so on. In a chain it is also a cost imposed on everyone below them, including a studio author who registered a perfectly correct decoration and cannot see why it stopped applying.\n\nThere is no diagnostic for this. The chain does not report a layer that failed to delegate, and no warning is emitted. If a customisation stops working after installing a plugin, this is the first thing to check.',
      },
    },
  },
  render: () => <Chain />,
}
