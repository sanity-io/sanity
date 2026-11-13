import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {
  PerspectiveProvider,
  type SystemVariant,
  type TargetDocumentState,
  type VersionInfoDocumentStub,
} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'
import {expect, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {DocumentTargetBadges} from '../DocumentTargetBadges'

const groupRef = {_ref: 'doc-1', _weak: true as const}
const variantRef = {_ref: '_.variants.alpha-audience', _key: 'k-123'}

function versionStub(
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub {
  return {
    _rev: 'rev',
    _createdAt: '2025-01-01T00:00:00Z',
    _updatedAt: '2025-01-01T00:00:00Z',
    _type: 'article',
    ...stub,
  }
}

const publishedDocument = versionStub({_id: 'doc-1', _system: {group: groupRef}})
const draftDocument = versionStub({
  _id: 'drafts.doc-1',
  _system: {bundleId: 'drafts', group: groupRef},
})
const draftVariant = versionStub({
  _id: 'drafts.varscope.doc-1',
  _system: {bundleId: 'drafts', variants: [variantRef], group: groupRef, scopeId: 'varscope'},
})

const alphaAudience = {
  _id: '_.variants.alpha-audience',
  _type: 'system.variant',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  _rev: 'rev-alpha',
  conditions: {audience: 'alpha'},
  priority: 0,
  metadata: {title: 'Alpha audience', description: []},
} as SystemVariant

const NO_SIBLINGS = {published: undefined, draft: undefined, version: undefined}

function readyState(
  targetDocument: VersionInfoDocumentStub | undefined,
  variant?: SystemVariant,
): TargetDocumentState {
  return {
    status: 'ready',
    targetDocument,
    scopeId: targetDocument?._system.scopeId,
    variant,
    siblings: NO_SIBLINGS,
  }
}

const ARTICLE_TYPE = {name: 'article', jsonType: 'object', liveEdit: false} as ObjectSchemaType

/**
 * The badges only read `displayed`, `schemaType` and `targetDocumentState`
 * from the document pane, so the pane context is stubbed with just those.
 */
function PaneStub(props: {
  children: ReactNode
  displayed: VersionInfoDocumentStub
  targetDocumentState: TargetDocumentState
}) {
  const {children, displayed, targetDocumentState} = props
  const value = {
    displayed,
    schemaType: ARTICLE_TYPE,
    targetDocumentState,
  } as unknown as DocumentPaneContextValue

  return <DocumentPaneContext.Provider value={value}>{children}</DocumentPaneContext.Provider>
}

/**
 * The perspective and variant badges in the document pane header. The
 * perspective comes from `PerspectiveProvider` (drafts or published; release
 * perspectives need the releases store) and the variant from the resolved
 * target document state.
 */
const meta = {
  title: 'Structure/Document Pane/Document Target Badges',
  component: DocumentTargetBadges,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Card padding={3} style={{display: 'inline-block'}}>
          <Story />
        </Card>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof DocumentTargetBadges>

export default meta
type Story = StoryObj<typeof meta>

export const Drafts: Story = {
  render: () => (
    <PaneStub displayed={draftDocument} targetDocumentState={readyState(draftDocument)}>
      <DocumentTargetBadges />
    </PaneStub>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Drafts')).toBeVisible())
  },
}

export const Published: Story = {
  render: () => (
    <PerspectiveProvider selectedPerspectiveName="published">
      <PaneStub displayed={publishedDocument} targetDocumentState={readyState(publishedDocument)}>
        <DocumentTargetBadges />
      </PaneStub>
    </PerspectiveProvider>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Published')).toBeVisible())
  },
}

export const DraftsWithVariant: Story = {
  render: () => (
    <PaneStub
      displayed={draftVariant}
      targetDocumentState={readyState(draftVariant, alphaAudience)}
    >
      <DocumentTargetBadges />
    </PaneStub>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Drafts')).toBeVisible())
    await waitFor(() => expect(canvas.getByText('Alpha audience')).toBeVisible())
  },
}

/** The requested variant does not exist, so the badge is dimmed. */
export const TargetMissing: Story = {
  render: () => (
    <PaneStub
      displayed={publishedDocument}
      targetDocumentState={{
        status: 'variant-definition-document-not-found',
        requestedVariantName: 'alpha-audience',
      }}
    >
      <DocumentTargetBadges />
    </PaneStub>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const badge = await canvas.findByText('Drafts')
    // The badge fades to half opacity through a short motion transition.
    await waitFor(
      async () => {
        const wrapper = badge.closest('[data-ui="DocumentTargetPerspectiveBadge"]')?.parentElement
        await expect(wrapper && getComputedStyle(wrapper).opacity).toBe('0.5')
      },
      {timeout: 3000},
    )
  },
}
