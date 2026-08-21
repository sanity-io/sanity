import {Menu} from '@sanity/ui/menu'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useDocumentVersions} from '../../../../releases/hooks/useDocumentVersions'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VariantsMenuSections} from '../VariantsMenuSections'

vi.mock('../../../../releases/hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(() => ({data: [], versions: [], loading: false})),
}))

const mockUseDocumentVersions = vi.mocked(useDocumentVersions)

const variants = [variantAlphaAudience, variantNorwegianMarket]

/** A version stub carrying just the field that identifies its variant. */
function versionInVariant(variantId: string) {
  return {
    _id: `versions.scope.book-1`,
    _rev: 'rev',
    _createdAt: '2025-01-01T00:00:00Z',
    _updatedAt: '2025-01-01T00:00:00Z',
    _system: {
      group: {_ref: 'book-1', _weak: true as const},
      variant: {_ref: variantId, _weak: true as const},
    },
  }
}

function setVersions(versions: ReturnType<typeof versionInVariant>[]) {
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map(({_id}) => _id),
    // The hook's real return carries the full document stub; the sections only
    // read `_system.variant`.
    versions: versions as never,
    loading: false,
  })
}

async function renderSections(node: React.JSX.Element) {
  const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
  const view = render(<Menu>{node}</Menu>, {wrapper})
  // The locale bundle resolves asynchronously; without this the first test in
  // the file asserts against raw i18n keys.
  await flushMicrotasksThisIsACodeSmell()
  return view
}

const noop = () => undefined

describe('VariantsMenuSections', () => {
  beforeEach(() => {
    setVersions([])
  })

  it('shows an unheaded flat list when no document is selected', async () => {
    await renderSections(
      <VariantsMenuSections
        documentId={undefined}
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    // "Other" only means something next to a "has" section, so neither heading
    // appears — just the list.
    expect(screen.queryByText('Other variants')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Has /)).not.toBeInTheDocument()
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
    expect(screen.getByText('Norwegian market')).toBeInTheDocument()
  })

  it('does not query versions when no document is selected', async () => {
    await renderSections(
      <VariantsMenuSections
        documentId={undefined}
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    // An empty document id would open a version subscription for ''.
    expect(mockUseDocumentVersions).not.toHaveBeenCalled()
  })

  it('stays unheaded for a selected document with no variants', async () => {
    await renderSections(
      <VariantsMenuSections
        documentId="book-1"
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    expect(screen.queryByText('Other variants')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Has /)).not.toBeInTheDocument()
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
  })

  it('splits into "Has N variants" and "Other variants"', async () => {
    setVersions([versionInVariant(variantAlphaAudience._id)])

    await renderSections(
      <VariantsMenuSections
        documentId="book-1"
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    expect(screen.getByText('Has 1 variant')).toBeInTheDocument()
    expect(screen.getByText('Other variants')).toBeInTheDocument()
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
    expect(screen.getByText('Norwegian market')).toBeInTheDocument()
  })

  it('pluralises the heading and drops the other section when it is empty', async () => {
    setVersions([
      versionInVariant(variantAlphaAudience._id),
      versionInVariant(variantNorwegianMarket._id),
    ])

    await renderSections(
      <VariantsMenuSections
        documentId="book-1"
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    expect(screen.getByText('Has 2 variants')).toBeInTheDocument()
    expect(screen.queryByText('Other variants')).not.toBeInTheDocument()
  })

  it('marks the document’s variants with the filled rhombus and the rest hollow', async () => {
    setVersions([versionInVariant(variantAlphaAudience._id)])

    await renderSections(
      <VariantsMenuSections
        documentId="book-1"
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    const alpha = screen.getByTestId('variant-alpha-audience')
    const norwegian = screen.getByTestId('variant-norwegian-market')

    // The two rhombuses are distinguished by `data-sanity-icon`, which is what
    // the icon components set.
    expect(alpha.querySelector('[data-sanity-icon="rhombus"]')).not.toBeNull()
    expect(alpha.querySelector('[data-sanity-icon="rhombus-outlined"]')).toBeNull()
    expect(norwegian.querySelector('[data-sanity-icon="rhombus-outlined"]')).not.toBeNull()
    expect(norwegian.querySelector('[data-sanity-icon="rhombus"]')).toBeNull()
  })

  it('ignores versions that belong to no variant', async () => {
    setVersions([
      {
        ...versionInVariant(variantAlphaAudience._id),
        _system: {group: {_ref: 'book-1', _weak: true as const}},
      } as ReturnType<typeof versionInVariant>,
    ])

    await renderSections(
      <VariantsMenuSections
        documentId="book-1"
        variants={variants}
        selectedVariantId={undefined}
        onSelect={noop}
      />,
    )

    expect(screen.queryByText(/^Has /)).not.toBeInTheDocument()
    expect(screen.queryByText('Other variants')).not.toBeInTheDocument()
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
  })
})
