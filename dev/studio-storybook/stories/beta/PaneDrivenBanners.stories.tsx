import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CanvasLinkedBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/CanvasLinkedBanner'
import {DeletedDocumentBanners} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/DeletedDocumentBanners'
import {DeprecatedDocumentTypeBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/DeprecatedDocumentTypeBanner'
import {InsufficientPermissionBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/InsufficientPermissionBanner'
import {RevisionNotFoundBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/RevisionNotFoundBanner'
import {UnpublishedDocumentBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/UnpublishedDocumentBanner'
import {makeSchemaType, WithDocumentPaneStub} from '../../lib/documentPaneStub'
import {WithPerspective} from '../../lib/perspectiveHarness'
import {releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

function Stage({label, children}: {label?: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      {label && (
        <Text size={0} muted>
          {label}
        </Text>
      )}
      <Card border radius={2} overflow="hidden" style={{maxWidth: 720}}>
        {children}
      </Card>
    </Stack>
  )
}

function NothingRendered({children, note}: {children: React.ReactNode; note: string}) {
  return (
    <Stack gap={3}>
      <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 720}}>
        {children}
      </Card>
      <Text size={0} muted>
        {note}
      </Text>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Document Banners/Pane-driven',
  parameters: {
    docs: {
      description: {
        component: [
          "Whether a banner appears at all is sometimes the banner's whole job, and these seven " +
            'decide that by reading the document pane directly, each mounted as itself with the ' +
            'pane supplying its input.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/documentPanel/banners/` |',
          '| Tier | SERVICE |',
          '| Patterns | `visible-system-state` |',
          '| Coverage | eight plain data fields across all seven banners |',
          '',
          'These seven were originally left out on the reasoning that stubbing `useDocumentPane` ' +
            'would story the appearance while discarding the decision. That reasoning was borrowed ' +
            'from `DocumentPane` itself, where the pane genuinely is the subject, and it does not ' +
            'transfer. Look at what these actually read: `revisionNotFound` is a boolean. ' +
            '`schemaType` is schema data. `isDeleted` / `isDeleting` / `ready` are three flags. The ' +
            '`if (!revisionNotFound) return null` that decides whether a banner appears is the ' +
            "banner's code, not the pane's, so handing it a flag and watching it decide tests " +
            'exactly the thing being storied.',
          '',
          'Every pane field the stub does not carry is one a banner could read tomorrow and get ' +
            '`undefined` for, passing here while crashing in a real studio. `lib/documentPaneStub.tsx` ' +
            'therefore lists its fields explicitly rather than casting a partial object, and anything ' +
            'reaching past the eight belongs in the live-pane stories instead.',
          '',
          "Also storied: each banner's negative case. A banner that returns `null` is doing its main " +
            'job, and an empty dashed frame is the only honest way to show it.',
          '',
          '> **Why it matters:** stub a dependency the component reads as input; refuse when the ' +
            'thing stubbed is what the story tests. The same hook falls on both sides depending on ' +
            'the consumer, so the call is made per component rather than per hook.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:visible-system-state',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const RevisionNotFound: Story = {
  name: 'RevisionNotFoundBanner',
  decorators: [WithDocumentPaneStub({revisionNotFound: true}), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'A URL points at a revision the history no longer holds - usually a link shared after the history window rolled past it. The banner is caution-toned rather than critical, correctly: nothing is broken, you are simply looking at the current document instead of the one you asked for.',
      },
    },
  },
  render: () => (
    <Stage>
      <RevisionNotFoundBanner />
    </Stage>
  ),
}

export const RevisionFound: Story = {
  name: 'RevisionNotFoundBanner - renders nothing',
  decorators: [WithDocumentPaneStub({revisionNotFound: false}), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The flag is false, so the banner returns `null` before rendering anything. This is ' +
          'the state it is in on every document you ever open. The interesting property of this ' +
          'component is that it is almost always invisible.',
      },
    },
  },
  render: () => (
    <NothingRendered note="revisionNotFound is false, so the banner rendered nothing">
      <RevisionNotFoundBanner />
    </NothingRendered>
  ),
}

export const DeprecatedType: Story = {
  name: 'DeprecatedDocumentTypeBanner',
  decorators: [
    WithDocumentPaneStub({
      schemaType: makeSchemaType('article', {
        deprecated: {reason: 'Use "post" instead. This type is removed in the next major.'},
      }),
    }),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The schema marks this document type deprecated, and the banner appends the schema author's own `reason` to its message rather than inventing one.\n\nThat is the right division: the studio knows a type is deprecated, only the schema author knows what to use instead, and the banner carries their sentence verbatim into the editor's view.",
      },
    },
  },
  render: () => (
    <Stage>
      <DeprecatedDocumentTypeBanner />
    </Stage>
  ),
}

export const NotDeprecated: Story = {
  name: 'DeprecatedDocumentTypeBanner - renders nothing',
  decorators: [
    WithDocumentPaneStub({schemaType: makeSchemaType('article')}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          '`isDeprecatedSchemaType(schemaType)` is false, so nothing renders. Worth showing next to the story above: the two differ only in one property on the schema type, and no prop distinguishes them.',
      },
    },
  },
  render: () => (
    <NothingRendered note="the schema type is not deprecated, so the banner rendered nothing">
      <DeprecatedDocumentTypeBanner />
    </NothingRendered>
  ),
}

export const Deleted: Story = {
  name: 'DeletedDocumentBanners - deleted',
  decorators: [
    WithDocumentPaneStub({isDeleted: true, isDeleting: false, ready: true}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The document was deleted while you had it open - usually by someone else, in another tab or another session. The pane stays mounted with its content, and the banner is what tells you that content no longer exists anywhere but on your screen.\n\nThis is the collaboration case a single-user mental model misses entirely, and the reason the component reads three flags rather than one.',
      },
    },
  },
  render: () => (
    <Stage>
      <DeletedDocumentBanners />
    </Stage>
  ),
}

export const Deleting: Story = {
  name: 'DeletedDocumentBanners - silent while deleting',
  decorators: [
    WithDocumentPaneStub({isDeleted: true, isDeleting: true, ready: true}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Mid-delete, and **nothing renders**. The condition is `isDeleted && !isDeleting`, so the banner deliberately holds its tongue while the operation is in flight and only speaks once it has landed.\n\nThat is a better decision than it first looks. A delete can fail. Announcing "this document has been deleted" while the request is still outstanding would be a claim the studio cannot yet support, and retracting it a second later is worse than never making it. The banner waits for the fact.\n\nStoried because I got it backwards first: the story originally expected a mid-delete banner and found an empty frame, which is how the guard came to light.',
      },
    },
  },
  render: () => (
    <NothingRendered note="isDeleting is true, so the banner deliberately stays silent until the delete lands">
      <DeletedDocumentBanners />
    </NothingRendered>
  ),
}

