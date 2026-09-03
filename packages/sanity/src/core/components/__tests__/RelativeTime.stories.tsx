import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../i18n/components/LocaleProvider'
import {RelativeTime} from '../RelativeTime'

// A pinned "now". Passing it as `relativeTo` makes every phrase deterministic
// and turns the hook's refresh timer into a no-op.
const NOW = new Date('2026-07-23T12:00:00.000Z')

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const ago = (ms: number) => new Date(NOW.getTime() - ms)

const LADDER: {label: string; time: Date}[] = [
  {label: 'under 10 seconds', time: ago(3 * SECOND)},
  {label: 'seconds', time: ago(40 * SECOND)},
  {label: 'minutes', time: ago(5 * MINUTE)},
  {label: 'hours', time: ago(3 * HOUR)},
  {label: 'yesterday', time: ago(DAY)},
  {label: 'days', time: ago(4 * DAY)},
  {label: 'weeks', time: ago(2 * 7 * DAY)},
  {label: 'months', time: ago(70 * DAY)},
  {label: 'years', time: ago(800 * DAY)},
  {label: 'future', time: new Date(NOW.getTime() + 3 * HOUR)},
]

/**
 * A timestamp as a locale-aware relative phrase ("5 minutes ago") inside a
 * semantic `<time dateTime>` element, with the phrase repeated in `title`. It
 * steps through seconds, minutes, hours, days and weeks, then switches to an
 * absolute date once months or years apart; `minimal` shortens the unit
 * words. In the studio it refreshes itself on a timer sized to the current
 * unit. Every row here pins `relativeTo` to a fixed instant so the phrases do
 * not drift between captures. The formatting reads the current locale from
 * `LocaleContext`, which `TestWrapper` does not mount, so the decorator adds
 * the studio `LocaleProvider` on top of the mock source.
 */
const meta = {
  title: 'Core Components/Relative Time',
  component: RelativeTime,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <LocaleProvider>
          <Story />
        </LocaleProvider>
      </TestWrapper>
    ),
  ],
  args: {time: ago(2 * MINUTE), relativeTo: NOW},
} satisfies Meta<typeof RelativeTime>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One row per unit the hook steps through, full phrasing beside `minimal`,
 * all measured against the same pinned instant.
 */
export const Thresholds: Story = {
  render: () => (
    <Card padding={3} radius={2} shadow={1} style={{maxWidth: 520}}>
      <Stack gap={3}>
        <Flex gap={4}>
          <Text muted size={0} style={{minWidth: 140}} weight="medium">
            distance
          </Text>
          <Text muted size={0} style={{flex: 1}} weight="medium">
            default
          </Text>
          <Text muted size={0} style={{flex: 1}} weight="medium">
            minimal
          </Text>
        </Flex>
        {LADDER.map(({label, time}) => (
          <Flex gap={4} key={label}>
            <Text muted size={1} style={{minWidth: 140}}>
              {label}
            </Text>
            <Text size={1} style={{flex: 1}}>
              <RelativeTime relativeTo={NOW} time={time} />
            </Text>
            <Text size={1} style={{flex: 1}}>
              <RelativeTime minimal relativeTo={NOW} time={time} />
            </Text>
          </Flex>
        ))}
      </Stack>
    </Card>
  ),
}
