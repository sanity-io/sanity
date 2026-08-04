import {Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  type DocumentBadgeDescription,
  type DocumentBadgeProps,
} from '../../../../packages/sanity/src/core/config/document/badges'
import {DocumentBadges} from '../../../../packages/sanity/src/structure/panes/document/statusBar/DocumentBadges'
import {WithDocumentPaneStub} from '../../lib/documentPaneStub'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Real badge functions of the shape `document.badges` expects, mounted through the REAL
 * `DocumentBadges` from the status bar. The stub supplies `badges` and `editState` as input; the
 * resolution, the tone mapping and the tooltip are the component's own work.
 *
 * `editState` carries the flags real badges branch on. These are the fields the built-in
 * scheduled-publishing badge and the version badges actually read.
 */
const editState = {
  id: 'article-launch',
  type: 'article',
  draft: {_id: 'drafts.article-launch', _type: 'article', _updatedAt: '2026-07-24T09:30:00Z'},
  published: {_id: 'article-launch', _type: 'article', _updatedAt: '2026-07-20T11:00:00Z'},
  liveEdit: false,
  ready: true,
} as unknown as DocumentBadgeProps

/** A built-in-shaped badge: reads edit state, returns a description or null. */
function draftBadge(props: DocumentBadgeProps): DocumentBadgeDescription | null {
  if (!props.draft) return null
  return {label: 'Draft', color: 'warning', title: 'This document has unpublished changes'}
}

function publishedBadge(props: DocumentBadgeProps): DocumentBadgeDescription | null {
  if (!props.published) return null
  return {label: 'Published', color: 'success', title: 'A published version exists'}
}

/**
 * DECORATION, description-style. There is no `renderDefault` on this seam. The equivalent move
 * is to CALL the badge you are extending and spread its description, which is the same idiom
 * `document.actions` uses and the reason both are classed as description seams.
 */
function loudDraftBadge(props: DocumentBadgeProps): DocumentBadgeDescription | null {
  const original = draftBadge(props)
  if (!original) return null
  return {...original, label: 'Draft (needs review)', color: 'danger'}
}

function embargoBadge(): DocumentBadgeDescription {
  return {label: 'Embargoed', color: 'primary', title: 'Held until the announcement date'}
}

/** Returns null, which is how a badge declines to appear. */
function neverBadge(): DocumentBadgeDescription | null {
  return null
}

function Stage({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} padding={3} tone="transparent" style={{maxWidth: 560}}>
      <Stack gap={3}>
        <Text size={0} muted>
          the document status bar, badges only
        </Text>
        <Flex align="center" gap={2} style={{minHeight: 28}}>
          {children}
        </Flex>
      </Stack>
    </Card>
  )
}

