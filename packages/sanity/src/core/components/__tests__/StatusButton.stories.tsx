import {CircleIcon} from '@sanity/icons/Circle'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type ButtonTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StatusButton} from '../StatusButton'

// The tones the status dot is tinted with, via `--card-badge-<tone>-dot-color`.
const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

const STATES = [
  {label: 'resting', props: {}},
  {label: 'selected', props: {selected: true}},
  {label: 'loading', props: {loading: true}},
  {label: 'disabled', props: {disabled: true}},
] as const

/**
 * A `Button` that also reports state: the `ui-components` button forced into
 * `mode="bleed"` with a 4×4px dot pinned to its top-right corner and tinted by
 * `tone`. The navbar and document header use it wherever a control carries a
 * status (validation warnings, a live connection). `aria-label` is a required
 * prop so the state the dot conveys always has a programmatic name.
 */
const meta = {
  title: 'Studio/Status Button',
  component: StatusButton,
  args: {'aria-label': 'Status', 'text': 'Status'},
} satisfies Meta<typeof StatusButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The dot in every tone, the four interaction states, and a labelled
 * in-context example. The dot is the only thing `tone` changes, so this one
 * grid is the tone-cascade sentinel for the component.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5} padding={4}>
      <Flex align="center" gap={4}>
        {TONES.map((tone) => (
          <Stack gap={3} key={tone}>
            <StatusButton
              aria-label={`Status: ${tone}`}
              icon={CircleIcon}
              tone={tone}
              tooltipProps={null}
            />
            <Text align="center" muted size={0}>
              {tone}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Flex align="center" gap={4}>
        {STATES.map(({label, props}) => (
          <Stack gap={3} key={label}>
            <Card border padding={1} radius={2}>
              <StatusButton
                aria-label={`Publish, ${label}`}
                icon={CircleIcon}
                tone="primary"
                tooltipProps={null}
                {...props}
              />
            </Card>
            <Text align="center" muted size={0}>
              {label}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Card padding={2} radius={2} shadow={1} style={{maxWidth: 420}}>
        <Flex align="center" gap={3} paddingLeft={2}>
          <Stack flex={1} gap={2}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              Anna Karenina
            </Text>
            <Text muted size={0}>
              Draft · edited just now
            </Text>
          </Stack>
          <StatusButton
            aria-label="Anna Karenina, 2 validation warnings"
            icon={WarningOutlineIcon}
            text="Publish"
            tone="caution"
          />
        </Flex>
      </Card>
    </Stack>
  ),
}
