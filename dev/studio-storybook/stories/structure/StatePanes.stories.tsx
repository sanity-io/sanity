import {Card, Code, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorPane} from '../../../../packages/sanity/src/structure/panes/error/ErrorPane'
import {LoadingPane} from '../../../../packages/sanity/src/structure/panes/loading/LoadingPane'
import {UnknownPane} from '../../../../packages/sanity/src/structure/panes/unknown/UnknownPaneType'
import {PaneStage} from '../../lib/paneStage'
import {WithStudioProviders} from '../../lib/testProvider'

const meta: Meta = {
  title: 'Document Pane/State Panes',
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'A pane chain resolves each column from the one before it, asynchronously and ' +
            'fallibly. These are the three answers for when that resolution does not land: one ' +
            'for still working on it, one for that went wrong, one for I do not know what that ' +
            'is.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/{loading,error,unknown}/` |',
          '| Tier | SERVICE |',
          '| Patterns | `error-messages` · `skeleton-first-loading` |',
          '',
          'They are siblings by position rather than by code: any of them can appear in any ' +
            'column of the pane layout, standing in for whatever should have been there.',
          '',
          '> **Why it matters:** every column needs an answer for "the pane is not here yet" ' +
            'and "the pane will never be here", and crucially those answers have to occupy a ' +
            'pane-shaped hole, keeping the column, its width, its header and its place in the ' +
            'chain. Substituting a bare error message would collapse the layout and take the ' +
            'panes to the left of it with it. These three exist so that a failure in column three ' +
            'does not disturb columns one and two.',
          '',
          'All three are the pane shell first and content second. The interesting part of each ' +
            'is the chrome rather than the message.',
          '',
          'They need the pane layout context and nothing else. The layout hook throws when that ' +
            'context is missing, so a pane cannot be mounted bare, but the full structure ' +
            'resolver, router and tool provider are all unnecessary here.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:error-messages',
    'pattern:skeleton-first-loading',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const Loading: Story = {
  name: 'LoadingPane - resolving',
  parameters: {
    docs: {
      description: {
        story:
          'The default loading pane, showing the message `getWaitMessages` produces for an empty path. It fades in over 200ms rather than appearing instantly - `data-mounted` is set on the next animation frame, and the CSS transitions opacity from 0.\n\nThat fade is doing real work. Pane resolution is usually fast enough that a loading state would flash: appear and vanish inside a couple of frames, which reads as a flicker rather than as information. Fading in means a resolution that completes quickly never shows anything at all, while a slow one arrives gently.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <LoadingPane paneKey="loading" />
    </PaneStage>
  ),
}

export const LoadingWithTitle: Story = {
  name: 'LoadingPane - with a known title',
  parameters: {
    docs: {
      description: {
        story:
          'When the resolver already knows what it is loading, the title replaces the generic message. Worth noticing that `title` wins over `message` entirely - a pane that knows it is fetching "Blog posts" says so instead of saying "Loading…", because the specific answer is strictly better and the component does not try to show both.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <LoadingPane paneKey="loading" title="Blog posts" />
    </PaneStage>
  ),
}

export const LoadingWithMessage: Story = {
  name: 'LoadingPane - a caller-supplied message',
  parameters: {
    docs: {
      description: {
        story:
          '`message` accepts a string, or a function, or a function returning an **observable** - which is the form the default `getWaitMessages` uses. The observable exists so a long wait can escalate its own copy over time ("Loading…" then something more apologetic), without the pane holding a timer. Here it is the simple string form.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <LoadingPane paneKey="loading" message="Resolving structure…" />
    </PaneStage>
  ),
}

export const Errored: Story = {
  name: 'ErrorPane',
  parameters: {
    docs: {
      description: {
        story:
          'The critical-toned pane the structure tool drops in when a pane cannot be built. It is deliberately a shell: it supplies the tone, the header and the padding, and takes the actual explanation as `children`. The caller knows what failed; the pane only knows how a failure should look.\n\nThe tone is on the `Pane`, not on a card inside it, so the whole column reads as failed - the correct scope when it is the column that is broken rather than something in it.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <ErrorPane paneKey="error">
        <Stack gap={4}>
          <Text size={1} weight="medium">
            Could not resolve pane
          </Text>
          <Text size={1} muted>
            The document type <code>blogPost</code> is not defined in this schema.
          </Text>
        </Stack>
      </ErrorPane>
    </PaneStage>
  ),
}

export const ErrorWithCustomTitle: Story = {
  name: 'ErrorPane - with a title and tone',
  parameters: {
    docs: {
      description: {
        story:
          'Both `title` and `tone` are overridable, so the same shell serves a hard failure and a softer one. A caution-toned pane titled "Unavailable" says something different from a critical one titled "Error" - the first invites you to try later, the second does not.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <ErrorPane paneKey="error" title="Unavailable" tone="caution">
        <Text size={1} muted>
          This pane requires a permission your role does not have.
        </Text>
      </ErrorPane>
    </PaneStage>
  ),
}

export const UnknownType: Story = {
  name: 'UnknownPane - an unrecognised type',
  parameters: {
    docs: {
      description: {
        story:
          'A structure node whose `type` the resolver has no handler for. The type name is interpolated into the message, which is the difference between an error a developer can act on and one they have to reproduce first.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <UnknownPane paneKey="unknown" isSelected pane={{type: 'customDashboard'}} />
    </PaneStage>
  ),
}

export const UnknownMissingType: Story = {
  name: 'UnknownPane - no type at all',
  parameters: {
    docs: {
      description: {
        story:
          'The other branch: a structure node with no `type` property. Different message, and correctly so - "I do not handle `customDashboard`" and "you did not tell me what this is" are different mistakes with different fixes. Most components would collapse these into one string; this one does not.\n\nNote the guard is `isRecord(pane) && pane.type`, so a node that is not even an object lands here too rather than throwing.',
      },
    },
  },
  render: () => (
    <PaneStage>
      <UnknownPane paneKey="unknown" isSelected pane={{}} />
    </PaneStage>
  ),
}

export const SideBySide: Story = {
  name: 'All three, in a pane chain',
  parameters: {
    docs: {
      description: {
        story:
          'The point of the family, shown as the structure tool would show it: three columns side by side, each in a different state, none of them disturbing the others. This is what "the failure occupies a pane-shaped hole" buys - a broken third column while the first two keep working.',
      },
    },
  },
  render: () => (
    <PaneStage height={420}>
      <LoadingPane paneKey="p1" title="Blog posts" minWidth={280} />
      <UnknownPane paneKey="p2" isSelected={false} pane={{type: 'customDashboard'}} />
      <ErrorPane paneKey="p3" minWidth={280}>
        <Text size={1} muted>
          The document type <code>blogPost</code> is not defined in this schema.
        </Text>
      </ErrorPane>
    </PaneStage>
  ),
}

export const InContext: Story = {
  name: 'In context - what a caller passes',
  parameters: {
    docs: {
      description: {
        story:
          'The shape of a real call site. `ErrorPane` is the only one of the three that is a genuine shell, and this is what gets handed to it in practice: a heading, the underlying message, and whatever recovery the caller can offer. The pane contributes the tone, the header, the scroll behaviour and the column.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <PaneStage height={320}>
        <ErrorPane paneKey="error" title="Could not load documents">
          <Stack gap={4}>
            <Text size={1} muted>
              The query failed with a 403. Your role may not have read access to this document type.
            </Text>
            <Card border radius={2} overflow="auto" padding={3} tone="inherit">
              <Code size={1}>{`*[_type == "blogPost"] | order(_updatedAt desc)`}</Code>
            </Card>
          </Stack>
        </ErrorPane>
      </PaneStage>
      <Text size={0} muted>
        The pane supplies tone, header, padding and scrolling. Everything inside it is the
        caller&apos;s.
      </Text>
    </Stack>
  ),
}
