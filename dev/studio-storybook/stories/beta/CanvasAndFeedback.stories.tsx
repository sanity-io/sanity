import {type SanityDocument} from '@sanity/client'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UnlinkFromCanvasDialog} from '../../../../packages/sanity/src/core/canvas/actions/UnlinkFromCanvas/UnlinkFromCanvasDialog'
import {FeedbackDialog} from '../../../../packages/sanity/src/core/feedback/components/FeedbackDialog'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

const DOC: SanityDocument = {
  _id: 'article-launch',
  _type: 'article',
  _rev: 'rev-1',
  _createdAt: '2026-07-01T09:00:00Z',
  _updatedAt: '2026-07-20T14:30:00Z',
  title: 'The launch announcement',
} as SanityDocument

const meta: Meta = {
  title: 'Canvas/Unlink and Feedback',
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'Unlinking a document from Canvas and reporting a problem to Sanity sit at opposite ' +
            'corners of the studio, but they share a shape: both hand something to a system ' +
            'outside the studio and cannot fully control what happens next.',
          '',
          '|          |                                                                         |',
          '| -------- | ----------------------------------------------------------------------- |',
          '| Source   | `core/canvas/actions/UnlinkFromCanvas/` and `core/feedback/components/` |',
          '| Tier     | SERVICE                                                                 |',
          '| Patterns | `error-messages`                                                        |',
          '',
          '`UnlinkFromCanvasDialog` is the more consequential. A document linked to Canvas is ' +
            'authored _there_, and unlinking severs that connection: the Studio copy stops ' +
            'receiving updates. Reversible in principle, disorienting in practice. It confirms ' +
            'and reports rather than acting silently.',
          '',
          '`FeedbackDialog` is the one users see. It posts to Sentry with a screenshot ' +
            'attachment, and its `dsn`, `source` and `feedbackVersion` props are the reason the ' +
            'same component can serve several trigger points while keeping the reports ' +
            'distinguishable at the other end.',
          '',
          '> **Why it matters:** both are outbound dialogs, so they get a status machine (idle, ' +
            'loading, success or error) rather than a simple confirm, and the error and success ' +
            'arms are the ones a developer never sees while building the happy path.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:cms', 'pattern:error-messages', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

export const UnlinkIdle: Story = {
  name: 'UnlinkFromCanvasDialog - idle',
  parameters: {
    docs: {
      description: {
        story:
          'The confirmation, before anything happens. The document is named, because "unlink from Canvas?" without a subject is the shape of confirmation people click through.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <UnlinkFromCanvasDialog
        document={DOC}
        status="idle"
        error={null}
        onClose={noop}
        handleUnlink={noop}
      />
    ),
}

export const UnlinkLoading: Story = {
  name: 'UnlinkFromCanvasDialog - unlinking',
  parameters: {
    docs: {
      description: {
        story:
          'In flight. The dialog stays open and the confirm goes to a loading state - the link still exists until the operation returns, and closing early would claim otherwise. Same discipline as every other outbound action in this catalog.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <UnlinkFromCanvasDialog
        document={DOC}
        status="loading"
        error={null}
        onClose={noop}
        handleUnlink={noop}
      />
    ),
}

export const UnlinkError: Story = {
  name: 'UnlinkFromCanvasDialog - it failed',
  parameters: {
    docs: {
      description: {
        story:
          'The arm most dialogs never implement. The unlink failed, the dialog reports why and stays open so the action can be retried - rather than closing and firing a toast, which would leave the user unsure whether the document is still linked.\n\nThis is the state worth having a story for precisely because you cannot reach it on demand while developing.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <UnlinkFromCanvasDialog
        document={DOC}
        status="error"
        error="The Canvas service did not respond. Please try again."
        onClose={noop}
        handleUnlink={noop}
      />
    ),
}

export const Feedback: Story = {
  name: 'FeedbackDialog',
  parameters: {
    docs: {
      description: {
        story:
          'The report-a-problem dialog. Note the props that never appear on screen: `source`, `feedbackVersion` and `extraTags` are all metadata travelling with the report so it can be routed and grouped once it arrives.\n\n`feedbackVersion` in particular is a small piece of foresight - it lets the receiving end tell reports made under one tag schema from reports made under a later one, the same way telemetry consent is versioned. Without it, changing the tags silently corrupts every historical comparison.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <FeedbackDialog
        onClose={noop}
        dsn="https://examplekey@o0.ingest.sentry.io/0"
        feedbackVersion="1"
        source="storybook"
      />
    ),
}

export const FeedbackWithTags: Story = {
  name: 'FeedbackDialog - from a specific surface',
  parameters: {
    docs: {
      description: {
        story:
          'The same dialog raised from a named surface with extra tags attached. Identical to the reader; entirely different on arrival, which is the point of keeping the identifying metadata out of the visible copy.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <FeedbackDialog
        onClose={noop}
        dsn="https://examplekey@o0.ingest.sentry.io/0"
        feedbackVersion="1"
        source="studio-help-menu"
        extraTags={{tool: 'structure', surface: 'document-pane'}}
      />
    ),
}
