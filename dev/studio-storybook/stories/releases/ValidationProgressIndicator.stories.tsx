import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ValidationProgressIndicator} from '../../../../packages/sanity/src/core/releases/tool/detail/ValidationProgressIndicator'
import {createDocumentInRelease, documentsInRelease} from '../../lib/releaseFixtures'

const meta: Meta<typeof ValidationProgressIndicator> = {
  title: 'Releases/Validation Progress Indicator',
  component: ValidationProgressIndicator,
  parameters: {
    docs: {
      description: {
        component: [
          'This component has a life cycle rather than a set of states, and the transitions are ' +
            'the design, except one of them was clearly never meant to fire the way it does.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/detail/ValidationProgressIndicator.tsx` |',
          '| Tier | SERVICE |',
          '| Audit | 🟡 needs-work (`error-messages`). The error state collapses on the same 2.5s success timer, so the sentence explaining what is wrong removes itself from a release that cannot publish. Ledger #53 |',
          '| Patterns | `error-messages` |',
          '',
          'The small badge in a release dashboard that says whether the documents in this release ' +
            'are safe to publish. It is the answer to "can I press the button yet". Validation for ' +
            'a release is a fan-out: every document in it is validated independently, and they ' +
            'finish at different times. This component collapses that into one line, a progress ' +
            'ring while documents are still going, then a verdict.',
          '',
          'While validating it shows a ring and a running count. When everything comes back clean ' +
            'it shows "All documents validated", and then, 2.5 seconds later, it shrinks to a bare ' +
            'checkmark and stays that way for the rest of the session, because a permanent green ' +
            'banner announcing that nothing is wrong is noise. That much is clearly deliberate.',
          '',
          'What is less clearly deliberate is that the error state collapses on the same timer. ' +
            '"All documents validated, issues found" is on screen for 2.5 seconds and then reduces ' +
            'to a red circle whose meaning is available only on hover. The tone stays critical, so ' +
            'the badge still reads as wrong, but the sentence explaining what is wrong removes ' +
            'itself, on a clock, from a release you cannot publish. Timing it is the only way to ' +
            'see this; both outcomes look identical after three seconds apart from the glyph.',
          '',
          'It also returns `null` when validation has neither started nor finished, which is the ' +
            'state the dashboard opens in, so the badge appears rather than flickering from empty ' +
            'to full.',
          '',
          'The documents are built by `lib/releaseFixtures`, not fetched. `useReleaseDocuments` ' +
            'runs a live GROQ query and ignores the mocked release store entirely, so anything ' +
            'that takes `documents` as a prop is storied by handing it the array directly.',
          '',
          '> **Why it matters:** the same 2.5-second timer that correctly retires a success ' +
            'message also retires an error message, and after three seconds the two states look ' +
            'identical apart from the glyph. A release that cannot publish loses its explanation ' +
            'on a clock, which is the wrong failure mode for a validation gate.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:error-messages',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof ValidationProgressIndicator>

function Frame({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      <Text size={0} muted>
        {label}
      </Text>
      <Flex>
        <Card border radius="full" padding={1}>
          {children}
        </Card>
      </Flex>
    </Stack>
  )
}

export const Validating: Story = {
  name: 'Validating',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Two of four documents have come back. The ring is a real progress arc driven by `validatedCount / totalCount`, not a spinner - so on a large release it tells you whether the wait is nearly over or has barely begun.',
      },
    },
  },
  render: () => (
    <Frame label="2 of 4 validated">
      <ValidationProgressIndicator documents={documentsInRelease.validating()} />
    </Frame>
  ),
}

export const AllValid: Story = {
  name: 'All valid - watch it collapse',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Everything came back clean. Leave this story open: after 2.5 seconds the text disappears and the badge shrinks to a checkmark, and it will not expand again. That is the transient-success rule in action - you get told once, then the space is given back.',
      },
    },
  },
  render: () => (
    <Frame label="all validated (collapses after 2.5s)">
      <ValidationProgressIndicator documents={documentsInRelease.valid()} />
    </Frame>
  ),
}

