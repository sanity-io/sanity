import {describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {useRouter} from 'sanity/router'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {ReleasesTable, type TableBundle} from '../ReleasesTable'

jest.mock('sanity/router', () => ({
  ...(jest.requireActual('sanity/router') || {}),
  useRouter: jest.fn().mockReturnValue({state: {bundleSlug: '123'}, navigate: jest.fn()}),
}))

jest.mock('../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({deleteBundle: jest.fn()}),
}))

const mockSetSearchTerm = jest.fn()

const renderReleasesTable = async (bundles: TableBundle[]) => {
  const wrapper = await createTestProvider()
  return render(<ReleasesTable bundles={bundles} setSearchTerm={mockSetSearchTerm} />, {wrapper})
}

describe('ReleasesTable', () => {
  it('should render the table headers', async () => {
    await renderReleasesTable([])

    screen.getByPlaceholderText('Search releases')
    screen.getByText('Published')
    screen.getByText('Edited')
    screen.getByText('Created')
  })

  it('should display "No Releases" when there are no bundles', async () => {
    await renderReleasesTable([])
    screen.getByText('No Releases')
  })

  it('should render a list of bundles', async () => {
    const bundles = [
      {
        title: 'Bundle 1',
        slug: 'bundle-1',
        _createdAt: new Date().toISOString(),
        documentsMetadata: {
          documentCount: 1,
        },
      },
      {
        title: 'Bundle 2',
        slug: 'bundle-2',
        _createdAt: new Date().toISOString(),
        documentsMetadata: {
          documentCount: 0,
        },
      },
      {
        title: 'Bundle 3',
        slug: 'bundle-3',
        _createdAt: new Date().toISOString(),
        documentsMetadata: {
          // 24 hours ago
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          documentCount: 3,
        },
      },
    ] as TableBundle[]

    await renderReleasesTable(bundles)

    const bundleRows = screen.getAllByTestId('bundle-row')
    expect(bundleRows).toHaveLength(bundles.length)
    bundles.forEach((bundle, index) => {
      within(bundleRows[index]).getByText(bundle.title)
      within(bundleRows[index]).getByText(bundle.documentsMetadata.documentCount.toString())
      within(bundleRows[index]).getByText('just now')
      if (bundle.documentsMetadata.updatedAt) {
        within(bundleRows[index]).getByText('yesterday')
      }
    })
  })

  it('should disable search when no bundles in table', async () => {
    await renderReleasesTable([])

    expect(screen.getByPlaceholderText('Search releases')).toBeDisabled()
  })

  it('should enable and trigger a search when there are bundles in the table', async () => {
    await renderReleasesTable([
      {
        title: 'Bundle 1',
        slug: 'bundle-1',
        _createdAt: new Date().toISOString(),
        documentsMetadata: {
          documentCount: 0,
        },
      },
    ] as TableBundle[])

    const searchInput = screen.getByPlaceholderText('Search releases')
    fireEvent.change(searchInput, {target: {value: 'Bundle 1'}})

    expect(mockSetSearchTerm).toHaveBeenCalledWith('Bundle 1')
  })

  describe('A release row', () => {
    it('should navigate to the release detail when clicked', async () => {
      const bundles = [
        {
          _id: '123',
          title: 'Bundle 1',
          slug: 'bundle-1',
          _createdAt: new Date().toISOString(),
          documentsMetadata: {
            documentCount: 1,
          },
        },
      ] as TableBundle[]
      await renderReleasesTable(bundles)

      const bundleRow = screen.getAllByTestId('bundle-row')[0]
      fireEvent.click(within(bundleRow).getByText('Bundle 1'))

      expect(useRouter().navigate).toHaveBeenCalledWith({bundleSlug: 'bundle-1'})
    })

    it('should delete bundle when menu button is clicked', async () => {
      const bundles = [
        {
          _id: '123',
          title: 'Bundle 1',
          slug: 'bundle-1',
          _createdAt: new Date().toISOString(),
          documentsMetadata: {
            documentCount: 1,
          },
        },
      ] as TableBundle[]
      await renderReleasesTable(bundles)

      const bundleRow = screen.getAllByTestId('bundle-row')[0]
      fireEvent.click(within(bundleRow).getByLabelText('Release menu'))

      fireEvent.click(screen.getByText('Delete'))
      fireEvent.click(screen.getByText('Confirm'))

      await waitFor(() => {
        expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith(bundles[0])
        expect(useRouter().navigate).toHaveBeenCalledWith({bundleSlug: undefined})
      })
    })
  })
})
