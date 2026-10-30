import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type SystemVariant,
  useActiveReleases,
  useAllVariants,
  useDocumentVersions,
  usePerspective,
  useSetVariant,
  type VersionInfoDocumentStub,
} from 'sanity'
import {afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../../useDocumentPane'
import {
  createPerspective,
  createRelease,
  createVariant,
  createVersion,
  GROUP_ID,
} from '../../__tests__/fixtures'
import {DocumentVariantsMenu} from '../DocumentVariantsMenu'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useAllVariants: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
  useSetVariant: vi.fn(),
}))

vi.mock('../../../../../useDocumentPane')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseSetVariant = useSetVariant as Mock<typeof useSetVariant>
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>

const firstTime = createVariant('firstTime', 'First-time visitors')
const lapsed = createVariant('lapsed', 'Lapsed customers')
const language = createVariant('norwegian', 'Norwegian', 'language')
const summerSale = createRelease('rSummer', 'Summer sale')

const setVariant = vi.fn()
let wrapper: React.ComponentType<{children: React.ReactNode}>

function mockVariants(variants: SystemVariant[]) {
  mockUseAllVariants.mockReturnValue({
    data: variants,
    byId: new Map(variants.map((variant) => [variant._id, variant])),
    loading: false,
  })
}

function mockVersions(versions: VersionInfoDocumentStub[]) {
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map((version) => version._id),
    versions,
    loading: false,
  })
}

async function openMenu() {
  await userEvent.click(await screen.findByTestId('document-variants-menu-button'))
  return screen.findByTestId('document-variants-menu')
}