export const HasErrors: Story = {
  name: 'Errors found',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'One document failed validation. Watch this story from the moment it loads: for 2.5 seconds it reads "All documents validated, issues found", and then the text disappears and you are left with a red circle. The tone stays critical so the badge still signals a problem, and a tooltip still carries the message - but you have to know to hover for it.\n\nThe cause is that `isFinished` is `validatedCount === totalCount`, which is true whether the documents passed or failed, and the same 2.5-second timer runs off it. The state variable is even called `showCheckmark`, which suggests the error path was not what anyone had in mind when the timer was written. Filed as ledger #53.\n\nThe summary not naming the failing document is correct, incidentally - the document table below it carries the per-row detail, and this is only meant to stop you pressing publish. The problem is that after three seconds it barely does that either.',
      },
    },
  },
  render: () => (
    <Frame label="one document has an error">
      <ValidationProgressIndicator documents={documentsInRelease.withErrors()} />
    </Frame>
  ),
}

export const MinimalLayout: Story = {
  name: 'Minimal layout',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The same states with `layout="minimal"`, which drops the padding and the text from the start. Used where the badge sits inside something that already has a label - a table cell, a row of status chips - so the icon alone carries it.',
      },
    },
  },
  render: () => (
    <Flex gap={5} wrap="wrap">
      <Frame label="validating">
        <ValidationProgressIndicator documents={documentsInRelease.validating()} layout="minimal" />
      </Frame>
      <Frame label="all valid">
        <ValidationProgressIndicator documents={documentsInRelease.valid()} layout="minimal" />
      </Frame>
      <Frame label="has errors">
        <ValidationProgressIndicator documents={documentsInRelease.withErrors()} layout="minimal" />
      </Frame>
    </Flex>
  ),
}

export const GoingToUnpublish: Story = {
  name: 'Documents marked for unpublishing',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'A document set to be unpublished by this release carries `_system.delete`, and validation skips it entirely - the content is being removed, so whether it satisfies the schema is beside the point. `getDocumentValidationLoading` still counts it as validated, which is the right call: otherwise a release full of unpublishes would sit at a progress ring that never completes.',
      },
    },
  },
  render: () => (
    <Frame label="one document is being unpublished; it counts as validated">
      <ValidationProgressIndicator documents={documentsInRelease.goingToUnpublish()} />
    </Frame>
  ),
}

export const NothingToReport: Story = {
  name: 'Renders nothing',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Not a bug: with no document validating and none finished, the component returns `null`. This is the moment a release dashboard is first opened, before any validation has been kicked off. Storied explicitly because "renders nothing" is a decision, and an empty frame here is the proof that it was made on purpose.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Card border style={{borderStyle: 'dashed'}} radius={2} padding={4}>
        <ValidationProgressIndicator documents={[]} />
      </Card>
      <Text size={0} muted>
        the dashed box is the story frame; the component itself rendered nothing
      </Text>
    </Stack>
  ),
}

export const InContext: Story = {
  name: 'In context - a release dashboard header',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Where it sits: beside the release title, above the document table, next to the publish button it is implicitly gating. Seen here the summary reads as a precondition rather than a notification, which is what it is.',
      },
    },
  },
  render: () => (
    <Card border radius={2} shadow={1} padding={3} style={{maxWidth: 520}}>
      <Flex align="center" gap={3}>
        <Stack gap={3} flex={1}>
          <Text size={2} weight="semibold">
            Autumn campaign
          </Text>
          <Text size={0} muted>
            3 documents
          </Text>
        </Stack>
        <ValidationProgressIndicator
          documents={[
            createDocumentInRelease({title: 'Anna Karenina'}),
            createDocumentInRelease({title: 'War and Peace'}),
            createDocumentInRelease({title: 'Persuasion', validating: true}),
          ]}
        />
      </Flex>
    </Card>
  ),
}
