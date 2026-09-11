import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {Hotkeys} from '../Hotkeys'

const SHORTCUTS: {label: string; keys: string[]}[] = [
  {label: 'Search', keys: ['Ctrl', 'K']},
  {label: 'Publish', keys: ['Ctrl', 'Alt', 'P']},
  {label: 'Undo', keys: ['Ctrl', 'Z']},
  {label: 'Redo', keys: ['Ctrl', 'Shift', 'Z']},
  {label: 'Single key', keys: ['Esc']},
]

/**
 * Renders an array of key names as keycaps. A wrapper around the `@sanity/ui`
 * `Hotkeys` primitive that adds one behaviour: with `makePlatformAware` (the
 * default) `Alt` renders as `Option` on Apple devices and `Option` renders as
 * `Alt` everywhere else, so one shortcut legend reads correctly on both.
 * Because that rewrite reads `navigator.platform`, the stories pin
 * `makePlatformAware={false}` to keep the rendered keys independent of the
 * machine capturing them.
 */
const meta = {
  title: 'Studio/Hotkeys',
  component: Hotkeys,
  args: {keys: ['Ctrl', 'Alt', 'K'], makePlatformAware: false},
} satisfies Meta<typeof Hotkeys>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * A legend of common studio shortcuts, the layout used by menu items,
 * tooltips and keyboard-shortcut panels.
 */
export const Legend: Story = {
  render: () => (
    <Card padding={3} radius={2} shadow={1} style={{maxWidth: 320}}>
      <Stack gap={3}>
        {SHORTCUTS.map(({label, keys}) => (
          <Flex align="center" gap={4} justify="space-between" key={label}>
            <Text size={1}>{label}</Text>
            <Hotkeys keys={keys} makePlatformAware={false} />
          </Flex>
        ))}
      </Stack>
    </Card>
  ),
}
