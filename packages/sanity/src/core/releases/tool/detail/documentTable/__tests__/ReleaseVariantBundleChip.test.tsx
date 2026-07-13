import {render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {DOCUMENT_SYSTEM_FIELD} from '../../../../../preview/constants'
import {variantAlphaAudience} from '../../../../../variants/__fixtures__/variants.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ReleaseVariantBundleChip} from '../ReleaseVariantBundleChip'

const useAllVariantsMock = vi.fn()

vi.mock('../../../../../variants/store/useAllVariants', () => ({
  useAllVariants: () => useAllVariantsMock(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi.fn(({children, intent, params, ...props}) => (
    <a
      data-testid="variant-intent-link"
      data-intent={intent}
      data-params={JSON.stringify(params)}
      {...props}
    >
      {children}
    </a>
  )),
}))

const groupRef = {_type: 'reference' as const, _ref: 'article-1', _weak: true as const}

describe('ReleaseVariantBundleChip', () => {
  it('renders muted Default text when the document has no variant ref', async () => {
    useAllVariantsMock.mockReturnValue({byId: new Map()})
    const wrapper = await createTestProvider({resources: [releasesUsEnglishLocaleBundle]})

    render(
      <ReleaseVariantBundleChip
        document={{
          _id: 'versions.rASAP.article-1',
          _type: 'article',
          _rev: 'rev-1',
          _createdAt: '2025-01-01T00:00:00Z',
          _updatedAt: '2025-01-01T00:00:00Z',
          publishedDocumentExists: true,
        }}
      />,
      {wrapper},
    )

    await waitFor(() => {
      expect(
        screen.getByTestId('release-variant-bundle-default-versions.rASAP.article-1'),
      ).toHaveTextContent('Default')
    })
    expect(screen.queryByTestId('variant-intent-link')).not.toBeInTheDocument()
  })

  it('renders a chip with the variant title and links to the variant detail page', async () => {
    useAllVariantsMock.mockReturnValue({
      byId: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
    })
    const wrapper = await createTestProvider()

    render(
      <ReleaseVariantBundleChip
        document={{
          _id: 'versions.rASAP.scope.article-1',
          _type: 'article',
          _rev: 'rev-1',
          _createdAt: '2025-01-01T00:00:00Z',
          _updatedAt: '2025-01-01T00:00:00Z',
          [DOCUMENT_SYSTEM_FIELD]: {
            bundleId: 'rASAP',
            release: {_ref: '_.releases.rASAP', _weak: true},
            variant: {_ref: variantAlphaAudience._id, _weak: true},
            group: groupRef,
            scopeId: 'scope',
          },
        }}
      />,
      {wrapper},
    )

    expect(
      screen.getByTestId('release-variant-bundle-chip-versions.rASAP.scope.article-1'),
    ).toHaveTextContent('Alpha audience')
    expect(screen.getByTestId('variant-intent-link')).toHaveAttribute('data-intent', 'variant')
    expect(screen.getByTestId('variant-intent-link')).toHaveAttribute(
      'data-params',
      JSON.stringify({id: 'alpha-audience'}),
    )
  })

  it('falls back to the short variant id when the definition is missing', async () => {
    useAllVariantsMock.mockReturnValue({byId: new Map()})
    const wrapper = await createTestProvider()

    render(
      <ReleaseVariantBundleChip
        document={{
          _id: 'versions.rASAP.scope.article-1',
          _type: 'article',
          _rev: 'rev-1',
          _createdAt: '2025-01-01T00:00:00Z',
          _updatedAt: '2025-01-01T00:00:00Z',
          [DOCUMENT_SYSTEM_FIELD]: {
            bundleId: 'rASAP',
            release: {_ref: '_.releases.rASAP', _weak: true},
            variant: {_ref: '_.variants.missing-variant', _weak: true},
            group: groupRef,
            scopeId: 'scope',
          },
        }}
      />,
      {wrapper},
    )

    expect(
      screen.getByTestId('release-variant-bundle-chip-versions.rASAP.scope.article-1'),
    ).toHaveTextContent('missing-variant')
  })
})
