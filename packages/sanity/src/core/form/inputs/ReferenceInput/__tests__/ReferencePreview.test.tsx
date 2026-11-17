import {defineType, type ObjectSchemaType} from '@sanity/types'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../../perspective/__mocks__/usePerspective.mock'
import {useDocumentVersions} from '../../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../../releases/store/types'
import {createSchema} from '../../../../schema/createSchema'
import {variantAlphaAudience} from '../../../../variants/__fixtures__/variants.fixture'
import {ReferencePreview} from '../ReferencePreview'

vi.mock('../../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))
vi.mock('../../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))

const schema = createSchema({
  name: 'default',
  types: [defineType({name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]})],
})

const published: VersionInfoDocumentStub = {
  _id: 'author-1',
  _type: 'author',
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  _system: {group: {_ref: 'author-1', _weak: true}},
}

describe('ReferencePreview', () => {
  it('shows no variant diamond, filled or outline, while a variant is selected', async () => {
    mockUsePerspective.mockReturnValue({
      ...usePerspectiveMockReturn,
      selectedVariants: [variantAlphaAudience],
      selectedVariantNames: ['alpha-audience'],
    })
    ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
      data: [published._id],
      versions: [published],
      error: null,
      loading: false,
    })

    const wrapper = await createTestProvider()
    const {container} = render(
      <ReferencePreview
        id="author-1"
        layout="default"
        refType={schema.get('author') as ObjectSchemaType}
        renderPreview={(props) => props.children as ReactNode}
      />,
      {wrapper},
    )

    // The document is not in the variant: a document list would end the row with the outline
    // diamond; the reference shows only the published mark
    expect(container.querySelector('[data-sanity-icon="circle-small"]')).not.toBeNull()
    expect(container.querySelector('[data-sanity-icon="rhombus-outline"]')).toBeNull()
    expect(container.querySelector('[data-sanity-icon="rhombus"]')).toBeNull()
  })

  describe('versions flyout', () => {
    async function renderPreview(options: {inventory: boolean; versionsFlyout: boolean}) {
      mockUsePerspective.mockReturnValue(usePerspectiveMockReturn)
      ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
        data: [published._id],
        versions: [published],
        error: null,
        loading: false,
      })
      const wrapper = await createTestProvider({
        config: {beta: {documentGroupInventory: {enabled: options.inventory}}},
      })
      let tooltip: unknown
      const {container} = render(
        <ReferencePreview
          id="author-1"
          layout="default"
          refType={schema.get('author') as ObjectSchemaType}
          renderPreview={(props) => {
            // ReferencePreview hands the tooltip to the preview next to the typed props
            tooltip = 'tooltip' in props ? props.tooltip : undefined
            return props.children as ReactNode
          }}
          versionsFlyout={options.versionsFlyout}
        />,
        {wrapper},
      )
      return {container, tooltip}
    }

    it('puts the flyout on the marks, with a summary, and drops the read-only tooltip', async () => {
      const {container, tooltip} = await renderPreview({inventory: true, versionsFlyout: true})
      const marks = container.querySelector('[data-testid="document-versions-marks"]')
      expect(marks).not.toBeNull()
      expect(marks?.getAttribute('aria-label')).toBe('1 version')
      expect(marks?.querySelector('[data-sanity-icon="circle-small"]')).not.toBeNull()
      expect(tooltip).toBeUndefined()
    })

    it("keeps main's tooltip without the inventory", async () => {
      const {container, tooltip} = await renderPreview({inventory: false, versionsFlyout: true})
      expect(container.querySelector('[data-testid="document-versions-marks"]')).toBeNull()
      expect(tooltip).toBeTruthy()
    })

    it("keeps main's tooltip where the flyout is not asked for (the search's options)", async () => {
      const {container, tooltip} = await renderPreview({inventory: true, versionsFlyout: false})
      expect(container.querySelector('[data-testid="document-versions-marks"]')).toBeNull()
      expect(tooltip).toBeTruthy()
    })
  })
})
