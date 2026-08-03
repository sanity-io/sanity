import {Card, Flex, LayerProvider, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleasePublishAllButton} from '../../../../packages/sanity/src/core/releases/tool/components/releaseCTAButtons/ReleasePublishAllButton'
import {ReleaseRevertButton} from '../../../../packages/sanity/src/core/releases/tool/components/releaseCTAButtons/ReleaseRevertButton/ReleaseRevertButton'
import {ReleaseScheduleButton} from '../../../../packages/sanity/src/core/releases/tool/components/releaseCTAButtons/ReleaseScheduleButton'
import {ReleaseUnscheduleButton} from '../../../../packages/sanity/src/core/releases/tool/components/releaseCTAButtons/ReleaseUnscheduleButton'
import {allReleaseFixtures, documentsInRelease, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const VALID = documentsInRelease.valid()
const WITH_ERRORS = documentsInRelease.withErrors()

function Bar({label, children}: {label?: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      {label && (
        <Text size={0} muted>
          {label}
        </Text>
      )}
      <Card border radius={2} padding={3} style={{width: 'fit-content'}}>
        <Flex gap={2}>{children}</Flex>
      </Card>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Releases/CTA Buttons',
  decorators: [WithStudioProviders({releases: allReleaseFixtures})],
  parameters: {
    docs: {
      description: {
        component: [
          'Every one of these four buttons is irreversible at the scale of a whole release, and ' +
            'the design reflects that in a way single-document actions do not: they all confirm, ' +
            'and they all disable themselves against the validation state of the documents they ' +
            'would act on.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/components/releaseCTAButtons/` |',
          '| Tier | SERVICE |',
          '| Patterns | `destructive-confirmation` |',
          '',
          'The four buttons in the footer of a release dashboard: publish everything, schedule ' +
            'it, unschedule it, revert it. Which one you see depends entirely on what state the ' +
            'release is in. Each takes the release plus the documents in it, and each opens a ' +
            'confirmation before doing anything.',
          '',
          'A release with an invalid document cannot be published, and the button says so rather ' +
            'than failing at submit. `ReleaseRevertButton` goes further: it offers a staged revert ' +
            '(create a new release that undoes this one, which is itself reviewable) as well as an ' +
            'immediate one, because undoing a publish that has already reached readers is a ' +
            'content decision rather than a click.',
          '',
          'Note that all four accept `isMenuItem`. The same component renders as a footer button ' +
            "or as a row in the release's context menu, which is how the actions stay identical in " +
            'two places rather than being reimplemented as menu items that drift.',
          '',
          'Documents come from `lib/releaseFixtures`, since `useReleaseDocuments` runs a live ' +
            'query and ignores the mocked store. The permission checks resolve through the seeded ' +
            '`ReleasePermissions` value, so the disabled-by-permission branch is reachable.',
          '',
          '> **Why it matters:** a validation gate and a confirmation are doing two different ' +
            'jobs, and neither alone is enough. A gate without a confirmation can still commit ' +
            'blind on the happy path; a confirmation without a gate lets an editor confirm their ' +
            'way past a document that cannot legitimately publish.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:destructive-confirmation',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const PublishAll: Story = {
  name: 'Publish all',
  parameters: {
    docs: {
      description: {
        story:
          'The primary action on an active asap release. Click it: a confirmation appears naming how many documents are about to go live, because "publish" here means publishing a set rather than a thing, and the count is the part worth checking before you commit.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleasePublishAllButton release={releaseFixtures.asap} documents={VALID} />
    </Bar>
  ),
}

export const PublishAllBlocked: Story = {
  name: 'Publish all - blocked by validation',
  parameters: {
    docs: {
      description: {
        story:
          'The same button with one invalid document in the release. It is disabled, and hovering says why.\n\nThis is the pairing that makes `ValidationProgressIndicator` matter: the indicator reports the state, this button enforces it. Neither alone would be enough - an indicator without enforcement is advice, and enforcement without an indicator is a dead button with no explanation.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleasePublishAllButton release={releaseFixtures.asap} documents={WITH_ERRORS} />
    </Bar>
  ),
}

export const PublishAllDisabled: Story = {
  name: 'Publish all - disabled by the caller',
  parameters: {
    docs: {
      description: {
        story:
          'The explicit `disabled` prop, which the dashboard uses while an operation is already ' +
          'in flight. Distinct from the validation case above: same appearance, different ' +
          'cause. Both are storied so the two are not conflated when debugging a stuck button.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleasePublishAllButton release={releaseFixtures.asap} documents={VALID} disabled />
    </Bar>
  ),
}

export const Schedule: Story = {
  name: 'Schedule',
  parameters: {
    docs: {
      description: {
        story:
          'For a release with an intended publish date. Scheduling is the moment the date stops being an intention and becomes a commitment the system will act on - after this, the release is locked and its documents are read-only. The confirmation says so.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleaseScheduleButton release={releaseFixtures.scheduled} documents={VALID} />
    </Bar>
  ),
}

export const ScheduleBlocked: Story = {
  name: 'Schedule - blocked by validation',
  parameters: {
    docs: {
      description: {
        story:
          'Same gate as publish. Worth having separately, because scheduling puts the publish in the future and it would be easy to argue validation could be deferred until then. It is not: a release that cannot publish should not be schedulable, or the failure surfaces at 3am with nobody watching.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleaseScheduleButton release={releaseFixtures.scheduled} documents={WITH_ERRORS} />
    </Bar>
  ),
}

export const Unschedule: Story = {
  name: 'Unschedule',
  parameters: {
    docs: {
      description: {
        story:
          'The inverse, shown on a release in the `scheduled` state. Note it is the only one of the four with no validation gate - unscheduling can never make anything worse, so there is nothing to check. An action that only ever reduces risk should not be obstructed.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleaseUnscheduleButton release={releaseFixtures.scheduledLocked} documents={VALID} />
    </Bar>
  ),
}

export const Revert: Story = {
  name: 'Revert a published release',
  parameters: {
    docs: {
      description: {
        story:
          'The richest of the four. Open the confirmation and read the choice it offers: revert **immediately**, or stage the revert as a new release you can review before publishing.\n\nThat second option is the interesting one. Undoing a publish that readers have already seen is a content decision with its own timing, and collapsing it into a single irreversible click would be treating it as a mistake to erase rather than a change to make. Offering the staged path lets an editor undo something carefully.',
      },
    },
  },
  render: () => (
    <Bar>
      <ReleaseRevertButton release={releaseFixtures.published} documents={VALID} />
    </Bar>
  ),
}

export const AsMenuItems: Story = {
  name: 'The same actions as menu items',
  parameters: {
    docs: {
      description: {
        story:
          '`isMenuItem` renders the identical logic as a menu row instead of a button. The point is that the confirmation, the validation gate and the permission check travel with the action rather than with the button - so the menu version cannot quietly skip a check the footer version performs.',
      },
    },
  },
  render: () => (
    // A real `MenuItem` needs a `Menu` ancestor (`useMenu()` throws without one) and `Menu`
    // itself needs a `LayerProvider`. Both are the actual containers these rows live in.
    <LayerProvider>
      <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 280}}>
        <Menu>
          <ReleasePublishAllButton release={releaseFixtures.asap} documents={VALID} isMenuItem />
          <ReleaseScheduleButton release={releaseFixtures.scheduled} documents={VALID} isMenuItem />
        </Menu>
      </Card>
    </LayerProvider>
  ),
}

export const ByReleaseState: Story = {
  name: 'Which button appears when',
  parameters: {
    docs: {
      description: {
        story:
          'The four actions against the release states that produce them, read as a column. An ' +
          'active release offers publish or schedule; a scheduled one offers unschedule; a ' +
          'published one offers revert. There is no state that offers all four. The dashboard ' +
          'footer swaps its contents rather than disabling three buttons out of four.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Bar label="active, asap">
        <ReleasePublishAllButton release={releaseFixtures.asap} documents={VALID} />
      </Bar>
      <Bar label="active, with a date">
        <ReleaseScheduleButton release={releaseFixtures.scheduled} documents={VALID} />
      </Bar>
      <Bar label="scheduled">
        <ReleaseUnscheduleButton release={releaseFixtures.scheduledLocked} documents={VALID} />
      </Bar>
      <Bar label="published">
        <ReleaseRevertButton release={releaseFixtures.published} documents={VALID} />
      </Bar>
    </Stack>
  ),
}