beforeAll(async () => {
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

describe('DocumentVariantsMenu', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue({documentId: GROUP_ID})
    mockUsePerspective.mockReturnValue(createPerspective())
    mockUseSetVariant.mockReturnValue(setVariant)
    mockUseActiveReleases.mockReturnValue({
      data: [summerSale],
      byId: new Map([[summerSale._id, summerSale]]),
      loading: false,
      dispatch: vi.fn(),
    })
    mockVariants([firstTime, lapsed, language])
    mockVersions([createVersion({bundle: 'published'})])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there is no variant of the default type', async () => {
    mockVariants([language])

    render(
      <>
        <span data-testid="rendered" />
        <DocumentVariantsMenu />
      </>,
      {wrapper},
    )

    // The locale provider suspends on the first render.
    await screen.findByTestId('rendered')
    expect(screen.queryByTestId('document-variants-menu-button')).toBeNull()
    expect(screen.queryByTestId('document-variants-menu-divider')).toBeNull()
  })

  it('labels the trigger "Variants" when no variant is selected', async () => {
    render(<DocumentVariantsMenu />, {wrapper})

    const trigger = await screen.findByTestId('document-variants-menu-button')
    expect(trigger).toHaveTextContent('Variants')
    expect(screen.queryByTestId('dropdown-button-clear')).toBeNull()
  })

  it('names the selected variant on the trigger and clears it with the remove control', async () => {
    mockUsePerspective.mockReturnValue(createPerspective({selectedVariants: [firstTime]}))
    render(<DocumentVariantsMenu />, {wrapper})

    const trigger = await screen.findByTestId('document-variants-menu-button')
    expect(trigger).toHaveTextContent('First-time visitors')

    await userEvent.click(screen.getByTestId('dropdown-button-clear'))

    expect(setVariant).toHaveBeenCalledWith({type: 'variant', variantId: undefined})
  })

  it('shows an empty "Has 0 variants" section when the document is in no variant', async () => {
    mockVersions([createVersion({bundle: 'published'}), createVersion({bundle: 'drafts'})])
    render(<DocumentVariantsMenu />, {wrapper})

    const menu = await openMenu()

    const defaultItem = within(menu).getByTestId('document-variant-default')
    expect(defaultItem).toHaveTextContent('Default')
    expect(within(defaultItem).getByTestId('variant-version-count')).toHaveTextContent('2')

    const documentSection = within(menu).getByTestId('document-variants-menu-section-document')
    expect(documentSection).toHaveTextContent('Has 0 variants')
    expect(within(documentSection).queryAllByRole('menuitem', {hidden: true})).toHaveLength(0)
    expect(
      within(documentSection).getByTestId('document-variants-menu-section-document-tooltip'),
    ).toHaveAccessibleName("This document isn't in any variant yet. Pick one below to create it.")

    const otherSection = within(menu).getByTestId('document-variants-menu-section-other')
    expect(otherSection).toHaveTextContent('Other variants')
    expect(
      within(otherSection).getByTestId(`document-variant-${firstTime._id}`),
    ).toBeInTheDocument()
    expect(within(otherSection).getByTestId(`document-variant-${lapsed._id}`)).toBeInTheDocument()
    expect(within(menu).queryByTestId(`document-variant-${language._id}`)).toBeNull()
  })

  it('counts one per bundle in the variants the document has', async () => {
    mockVersions([
      createVersion({bundle: 'published'}),
      createVersion({bundle: 'drafts', variant: 'firstTime'}),
      createVersion({bundle: {release: 'rSummer'}, variant: 'firstTime'}),
    ])
    render(<DocumentVariantsMenu />, {wrapper})

    const menu = await openMenu()

    const documentSection = within(menu).getByTestId('document-variants-menu-section-document')
    expect(documentSection).toHaveTextContent('Has 1 variant')
    expect(
      within(documentSection).queryByTestId('document-variants-menu-section-document-tooltip'),
    ).toBeNull()
    const firstTimeItem = within(documentSection).getByTestId(`document-variant-${firstTime._id}`)
    expect(firstTimeItem).toHaveTextContent('First-time visitors')
    expect(within(firstTimeItem).getByTestId('variant-version-count')).toHaveTextContent('2')

    const otherSection = within(menu).getByTestId('document-variants-menu-section-other')
    expect(otherSection).toHaveTextContent('Other variants')
    const lapsedItem = within(otherSection).getByTestId(`document-variant-${lapsed._id}`)
    expect(within(lapsedItem).queryByTestId('variant-version-count')).toBeNull()
  })

  it('names the bundles of the versions when hovering their count', async () => {
    mockVersions([
      createVersion({bundle: 'drafts'}),
      createVersion({bundle: 'published'}),
      createVersion({bundle: {release: 'rSummer'}, variant: 'firstTime'}),
      createVersion({bundle: 'drafts', variant: 'firstTime'}),
    ])
    render(<DocumentVariantsMenu />, {wrapper})

    const menu = await openMenu()

    const defaultItem = within(menu).getByTestId('document-variant-default')
    await userEvent.hover(within(defaultItem).getByTestId('variant-version-count'))
    expect(await screen.findByText('2 versions: Published, Draft')).toBeInTheDocument()

    const firstTimeItem = within(menu).getByTestId(`document-variant-${firstTime._id}`)
    await userEvent.hover(within(firstTimeItem).getByTestId('variant-version-count'))
    expect(await screen.findByText('2 versions: Draft, Summer sale')).toBeInTheDocument()
  })

  it('selects a variant of the default type', async () => {
    render(<DocumentVariantsMenu />, {wrapper})

    const menu = await openMenu()
    await userEvent.click(within(menu).getByTestId(`document-variant-${lapsed._id}`))

    expect(setVariant).toHaveBeenCalledWith({type: 'variant', variantId: lapsed._id})
  })

  it('filters the variants and says when nothing matches', async () => {
    render(<DocumentVariantsMenu />, {wrapper})

    const menu = await openMenu()
    const input = within(menu).getByPlaceholderText('Find')

    await userEvent.type(input, 'lapsed')
    expect(within(menu).getByTestId(`document-variant-${lapsed._id}`)).toBeInTheDocument()
    expect(within(menu).queryByTestId(`document-variant-${firstTime._id}`)).toBeNull()
    expect(within(menu).queryByTestId('document-variant-default')).toBeNull()
    // A filter hides the sections it leaves empty, the "Has 0 variants" one included.
    expect(within(menu).queryByTestId('document-variants-menu-section-document')).toBeNull()

    await userEvent.clear(input)
    await userEvent.type(input, 'zzz')
    expect(within(menu).getByTestId('document-variants-menu-no-matches')).toHaveTextContent(
      'Nothing matches "zzz"',
    )
  })
})
