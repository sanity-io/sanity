import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {setupVirtualListEnv} from '../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type VersionStub} from '../../../../inventoryModel/types'
import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {type VersionInventory} from '../../../hooks/useVersionInventory'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VariantVersionsView} from '../VariantVersionsView'

const inventoryMock = vi.hoisted(() => ({
  value: undefined as unknown,
  types: [] as string[][],
}))

vi.mock('../../../hooks/useVersionInventory', async (importOriginal) => ({
  ...(await importOriginal()),
  useVersionInventory: vi.fn((types: string[]) => {
    inventoryMock.types.push(types)
    return inventoryMock.value
  }),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: [variantAlphaAudience],
    byId: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
    loading: false,
  })),
}))

vi.mock('../../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({data: [], byId: new Map(), loading: false, error: null})),
}))

vi.mock('../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: vi.fn(({documentId}: {documentId: string}) => ({
    isLoading: false,
    value: {title: `Preview of ${documentId}`},
  })),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useMediaIndex: vi.fn(() => 4),
}))

setupVirtualListEnv()

function row(overrides: Partial<VersionStub> & Pick<VersionStub, '_id' | 'groupId'>): VersionStub {
  return {
    _type: 'author',
    _updatedAt: '2026-11-01T00:00:00Z',
    variantId: undefined,
    kind: 'published',
    bundle: 'published',
    goingToUnpublish: false,
    ...overrides,
  }
}

const inventory: VersionInventory = {
  loading: false,
  error: null,
  truncated: false,
  rows: [
    row({_id: 'jacket', groupId: 'jacket'}),
    row({_id: 'drafts.jacket', groupId: 'jacket', kind: 'draft', bundle: 'drafts'}),
    row({
      _id: 'versions.alpha-audience.boots',
      groupId: 'boots',
      kind: 'draft',
      bundle: 'drafts',
      variantId: variantAlphaAudience._id,
    }),
  ],
}

async function renderView(value: VersionInventory = inventory) {
  inventoryMock.value = value
  inventoryMock.types = []
  const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
  return render(<VariantVersionsView />, {wrapper})
}

describe('VariantVersionsView', () => {
  it('lists one row per version, with its definition and state', async () => {
    await renderView()

    await waitFor(() => expect(screen.getAllByTestId('version-row-link')).toHaveLength(3))
    expect(screen.getAllByText('Default')).not.toHaveLength(0)
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getAllByText('Draft')).toHaveLength(2)
    // Every content type until one is picked.
    expect(inventoryMock.types.at(-1)).toEqual([])
  })

  it('opens a row on its version with the version inventory open', async () => {
    await renderView()

    const links = await screen.findAllByTestId('version-row-link')
    const href = decodeURIComponent(links.map((link) => link.getAttribute('href')).join(' '))
    expect(href).toContain('inspect=sanity/structure/document-group')
    expect(href).toContain('perspective=published')
    expect(href).toContain('variant=variant:alpha-audience')
  })

  it('filters by state', async () => {
    await renderView()
    await screen.findAllByTestId('version-row-link')

    await userEvent.click(screen.getByTestId('versions-filter-state'))
    // Closed menus stay mounted (hidden by <Activity>): pick the open one.
    const [openMenu] = [
      ...document.querySelectorAll<HTMLElement>('[data-ui="MenuButton__popover"]'),
    ].filter((popover) => popover.style.display !== 'none')
    await userEvent.click(
      within(openMenu!).getByRole('menuitem', {name: 'Published', hidden: true}),
    )

    await waitFor(() => expect(screen.getAllByTestId('version-row-link')).toHaveLength(1))
  })

  it('says when the list was cut', async () => {
    await renderView({...inventory, truncated: true})

    expect(await screen.findByTestId('versions-truncated')).toHaveTextContent(
      'Showing the 500 most recently edited versions',
    )
  })
})