const meta: Meta = {
  title: 'Customisation/Document Badges',
  parameters: {
    docs: {
      description: {
        component: [
          "A badge is a function that receives a document's edit state and returns a " +
            'description or `null`; Studio renders it: the status pills beside a document title, ' +
            'Draft, Published, and whatever else a studio wants to say about a document at a ' +
            'glance.',
          '',
          '|          |                                                                                                                   |',
          '| -------- | ----------------------------------------------------------------------------------------------------------------- |',
          '| Seam     | `document.badges`, the second of the chapter’s two description seams, sibling of `Customisation/Document Actions` |',
          '| Tier     | SERVICE                                                                                                           |',
          '| Patterns | `draft-publish-lifecycle`                                                                                         |',
          '',
          'There is no `renderDefault`, because there is no markup to delegate to, and the ' +
            'equivalent of decoration is to call the badge you are extending and spread its ' +
            'description.',
          '',
          'The same badge has to render in the status bar, and it has to stay legible at a size ' +
            'the studio controls rather than the author. Handing back a description lets Studio ' +
            'place it consistently and lets the four colour names map to whatever tones the ' +
            'current theme resolves to. `DocumentBadges.tsx` holds that mapping, and it is a ' +
            'translation rather than a pass-through:',
          '',
          '```ts',
          "primary -> 'primary'   success -> 'positive'",
          "warning -> 'caution'   danger  -> 'critical'",
          '```',
          '',
          'Four colours, and that is the whole vocabulary. `DocumentBadgeDescription.color` is ' +
            "typed `'primary' | 'success' | 'warning' | 'danger'`. There is no arbitrary colour " +
            'and no icon slot in the rendered output despite `icon` being on the type, because ' +
            '`DocumentBadgesInner` renders only `label` inside a `<Badge>` and `title` as its ' +
            'tooltip. A badge that sets an icon is setting a field nothing reads.',
          '',
          '> **Why it matters:** returning `null` is the normal case, not the error case. Most ' +
            'badges are conditional, the Draft badge exists only when a draft does, and story 4 ' +
            'shows a badge declining, which renders nothing at all rather than an empty pill.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:customisation',
    'pattern:draft-publish-lifecycle',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: '1. Default - the built-in shape',
  decorators: [
    WithDocumentPaneStub({editState: editState as never, badges: [draftBadge, publishedBadge]}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story: [
          'Two badges against a document that has both a draft and a published version, so ' +
            'both return a description rather than `null`.',
          '',
          'Hover either one: `title` becomes the tooltip and `label` is the pill. That split ' +
            'is the presentation contract, and it is why a badge cannot say much. The design ' +
            'intent is a glanceable state marker rather than a place to put information.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentBadges />
    </Stage>
  ),
}

export const Extended: Story = {
  name: '2. Extended - spreading an existing description',
  decorators: [
    WithDocumentPaneStub({
      editState: editState as never,
      badges: [loudDraftBadge, publishedBadge],
    }),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story: [
          'The Draft badge replaced by one that calls it, spreads the result, and overrides ' +
            '`label` and `color`. The `title` survives untouched because it was spread rather ' +
            'than restated.',
          '',
          'This is the description-seam equivalent of `renderDefault`, and the difference is ' +
            'explicit: **with `renderDefault` you cannot accidentally drop a field, and here ' +
            'you can.** A decoration written as `{label: "Draft (needs review)", color: ' +
            '"danger"}` rather than `{...original, …}` silently discards the tooltip. Nothing ' +
            'warns, and the badge still looks correct.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentBadges />
    </Stage>
  ),
}

export const Added: Story = {
  name: '3. Added - a wholly new badge',
  decorators: [
    WithDocumentPaneStub({
      editState: editState as never,
      badges: [draftBadge, publishedBadge, embargoBadge],
    }),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A third badge appended to the built-ins, which is what most real customisation of this seam looks like. Adding is far more common than replacing here, because the built-in badges describe a lifecycle the studio owns and a custom one usually describes something the business owns.\n\nThe order is the array order. `document.badges` is a reducer over the config tree, so a plugin appending a badge lands after the ones already registered unless it rewrites the array it was handed.',
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentBadges />
    </Stage>
  ),
}

export const Declining: Story = {
  name: '4. A badge that declines',
  decorators: [
    WithDocumentPaneStub({
      editState: editState as never,
      badges: [neverBadge, publishedBadge],
    }),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The first badge returns `null` and the second does not. One pill renders, and there is no gap, placeholder or spacing artefact where the first would have been.\n\nStoried because conditional badges are the majority and the `null` path is the one most easily left untested. `DocumentBadgesInner` also short-circuits on an empty array and returns `null` for the whole group, so a document where every badge declines contributes no layout at all rather than an empty row.',
      },
    },
  },
  render: () => (
    <Stage>
      <DocumentBadges />
    </Stage>
  ),
}

export const NoBadges: Story = {
  name: '5. No badges registered',
  decorators: [
    WithDocumentPaneStub({editState: editState as never, badges: []}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story: [
          'An empty badge array. The group renders nothing.',
          '',
          'Pinned deliberately: `DocumentBadges` returns `null` when `badges` is falsy **or** ' +
            'when `editState` is, and the empty-array case falls through to ' +
            '`DocumentBadgesInner`, which has its own `states.length === 0` guard. Three ' +
            'separate paths reach the same empty result, so a badge that is not appearing has ' +
            'three places to check.',
          '',
          'The `Code` block below prints what the stub supplied, so the story states its own ' +
            'input rather than leaving an empty frame to be interpreted.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Stage>
        <DocumentBadges />
      </Stage>
      <Code size={0}>badges: []</Code>
    </Stack>
  ),
}
