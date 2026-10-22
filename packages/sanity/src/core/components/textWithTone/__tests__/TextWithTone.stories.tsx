import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type ButtonTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TextWithTone} from '../TextWithTone'

// The five tones the component styles; any other ButtonTone falls through to
// the inherited foreground colour.
const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

const STATUS_ROWS: {tone: ButtonTone; icon: typeof ErrorOutlineIcon; text: string}[] = [
  {tone: 'critical', icon: ErrorOutlineIcon, text: 'Required, cannot be empty'},
  {tone: 'caution', icon: WarningOutlineIcon, text: 'Publish date is in the past'},
  {tone: 'positive', icon: CheckmarkCircleIcon, text: 'Saved just now'},
  {tone: 'primary', icon: InfoOutlineIcon, text: 'Used in 3 other documents'},
]

/**
 * `@sanity/ui` `Text` tinted by `tone`: the component swaps `--card-fg-color`
 * for the matching `--card-badge-<tone>-fg-color`, so it inherits whatever
 * palette the enclosing `Card` provides. It is the primitive behind toned
 * inline copy across the studio (validation messages, filter labels, status
 * strips). `muted` suppresses the tone rule entirely and `dimmed` drops the
 * opacity to 0.3.
 */
const meta = {
  title: 'Studio/Text With Tone',
  component: TextWithTone,
  args: {tone: 'critical', size: 1, children: 'Required, cannot be empty'},
} satisfies Meta<typeof TextWithTone>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The tone sweep, `dimmed` beside its normal counterpart, `muted` overriding
 * the tone, and the icon-plus-text pairing status messages use so the meaning
 * survives without colour. One snapshot covers every CSS branch.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5} padding={4}>
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 360}}>
        <Stack gap={3}>
          {TONES.map((tone) => (
            <Flex align="center" gap={3} justify="space-between" key={tone}>
              <TextWithTone size={1} tone={tone}>
                The quick brown fox
              </TextWithTone>
              <Text muted size={0}>
                {tone}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Card>
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 360}}>
        <Flex gap={4} justify="space-between">
          {(['positive', 'caution', 'critical'] as const).map((tone) => (
            <Stack gap={2} key={tone} style={{textAlign: 'center'}}>
              <TextWithTone size={1} tone={tone}>
                Normal
              </TextWithTone>
              <TextWithTone dimmed size={1} tone={tone}>
                Dimmed
              </TextWithTone>
            </Stack>
          ))}
        </Flex>
      </Card>
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 360}}>
        <Stack gap={3}>
          <Flex align="center" gap={3} justify="space-between">
            <TextWithTone size={1} tone="critical">
              Toned critical
            </TextWithTone>
            <Text muted size={0}>
              tone applies
            </Text>
          </Flex>
          <Flex align="center" gap={3} justify="space-between">
            <TextWithTone muted size={1} tone="critical">
              Muted critical
            </TextWithTone>
            <Text muted size={0}>
              tone suppressed by muted
            </Text>
          </Flex>
        </Stack>
      </Card>
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 360}}>
        <Stack gap={3}>
          {STATUS_ROWS.map(({tone, icon: Icon, text}) => (
            <Flex align="center" gap={2} key={tone}>
              <TextWithTone size={1} tone={tone}>
                <Icon />
              </TextWithTone>
              <TextWithTone size={1} tone={tone}>
                {text}
              </TextWithTone>
            </Flex>
          ))}
        </Stack>
      </Card>
    </Stack>
  ),
}
