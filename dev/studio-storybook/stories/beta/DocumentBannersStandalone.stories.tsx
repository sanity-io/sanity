import {type ObjectSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentNotInReleaseBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/DocumentNotInReleaseBanner'
import {ObsoleteDraftBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/ObsoleteDraftBanner'
import {PausedScheduledDraftBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/PausedScheduledDraftBanner'
import {ScheduledReleaseBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/ScheduledReleaseBanner'
import {VariantDefinitionNotFoundBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/VariantDefinitionNotFoundBanner'
import {releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const schemaType = {
  name: 'article',
  title: 'Article',
  type: 'document',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

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

const meta: Meta = {
  title: 'Document Banners/Prop-driven',
  decorators: [WithStudioProviders({releases: [releaseFixtures.scheduled]})],
  parameters: {
    docs: {
      description: {
        component: [
          "There are eighteen banners that can appear between a document's header and its form, " +
            'and only some of them can be storied honestly without the real pane behind them: this ' +
            'page is the half that can.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/documentPanel/banners/` |',
          '| Tier | SERVICE |',
          '| Storied here (prop-driven) | `PausedScheduledDraftBanner` · `ScheduledReleaseBanner` · `DocumentNotInReleaseBanner` · `VariantDefinitionNotFoundBanner` · `ObsoleteDraftBanner` |',
          '| Deliberately not here (pane-driven) | `RevisionNotFoundBanner` · `DeprecatedDocumentTypeBanner` · `UnpublishedDocumentBanner` · `CanvasLinkedBanner` · `ReferenceChangedBanner` · `DocumentNotInVariantBanner` · `DeletedDocumentBanners` · `InsufficientPermissionBanner` (see the `DocumentPane` stories) |',
          '',
          'The existing Document Banners/In a live pane chapter shows the other half *in a live ' +
            'document pane*, driven into their states through the real pane. This page is the ' +
            'complement: the ones that are prop-driven, mounted as themselves.',
          '',
          'So the rule this catalog follows: a banner that takes props is storied here; a banner ' +
            'that reads the pane is storied by driving the pane. The split is not tidiness, it is the ' +
            'difference between a real test and a picture of one.',
          '',
          '> **Why it matters:** most banners are not really components, they are decisions. ' +
            '`RevisionNotFoundBanner` reads `revisionNotFound` off `useDocumentPane` and returns ' +
            '`null` unless it is true. `DeprecatedDocumentTypeBanner` inspects the schema type. ' +
            '`DeletedDocumentBanners` reads three pane fields at once. For those, the interesting ' +
            'behaviour is *when they appear*, not what they look like, and mounting them with a ' +
            'stubbed pane would story the appearance while discarding the decision. Worse, it would ' +
            'quietly assert that a stub is equivalent to the pane, which is exactly the claim nobody ' +
            'can check.',
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

export const Paused: Story = {
  name: 'PausedScheduledDraftBanner',
  parameters: {
    docs: {
      description: {
        story: [
          'The simplest banner in the family: no props, no hooks beyond translation, one ' +
            'sentence. A scheduled draft has been paused, so the date attached to it will not ' +
            'fire.',
          '',
          'It is trivial, and it is the shape all the others would have if they did not also ' +
            'have to decide whether to exist.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <PausedScheduledDraftBanner />
    </Stage>
  ),
}

export const ScheduledRelease: Story = {
  name: 'ScheduledReleaseBanner',
  parameters: {
    docs: {
      description: {
        story: [
          'You are looking at a document inside a release that is scheduled. The padlock and ' +
            'the tone both come from the release, and the date is formatted relatively ("in 3 ' +
            'days") rather than absolutely.',
          '',
          'The message this carries is that the document is **read-only** - not because of ' +
            'permissions, but because its release has been committed. That is a form of ' +
            'read-only most interfaces have no vocabulary for. It gets a banner rather than a ' +
            'disabled field.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <ScheduledReleaseBanner currentRelease={releaseFixtures.scheduledLocked} />
    </Stage>
  ),
}

export const NotInRelease: Story = {
  name: 'DocumentNotInReleaseBanner',
  parameters: {
    docs: {
      description: {
        story:
          'The most useful banner in the set. You have switched the studio into a release, opened a document, and that document has no version in this release - so what you are looking at is the published or draft content, not release content.\n\nWithout the banner this is genuinely dangerous: the document looks editable and edits would go somewhere other than where you think. The banner names the release and offers **Add to release** inline, so the fix is one click from the confusion rather than a trip to another screen.',
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentNotInReleaseBanner
        documentId="article-launch"
        currentRelease={releaseFixtures.scheduled}
      />
    </Stage>
  ),
}

export const NotInScheduledRelease: Story = {
  name: 'DocumentNotInReleaseBanner - a scheduled release',
  parameters: {
    docs: {
      description: {
        story:
          'The same situation where the release is already scheduled. Adding a document to a committed release is a different proposition from adding one to a draft release, and `isScheduledRelease` changes the copy accordingly.',
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentNotInReleaseBanner
        documentId="article-launch"
        currentRelease={releaseFixtures.scheduledLocked}
        isScheduledRelease
      />
    </Stage>
  ),
}

export const VariantNotFound: Story = {
  name: 'VariantDefinitionNotFoundBanner',
  parameters: {
    docs: {
      description: {
        story:
          'A URL names a variant the schema no longer defines - usually a bookmark that outlived a config change. The banner names the requested variant rather than saying "variant not found", which is the difference between a message you can act on and one you have to reproduce first.',
      },
    },
  },
  render: () => (
    <Stage>
      <VariantDefinitionNotFoundBanner requestedVariantName="uk-english" />
    </Stage>
  ),
}

export const ObsoleteDraft: Story = {
  name: 'ObsoleteDraftBanner',
  parameters: {
    docs: {
      description: {
        story: [
          'A draft exists that is older than the published document - somebody published from ' +
            'elsewhere while this draft sat around. The banner offers to publish or discard it, ' +
            'inline.',
          '',
          'This is the one banner here with real operations behind it rather than navigation. ' +
            'It takes `displayed`, `documentId` and `schemaType` because it has to act on the ' +
            'actual document.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <ObsoleteDraftBanner
        displayed={{_id: 'drafts.article-launch', _type: 'article', title: 'Launch announcement'}}
        documentId="article-launch"
        schemaType={schemaType}
        i18nKey="banners.obsolete-draft.text"
      />
    </Stage>
  ),
}

export const ObsoleteDraftBlocking: Story = {
  name: 'ObsoleteDraftBanner - blocking edits',
  parameters: {
    docs: {
      description: {
        story:
          'With `isEditBlocking`, the same banner reports that the form below is locked until the obsolete draft is resolved. Escalating a notice into a block is a strong move, and the banner earns it by carrying both resolutions - you are not told to go and fix something elsewhere, you are given the two buttons that fix it here.',
      },
    },
  },
  render: () => (
    <Stage>
      <ObsoleteDraftBanner
        displayed={{_id: 'drafts.article-launch', _type: 'article', title: 'Launch announcement'}}
        documentId="article-launch"
        schemaType={schemaType}
        i18nKey="banners.obsolete-draft.text"
        isEditBlocking
      />
    </Stage>
  ),
}

export const Stacked: Story = {
  name: 'Several at once',
  parameters: {
    docs: {
      description: {
        story: [
          'Banners stack, and a document can genuinely be in several of these states at the ' +
            'same time - paused, not in the current release, and carrying an obsolete draft.',
          '',
          'This is the story that argues the family needs a budget. Three banners is 140px of ' +
            'explanation above a form the editor came here to fill in, and nothing in the ' +
            'system currently ranks them or collapses them.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <Stack gap={0}>
        <ScheduledReleaseBanner currentRelease={releaseFixtures.scheduledLocked} />
        <PausedScheduledDraftBanner />
        <DocumentNotInReleaseBanner
          documentId="article-launch"
          currentRelease={releaseFixtures.scheduled}
        />
      </Stack>
    </Stage>
  ),
}
