import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). Hotkeys renders key names as
// "keycaps". It wraps `@sanity/ui`'s Hotkeys and, unless `makePlatformAware={false}`,
// rewrites keys to the host platform (e.g. `Alt` → `Option` on Apple devices). Pure
// presentation, so no provider stack is needed.
import {Hotkeys} from '../../../../packages/sanity/src/core/components/Hotkeys'

const meta: Meta<typeof Hotkeys> = {
  title: 'Actions & Commands/Hotkeys',
  component: Hotkeys,
  args: {keys: ['Ctrl', 'Alt', 'K'], makePlatformAware: false},
  argTypes: {
    makePlatformAware: {control: 'boolean'},
  },
  render: (props) => (
    <Card padding={3} radius={2} shadow={1} style={{display: 'inline-block'}}>
      <Hotkeys {...props} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'A keyboard shortcut only helps the people who know it exists, which makes the way ' +
            'Studio shows a shortcut part of whether the shortcut works at all. This is the ' +
            'component that draws it, rendering an array of key names as the row of keycaps a ' +
            'reader recognises.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/Hotkeys.tsx`, Studio-only (no design-system equivalent) |',
          "| Tier | CHROME. A display primitive rendering an array of key names as keycaps, with one behaviour on top of `@sanity/ui`'s Hotkeys: platform-aware key rewriting (`Alt` to `Option`, `Option` to `Alt`) |",
          '| Audit | ⚪ not-audited as a unit, but it is the building block for `keyboard-only`. The audit found "no global keyboard map beyond Cmd+K"; this is what such a map would render its keys with |',
          '| Determinism | rewriting reads `navigator.platform`, so output depends on the machine viewing the page. Default arg pins `makePlatformAware={false}` to keep the sweeps stable |',
          '| Patterns | `keyboard-only` |',
          '',
          'A keyboard shortcut only helps the people who know it exists, which makes the way Studio ' +
            '*shows* a shortcut part of whether the shortcut works at all. This is the component that ' +
            'draws one. Hand it `["Ctrl", "Alt", "K"]` and it renders the row of keycaps a reader ' +
            'recognises, whether that row sits beside a menu item, inside a tooltip, or down a ' +
            'discoverable shortcut legend.',
          '',
          'The one piece of intelligence on top is that it relabels keys for whoever is looking. The ' +
            'same input renders `Option` on Apple hardware and `Alt` everywhere else, so one legend ' +
            'reads correctly on both without the author writing it twice. The `PlatformAware` story ' +
            'turns that on deliberately and labels the dependency; every other story pins it off.',
          '',
          '> **Why it matters:** with `makePlatformAware` on, the keys you pass are not the keys that ' +
            'render. Never snapshot or assert against platform-aware output, and never assume a reader ' +
            'sees the exact strings you passed.',
          '',
          'The page closes *in context*: a keyboard-shortcut legend for the "Anna Karenina" document, ' +
            'each action paired with its platform-aware keycaps.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:actions',
    'chapter:people',
    'pattern:keyboard-only',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof Hotkeys>

/** Playground: edit the keys and toggle platform-awareness from the controls. */
export const Default: Story = {}

/** A gallery of common Studio shortcuts, rendered platform-neutral for determinism. */
export const CommonShortcuts: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {label: string; keys: string[]}[] = [
      {label: 'Command palette', keys: ['Ctrl', 'K']},
      {label: 'Publish', keys: ['Ctrl', 'Alt', 'P']},
      {label: 'Undo', keys: ['Ctrl', 'Z']},
      {label: 'Redo', keys: ['Ctrl', 'Shift', 'Z']},
      {label: 'Search', keys: ['Ctrl', 'F']},
    ]
    return (
      <Card padding={3} radius={2} shadow={1}>
        <Stack gap={3}>
          {rows.map(({label, keys}) => (
            <Flex key={label} align="center" justify="space-between" gap={4}>
              <Text size={1}>{label}</Text>
              <Hotkeys keys={keys} makePlatformAware={false} />
            </Flex>
          ))}
        </Stack>
      </Card>
    )
  },
}

/**
 * Platform-aware on (`makePlatformAware` default `true`): the same `Alt` key renders as
 * `Option` on Apple devices and `Alt` elsewhere. What you see here therefore depends on
 * the OS viewing the story, which is why the deterministic sweeps above pin it off.
 */
export const PlatformAware: Story = {
  name: 'Platform-aware (OS-dependent)',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Stack gap={3}>
        <Flex align="center" justify="space-between" gap={4}>
          <Text size={1} muted>
            makePlatformAware=false
          </Text>
          <Hotkeys keys={['Alt', 'Shift', 'K']} makePlatformAware={false} />
        </Flex>
        <Flex align="center" justify="space-between" gap={4}>
          <Text size={1} muted>
            makePlatformAware=true (this OS)
          </Text>
          <Hotkeys keys={['Alt', 'Shift', 'K']} makePlatformAware />
        </Flex>
      </Stack>
    </Card>
  ),
}

/**
 * In context: the keyboard-shortcut legend for the "Anna Karenina" document, the kind of
 * panel a "Keyboard shortcuts" affordance opens beside the editor. Each row pairs a real
 * document action with the keys that fire it, drawn as keycaps. Platform-aware is on, so the
 * modifiers read idiomatically on the OS viewing this page (Option on a Mac, Alt elsewhere).
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const shortcuts: {label: string; keys: string[]}[] = [
      {label: 'Publish', keys: ['Ctrl', 'Alt', 'P']},
      {label: 'Duplicate', keys: ['Ctrl', 'Alt', 'D']},
      {label: 'Undo', keys: ['Ctrl', 'Z']},
      {label: 'Redo', keys: ['Ctrl', 'Shift', 'Z']},
    ]
    return (
      <Card padding={3} radius={2} shadow={1} style={{minWidth: 280}}>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text size={0} muted>
              Editing · Book
            </Text>
            <Text size={1} weight="semibold">
              Anna Karenina keyboard shortcuts
            </Text>
          </Stack>
          <Stack gap={3}>
            {shortcuts.map(({label, keys}) => (
              <Flex key={label} align="center" justify="space-between" gap={4}>
                <Text size={1}>{label}</Text>
                <Hotkeys keys={keys} />
              </Flex>
            ))}
          </Stack>
        </Stack>
      </Card>
    )
  },
}