export const NotDeleted: Story = {
  name: 'DeletedDocumentBanners - renders nothing',
  decorators: [
    WithDocumentPaneStub({isDeleted: false, isDeleting: false, ready: true}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The ordinary case. Note the third flag: the component also checks `ready`, so it stays silent while the pane is still resolving rather than flashing "deleted" at a document that simply has not loaded yet. That guard is the difference between a correct banner and an alarming one.',
      },
    },
  },
  render: () => (
    <NothingRendered note="not deleted and not deleting, so the banners rendered nothing">
      <DeletedDocumentBanners />
    </NothingRendered>
  ),
}

export const Unpublished: Story = {
  name: 'UnpublishedDocumentBanner',
  decorators: [
    WithDocumentPaneStub({
      value: {
        _id: 'versions.rScheduled.article-launch',
        _type: 'article',
        title: 'The launch announcement',
        _system: {delete: true},
      } as never,
    }),
    WithPerspective(releaseFixtures.scheduled),
    WithStudioProviders({releases: [releaseFixtures.scheduled]}),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Not what the name suggests. This banner is not about a document that has never been published - it fires when the release you are currently viewing is going to **unpublish** this document, which it detects from `_system.delete` on the version.\n\nSo the message is a warning about the future rather than a note about the past: the content in front of you is live now and will not be after this release goes out. It names the release inline via `VersionInlineBadge`, and it is critical-toned, which for a banner family that is mostly caution is the strongest signal available.\n\nMy first fixture here gave it a draft and no published version and got an empty frame, which is how the actual condition came to light.',
      },
    },
  },
  render: () => (
    <Stage>
      <UnpublishedDocumentBanner />
    </Stage>
  ),
}

export const InsufficientPermission: Story = {
  name: 'InsufficientPermissionBanner',
  decorators: [WithDocumentPaneStub(), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'You can see this document and cannot change it. `requiredPermission` is a genuine prop rather than a pane read, so the same banner covers "cannot update" and "cannot create" with the right verb.\n\nWhere the workspace enables ask-to-edit, it also offers to request access inline - the same pattern as `RequestPermissionDialog`: an error that ends in an action rather than a wall.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="cannot update">
        <InsufficientPermissionBanner requiredPermission="update" />
      </Stage>
      <Stage label="cannot create">
        <InsufficientPermissionBanner requiredPermission="create" />
      </Stage>
    </Stack>
  ),
}

export const CanvasLinked: Story = {
  name: 'CanvasLinkedBanner - not linked, renders nothing',
  decorators: [WithDocumentPaneStub(), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          '**Nothing renders here, and that is the story.** `CanvasLinkedBanner` resolves a companion document through the Canvas store; with no companion - the ordinary case for a document nobody linked - it returns null.\n\nThe linked state needs a live Canvas companion-doc store, which is a genuine connection rather than a data field, so it stays out of this page under the same rule that keeps the Presentation iframe out. What is pinned here is the negative: a document with no Canvas link shows no Canvas banner, on every document you will ever open.',
      },
    },
  },
  render: () => (
    <Stage>
      <CanvasLinkedBanner />
    </Stage>
  ),
}

export const Stacked: Story = {
  name: 'Several conditions at once',
  decorators: [
    WithDocumentPaneStub({
      revisionNotFound: true,
      isDeleted: true,
      ready: true,
      schemaType: makeSchemaType('article', {
        deprecated: {reason: 'Use "post" instead.'},
      }),
    }),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story: [
          'Three conditions true simultaneously - a deleted document, of a deprecated type, ' +
            'at a revision that no longer exists. Each banner decides independently and all ' +
            'three appear.',
          '',
          'Nothing in the system ranks or collapses them, which is fine at three and a real ' +
            'question at six.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <Stack gap={0}>
        <DeletedDocumentBanners />
        <RevisionNotFoundBanner />
        <DeprecatedDocumentTypeBanner />
      </Stack>
    </Stage>
  ),
}
