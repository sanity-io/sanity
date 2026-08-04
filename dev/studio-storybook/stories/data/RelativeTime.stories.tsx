import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). RelativeTime renders a `<time>`
// element whose text is a human relative phrase ("2 minutes ago") and whose `title` is
// the resolved absolute time. It reads locale + translations via `useRelativeTime`, so it
// needs the studio LocaleContext — supplied here by WithStudioProviders.
import {RelativeTime} from '../../../../packages/sanity/src/core/components/RelativeTime'
// The real hook behind the component, mounted directly by the Edge cases story: it is the
// half of the invalid-date contract that genuinely degrades gracefully, and the story
// demonstrates that live (the component wrapper is the half that throws — see EdgeCases).
import {useRelativeTime} from '../../../../packages/sanity/src/core/hooks/useRelativeTime'
import {WithStudioProviders} from '../../lib/testProvider'

// A pinned "now". Passing it as `relativeTo` makes every story fully deterministic:
// `useRelativeTime` computes against this instant instead of `Date.now()`, and its
// auto-refresh timer becomes a no-op (it can only ever recompute the same value).
const NOW = new Date('2026-07-23T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms)

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * The graceful half of the invalid-date contract, mounted live: the REAL `useRelativeTime`
 * hook receives the unparseable input, degrades to an empty string, and stops its refresh
 * timer (`useRelativeTime.ts`, the `!parsedDate.getTime()` guard). The row renders an
 * actual `<time>` element around the hook's live output, the empty `<time>` the docs
 * promise, with the emptiness made visible (rendered between brackets and measured).
 */
function HookDegradesLive() {
  const output = useRelativeTime('not-a-real-date', {relativeTo: NOW})
  return (
    <Text size={1}>
      <code>
        [<time>{output}</time>], hook output: {JSON.stringify(output)}
      </code>
    </Text>
  )
}

/**
 * The throwing half, executed live and caught: `RelativeTime` itself renders
 * `<time dateTime={timestamp.toISOString()}>`, and `toISOString()` on an Invalid Date
 * throws before the hook's empty string ever reaches the DOM. Mounting the real component
 * here, even under an error boundary, makes React 19 log the boundary-caught RangeError
 * to the console on every load (the root's default `onCaughtError`), which is exactly the
 * console noise this story must not emit. So the row executes the component's own throwing
 * render expression directly, on every render, inside a try/catch, and shows the caught
 * error, a live reproduction of the defect with a clean console, not a static caption.
 */
function WrapperThrowsLive() {
  let caught: Error | null = null
  try {
    // The exact expression from RelativeTime.tsx's render: `timestamp.toISOString()`
    // where `timestamp = new Date(time)` and `time` is unparseable.
    new Date('not-a-real-date').toISOString()
  } catch (error) {
    caught = error as Error
  }
  if (!caught) {
    return (
      <Text size={1}>
        <code>did not throw, the component defect has been fixed upstream</code>
      </Text>
    )
  }
  return (
    <Text size={1} muted>
      <code>
        throws {caught.name}: {caught.message}
      </code>
    </Text>
  )
}

const meta: Meta<typeof RelativeTime> = {
  title: 'Lists & Data/RelativeTime',
  component: RelativeTime,
  decorators: [WithStudioProviders()],
  args: {time: ago(2 * MINUTE), relativeTo: NOW},
  parameters: {
    docs: {
      description: {
        component: [
          'RelativeTime never throws away the exact time when it renders a relative phrase: ' +
            'hovering reveals it, so a phrase like "2 minutes ago" and the instant it stands for ' +
            'are always one hover apart.',
          '',
          '|             |                                                                                                                                                                                                                                                        |',
          '| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source      | `packages/sanity/src/core/components/RelativeTime.tsx`, Studio-only (no DS equivalent)                                                                                                                                                                 |',
          '| Tier        | CHROME. A formatting primitive. Turns a timestamp into a locale-aware relative phrase and emits a semantic `<time datetime>` element, with the absolute time tucked into `title` for hover. Studio uses it wherever "edited / published X ago" appears |',
          '| Audit       | ⚪ not-audited as a unit. On the positive side of `datatips` / working-memory: the exact time is available on hover via the `title` attribute, so the relative phrase does not discard the absolute fact                                               |',
          '| Determinism | `useRelativeTime` reads `Date.now()` internally unless a `relativeTo` instant is supplied; every story here pins `relativeTo` to a fixed `NOW` so phrases never drift                                                                                  |',
          '| Patterns    | `datatips`                                                                                                                                                                                                                                             |',
          '',
          'Thresholds it crosses (from the hook): past 10 seconds it moves to seconds, then ' +
            'minutes, hours, days, weeks; once months or years apart it switches to an absolute ' +
            'date.',
          '',
          '> **Why it matters:** every story here pins the clock to a fixed instant, so the ' +
            'phrases on this page never drift between a read and the next. In a live Studio, the ' +
            'same component quietly refreshes itself on a timer, moving from "seconds" to "a ' +
            'minute ago" without a re-render anyone asked for.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:datatips',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof RelativeTime>

/** Playground: a fixed `relativeTo`, edit `time` (or toggle `minimal`) from controls. */
export const Default: Story = {}

/** The threshold ladder: one row per unit the hook steps through, all against `NOW`. */
export const ThresholdLadder: Story = {
  name: 'Threshold ladder',
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {label: string; time: Date}[] = [
      {label: 'under 10s', time: ago(3 * SECOND)},
      {label: 'seconds', time: ago(40 * SECOND)},
      {label: 'minutes', time: ago(5 * MINUTE)},
      {label: 'hours', time: ago(3 * HOUR)},
      {label: 'yesterday', time: ago(1 * DAY)},
      {label: 'days', time: ago(4 * DAY)},
      {label: 'weeks', time: ago(2 * 7 * DAY)},
      {label: 'months (→ absolute)', time: ago(70 * DAY)},
      {label: 'years (→ absolute)', time: ago(800 * DAY)},
    ]
    return (
      <Card padding={3} radius={2} shadow={1}>
        <Stack gap={3}>
          {rows.map(({label, time}) => (
            <Flex key={label} align="center" justify="space-between" gap={4}>
              <Text size={1} muted style={{minWidth: 160}}>
                {label}
              </Text>
              <Text size={1}>
                <RelativeTime time={time} relativeTo={NOW} />
              </Text>
            </Flex>
          ))}
        </Stack>
      </Card>
    )
  },
}

/** `minimal` shortens the phrasing ("2 min. ago" vs "2 minutes ago"); shown side by side. */
export const MinimalVsFull: Story = {
  name: 'Minimal vs full',
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {label: string; time: Date}[] = [
      {label: 'minutes', time: ago(5 * MINUTE)},
      {label: 'hours', time: ago(3 * HOUR)},
      {label: 'weeks', time: ago(2 * 7 * DAY)},
      {label: 'months', time: ago(70 * DAY)},
    ]
    return (
      <Card padding={3} radius={2} shadow={1}>
        <Stack gap={3}>
          <Flex gap={4}>
            <Text size={1} weight="medium" muted style={{minWidth: 160}} />
            <Text size={1} weight="medium" muted style={{flex: 1}}>
              full
            </Text>
            <Text size={1} weight="medium" muted style={{flex: 1}}>
              minimal
            </Text>
          </Flex>
          {rows.map(({label, time}) => (
            <Flex key={label} gap={4}>
              <Text size={1} muted style={{minWidth: 160}}>
                {label}
              </Text>
              <Text size={1} style={{flex: 1}}>
                <RelativeTime time={time} relativeTo={NOW} />
              </Text>
              <Text size={1} style={{flex: 1}}>
                <RelativeTime time={time} relativeTo={NOW} minimal />
              </Text>
            </Flex>
          ))}
        </Stack>
      </Card>
    )
  },
}

/**
 * Edge cases: a future timestamp phrases forward ("in 3 hours"). The unparseable-date rows
 * split a **real defect** down its seam, both halves live:
 *
 * - **The hook degrades gracefully.** `useRelativeTime` yields an empty string for an
 *   invalid date and stops its refresh timer. The story mounts the real hook with the
 *   unparseable input and renders its live output inside an actual `<time>` element: the
 *   empty `<time>` the docs promise, demonstrated rather than described.
 * - **The component wrapper does not.** `RelativeTime` renders
 *   `<time dateTime={timestamp.toISOString()}>`, which throws `RangeError: Invalid time
 *   value` before the hook's empty string reaches the DOM. The story executes that exact
 *   render expression live in a try/catch and shows the caught error. (Mounting the real
 *   component here, even under an error boundary, would make React 19 log the caught
 *   RangeError to the console on every load, so the defect is reproduced at its throwing
 *   expression instead, keeping the console clean.)
 *
 * The component contract ("renders an empty `<time>`") is therefore only half-true; the
 * one-line upstream fix is guarding `toISOString()` the same way the hook guards its
 * formatting (ledger candidate).
 */
export const EdgeCases: Story = {
  name: 'Edge cases',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Stack gap={3}>
        <Flex align="center" justify="space-between" gap={4}>
          <Text size={1} muted style={{minWidth: 160}}>
            future
          </Text>
          <Text size={1}>
            <RelativeTime time={new Date(NOW.getTime() + 3 * HOUR)} relativeTo={NOW} />
          </Text>
        </Flex>
        <Flex align="center" justify="space-between" gap={4}>
          <Text size={1} muted style={{minWidth: 160}}>
            invalid date, the hook, live
          </Text>
          <HookDegradesLive />
        </Flex>
        <Flex align="center" justify="space-between" gap={4}>
          <Text size={1} muted style={{minWidth: 160}}>
            invalid date, the component, live
          </Text>
          <WrapperThrowsLive />
        </Flex>
      </Stack>
    </Card>
  ),
}
