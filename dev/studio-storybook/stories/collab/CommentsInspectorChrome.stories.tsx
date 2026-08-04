import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {CommentsInspectorError} from '../../../../packages/sanity/src/core/comments/plugin/inspector/CommentsInspectorError'
import {CommentsInspectorHeader} from '../../../../packages/sanity/src/core/comments/plugin/inspector/CommentsInspectorHeader'
import {type CommentStatus} from '../../../../packages/sanity/src/core/comments/types'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

function Panel({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} overflow="hidden" style={{width: 360}}>
      {children}
    </Card>
  )
}

const meta: Meta = {
  title: 'Collaboration/Comments Inspector Chrome',
  decorators: [WithStudioProviders()],
  parameters: {
    // No shared component prop type; each story is a fixed illustration of one piece.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The header and the error state of the comments inspector, the panel that slides in ' +
            'beside a document to show its comment threads, is where the two decisions on this ' +
            'surface live.',
          '',
          '|        |                                                       |',
          '| ------ | ----------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/comments/plugin/inspector/` |',
          '| Tier   | CHROME                                                |',
          '',
          'The inspector _body_ needs an addon dataset (comments live in a separate dataset ' +
            'from content) and is out of scope. Its chrome does not.',
          '',
          '> **Why the header matters more than it looks:** it carries an open/resolved toggle, ' +
            'and that toggle is the answer to a question every commenting system has to settle - ' +
            'what happens to a resolved thread? Deleting it loses the reasoning; leaving it in ' +
            'the list buries the live discussion under settled ones. Sanity keeps both and puts a ' +
            'segmented control at the top, so resolved threads are one click away and zero clicks ' +
            'in the way. Note it is a two-value segmented control rather than a filter dropdown: ' +
            'with exactly two states, a dropdown would hide half the model behind a click.',
          '',
          'The `mode` prop reflects whether comments are on a paid plan or in upsell - the same ' +
            'component serves both, with the upsell variant losing the controls it cannot honour.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:cms', 'pattern:collaboration', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Header: Story = {
  name: 'CommentsInspectorHeader',
  parameters: {
    docs: {
      description: {
        story:
          'The header in its default state, showing open threads. Click between Open and Resolved: the view is stateful here, so the control behaves as it does in the studio rather than posing.',
      },
    },
  },
  render: function HeaderStory() {
    const [view, setView] = useState<CommentStatus>('open')
    return (
      <Stack gap={4}>
        <Panel>
          <CommentsInspectorHeader
            view={view}
            onViewChange={setView}
            onClose={noop}
            mode="default"
          />
        </Panel>
        <Text size={0} muted>
          viewing: {view}
        </Text>
      </Stack>
    )
  },
}

export const HeaderResolved: Story = {
  name: 'CommentsInspectorHeader - resolved view',
  parameters: {
    docs: {
      description: {
        story:
          'Pinned to the resolved view. Worth having separately because it is the state a reader arrives in after resolving a thread, and the one where the header has to make it obvious that the list you are looking at is not the live one.',
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsInspectorHeader view="resolved" onViewChange={noop} onClose={noop} mode="default" />
    </Panel>
  ),
}

export const HeaderUpsell: Story = {
  name: 'CommentsInspectorHeader - upsell mode',
  parameters: {
    docs: {
      description: {
        story: [
          'On a plan without comments. The same header renders in `upsell` mode, dropping the ' +
            'controls it could not honour rather than showing them disabled.',
          '',
          'That is the opposite call from `CreateReleaseMenuItem`, which keeps its disabled ' +
            'row with a tooltip - and both are defensible for different reasons. A disabled ' +
            'control teaches a person the feature exists and is unavailable; removing it keeps ' +
            'a browsing-only surface from looking broken. The inconsistency is worth noticing ' +
            'rather than assuming one of them is wrong.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsInspectorHeader view="open" onViewChange={noop} onClose={noop} mode="upsell" />
    </Panel>
  ),
}

export const Error_: Story = {
  name: 'CommentsInspectorError',
  parameters: {
    docs: {
      description: {
        story:
          'The inspector could not load its comments - usually the addon dataset being unreachable, which is a distinct failure from the document itself failing.\n\nIt shows the underlying `error.message` rather than a generic sentence. For a failure whose most common cause is a dataset that has not been provisioned, the raw message is the part a developer can act on, and an editor loses nothing by seeing it.',
      },
    },
  },
  render: () => (
    <Panel>
      <CommentsInspectorError
        error={new Error('The comments dataset could not be reached (404).')}
      />
    </Panel>
  ),
}

export const InContext: Story = {
  name: 'In context - the inspector panel',
  parameters: {
    docs: {
      description: {
        story:
          'Header over an error, as the panel would compose them. The body between them is the part that needs an addon dataset; everything framing it is here.',
      },
    },
  },
  render: () => (
    <Panel>
      <Stack gap={0}>
        <CommentsInspectorHeader view="open" onViewChange={noop} onClose={noop} mode="default" />
        <CommentsInspectorError
          error={new Error('The comments dataset could not be reached (404).')}
        />
      </Stack>
    </Panel>
  ),
}
