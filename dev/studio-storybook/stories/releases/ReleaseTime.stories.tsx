import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseAvatar} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {ReleaseTime} from '../../../../packages/sanity/src/core/releases/tool/components/ReleaseTime'
import {asTableRelease, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Why this needs the whole studio stack, when it looks like it needs nothing.
 *
 * `ReleaseTime` takes a release and returns text - about as pure as a component gets. But it
 * calls `useReleaseTime`, which calls `useTimeZone`, which calls `useToast` (to report a failed
 * timezone-preference write) AND `useClient` (which reaches `useSource`). Neither of those is
 * conceptually related to formatting a date, and both throw outright when absent.
 *
 * The lesson generalizes across this storybook, and it cost two rounds to learn here: a
 * component's provider requirements are the TRANSITIVE closure of its hook graph, not the set
 * you would infer from its props. The first fix supplied only `ToastProvider`, because that was
 * the error the console named; the next error underneath it was `useSource`. Reaching for
 * `WithStudioProviders` at the first sign of a missing context is usually faster than peeling
 * the layers one error at a time.
 */
const meta: Meta<typeof ReleaseTime> = {
  title: 'Releases/Release Time',
  component: ReleaseTime,
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'The distinction this component draws is between estimated and scheduled, and it is a ' +
            'distinction about state rather than about dates: the same field, rendered two ' +
            'different ways, means opposite things depending on whether the release has been ' +
            'committed to.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/components/ReleaseTime.tsx` |',
          '| Tier | CHROME |',
          '',
          'This is the "when" column of the releases table. It answers one question, when will ' +
            'this go live, and the answer has four genuinely different shapes. For asap and ' +
            'undecided releases there is no date to show, so it renders the release type as a ' +
            'word. For a scheduled release it renders a formatted timestamp, prefixed by whether ' +
            'that time is a commitment or a guess.',
          '',
          'An active release with `intendedPublishAt` set has a date, but nothing is going to ' +
            "happen at that date on its own, it is the author's intent, so the label reads " +
            '"Estimated". Move the release to the scheduled state and the same date becomes a ' +
            'commitment the system will act on, so the label reads "Scheduled" and a padlock ' +
            'appears. An interface that showed both as a bare timestamp would be lying about one ' +
            'of them.',
          '',
          'The undecided case is dimmed to 50% opacity, which is the component quietly ranking ' +
            "its own output: a date you have not decided is worth less of the reader's attention " +
            'than one you have.',
          '',
          'The formatted time runs through `useTimeZone`, so these render in the viewing ' +
            "machine's timezone with an abbreviation appended when it differs from the release " +
            'timezone. The fixture dates are fixed, the rendering of them is not. That same hook ' +
            'is why a component this simple needs the full studio provider stack, see the comment ' +
            'in the story source.',
          '',
          '> **Why it matters:** same field, same rendering mechanism, opposite meaning depending ' +
            'on release state. A date is a promise about the future only once the release has ' +
            'been committed to; before that, it is just intent, and the label has to say so.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:releases', 'chapter:cms', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof ReleaseTime>

function Row({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Flex align="center" gap={3}>
      <Text size={0} muted style={{minWidth: 150}}>
        {label}
      </Text>
      {children}
    </Flex>
  )
}

export const AllStates: Story = {
  name: 'Every shape of answer',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The four states side by side, which is the only way to see that they are four states and not one. Asap and undecided render a word; the two scheduled rows render the same date differently, and only the locked one carries a padlock.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Row label="asap">
        <ReleaseTime release={asTableRelease(releaseFixtures.asap)} />
      </Row>
      <Row label="undecided (dimmed)">
        <ReleaseTime release={asTableRelease(releaseFixtures.undecided)} />
      </Row>
      <Row label="active, has a date">
        <ReleaseTime release={asTableRelease(releaseFixtures.scheduled)} />
      </Row>
      <Row label="scheduled (locked)">
        <ReleaseTime release={asTableRelease(releaseFixtures.scheduledLocked)} />
      </Row>
    </Stack>
  ),
}

export const Estimated: Story = {
  name: 'Estimated - a date, not a commitment',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'An active release carrying `intendedPublishAt`. The date is real and the author picked it, but nothing will happen when it arrives unless somebody schedules or publishes the release. Hence "Estimated", and hence no padlock.',
      },
    },
  },
  render: () => <ReleaseTime release={asTableRelease(releaseFixtures.scheduled)} />,
}

export const ScheduledAndLocked: Story = {
  name: 'Scheduled - locked in',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The same date on a release in the `scheduled` state. The padlock is the message: the ' +
          'release is committed, its documents are read-only, and changing anything means ' +
          'unscheduling first. `isReleaseScheduledOrScheduling` covers the in-between moment ' +
          'while the schedule is being written, so the lock appears the instant the action is ' +
          'taken rather than after it lands.',
      },
    },
  },
  render: () => <ReleaseTime release={asTableRelease(releaseFixtures.scheduledLocked)} />,
}

export const ArchivedView: Story = {
  name: 'In the archived view',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'An archived or published release drops the "Estimated"/"Scheduled" prefix entirely and shows a bare timestamp. The prefix was a claim about the future; there is no future left to claim, so it goes.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Row label="archived">
        <ReleaseTime release={asTableRelease(releaseFixtures.archived)} />
      </Row>
      <Row label="published">
        <ReleaseTime release={asTableRelease(releaseFixtures.published)} />
      </Row>
    </Stack>
  ),
}

export const InContext: Story = {
  name: 'In context - the releases table column',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Where it lives: one column of the releases overview, read down rather than across. Scanned this way the ranking does its work - the committed dates carry a padlock, the estimates read plainly, and the undecided row recedes.',
      },
    },
  },
  render: () => (
    <Card border radius={2} shadow={1} padding={2} style={{maxWidth: 460}}>
      <Stack gap={2}>
        {[
          releaseFixtures.asap,
          releaseFixtures.scheduledLocked,
          releaseFixtures.scheduled,
          releaseFixtures.undecided,
        ].map((release) => (
          <Card key={release._id} radius={2} padding={2} tone="transparent">
            <Flex align="center" gap={2}>
              <ReleaseAvatar release={release} />
              <Text size={1} style={{flex: 1}}>
                {release.metadata.title}
              </Text>
              <ReleaseTime release={asTableRelease(release)} />
            </Flex>
          </Card>
        ))}
      </Stack>
    </Card>
  ),
}
