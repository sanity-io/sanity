import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {usePerspectiveMockReturn} from '../../../../perspective/__mocks__/usePerspective.mock'
import {activeASAPRelease} from '../../../../releases/__fixtures__/release.fixture'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantId} from '../../../tool/util'
import {VariantsStudioNavbar} from '../VariantsStudioNavbar'

const mockNavigate = vi.fn()

const routerMock = vi.hoisted(() => ({
  stickyParams: {} as Record<string, string | undefined>,
}))

const activeDocumentMock = vi.hoisted(() => ({
  value: {activeDocument: undefined} as {activeDocument?: {documentId: string}},
}))

const documentVariantIdsMock = vi.hoisted(() => ({value: new Set<string>()}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    stickyParams: routerMock.stickyParams,
    navigate: mockNavigate,
  })),
}))

vi.mock('../../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

vi.mock('../../../../store/agent/useAgentBundles', () => ({
  useAgentBundles: vi.fn(() => ({bundles: [], loading: false})),
}))

vi.mock('../../../../perspective/navbar/GlobalPerspectiveMenu', () => ({
  GlobalPerspectiveMenu: () => <div data-testid="global-perspective-menu" />,
}))

// Renders `trigger` rather than swallowing it. The variant pill's diamond lives IN the trigger, so
// a stub that drops it hides exactly the thing these tests assert on.
vi.mock('../VariantsMenu', () => ({
  VariantsMenu: ({trigger}: {trigger?: React.ReactNode}) => (
    <div data-testid="variants-menu">{trigger}</div>
  ),
}))

vi.mock('../../../../perspective/activeDocument/usePerspectiveActiveDocument', () => ({
  usePerspectiveActiveDocument: vi.fn(() => activeDocumentMock.value),
}))

vi.mock('../../../hooks/useDocumentVariantIds', () => ({
  useDocumentVariantIds: vi.fn(() => documentVariantIdsMock.value),
}))

function getFilter(prefix: string) {
  const prefixText = screen.getByText(prefix)
  const filter = prefixText.closest('[data-ui="PerspectiveFilter"]')
  if (!filter) {
    throw new Error(`PerspectiveFilter with prefix "${prefix}" not found`)
  }
  return filter as HTMLElement
}

describe('VariantsStudioNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMock.stickyParams = {}
    usePerspectiveMockReturn.selectedPerspective = 'drafts'
    usePerspectiveMockReturn.selectedVariant = undefined
    activeDocumentMock.value = {activeDocument: undefined}
    documentVariantIdsMock.value = new Set<string>()
  })

  const renderNavbar = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    // @ts-expect-error -- pre-existing, fix later
    const view = render(<VariantsStudioNavbar renderDefault={() => null} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()
    return view
  }

  it('hides remove controls when version and variant are at default', async () => {
    await renderNavbar()

    expect(screen.queryByTestId('perspective-filter-remove')).not.toBeInTheDocument()
  })

  it('shows version remove when a non-default perspective is selected', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeASAPRelease

    await renderNavbar()

    expect(
      within(getFilter('Version')).getByRole('button', {name: 'Clear version selection'}),
    ).toBeInTheDocument()
    expect(
      within(getFilter('Variant')).queryByTestId('perspective-filter-remove'),
    ).not.toBeInTheDocument()
  })

  it('shows variant remove when a variant is selected', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNavbar()

    expect(
      within(getFilter('Version')).queryByTestId('perspective-filter-remove'),
    ).not.toBeInTheDocument()
    expect(
      within(getFilter('Variant')).getByRole('button', {name: 'Clear variant selection'}),
    ).toBeInTheDocument()
  })

  it('shows variant remove when sticky variant is set but not resolved in the store', async () => {
    routerMock.stickyParams = {variant: 'missing-variant'}

    await renderNavbar()

    expect(
      within(getFilter('Variant')).getByRole('button', {name: 'Clear variant selection'}),
    ).toBeInTheDocument()
  })

  it('clears version when version remove is clicked', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeASAPRelease

    await renderNavbar()

    const user = userEvent.setup()
    await user.click(within(getFilter('Version')).getByTestId('perspective-filter-remove'))

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        excludedPerspectives: null,
        perspective: '',
      },
    })
  })

  it('clears variant when variant remove is clicked', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNavbar()

    const user = userEvent.setup()
    await user.click(within(getFilter('Variant')).getByTestId('perspective-filter-remove'))

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: null,
      },
    })
  })

  describe("the variant pill's diamond", () => {
    const diamond = () => {
      const button = screen.getByTestId('variants-nav-menu-button')
      const svg = button.querySelector('[data-sanity-icon]')
      if (!svg) throw new Error('no icon rendered in the variant trigger')
      return svg.getAttribute('data-sanity-icon')
    }

    it('outlines when no document is open', async () => {
      await renderNavbar()
      expect(diamond()).toBe('rhombus-outlined')
    })

    it('fills on the default perspective when a document is open', async () => {
      activeDocumentMock.value = {activeDocument: {documentId: 'book-1'}}
      await renderNavbar()
      // A document always exists outside every variant, so the default is presence, not absence.
      expect(diamond()).toBe('rhombus')
    })

    it('fills when the open document has a version in the selected variant', async () => {
      activeDocumentMock.value = {activeDocument: {documentId: 'book-1'}}
      usePerspectiveMockReturn.selectedVariant = variantAlphaAudience
      documentVariantIdsMock.value = new Set([variantAlphaAudience._id])
      await renderNavbar()
      expect(diamond()).toBe('rhombus')
    })

    it('outlines when the open document has no version in the selected variant', async () => {
      activeDocumentMock.value = {activeDocument: {documentId: 'book-1'}}
      usePerspectiveMockReturn.selectedVariant = variantAlphaAudience
      documentVariantIdsMock.value = new Set([variantNorwegianMarket._id])
      await renderNavbar()
      expect(diamond()).toBe('rhombus-outlined')
    })
  })
})
