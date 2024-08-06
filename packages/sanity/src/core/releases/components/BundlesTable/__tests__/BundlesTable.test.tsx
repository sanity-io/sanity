import {describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {useRouter} from 'sanity/router'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type BundleDocument} from '../../../../store/bundles/types'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {BundlesTable} from '../BundlesTable'

jest.mock('sanity/router', () => ({
  ...(jest.requireActual('sanity/router') || {}),
  useRouter: jest.fn().mockReturnValue({state: {bundleId: '123'}, navigate: jest.fn()}),
}))

jest.mock('../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({deleteBundle: jest.fn()}),
}))

const mockSetSearchTerm = jest.fn()

const renderBundlesTable = async (bundles: BundleDocument[]) => {
  const wrapper = await createTestProvider()
  return render(<BundlesTable bundles={bundles} setSearchTerm={mockSetSearchTerm} />, {wrapper})
}

describe('BundlesTable', () => {
  it('should render the table headers', async () => {
    await renderBundlesTable([])

    screen.getByPlaceholderText('Search releases')
    screen.getByText('Published')
  })

  it('should display "No Releases" when there are no bundles', async () => {
    await renderBundlesTable([])
    screen.getByText('No Releases')
  })

  it('should render a list of bundles', async () => {
    const bundles = [
      {title: 'Bundle 1'},
      {title: 'Bundle 2'},
      {title: 'Bundle 3'},
    ] as BundleDocument[]

    await renderBundlesTable(bundles)

    const bundleRows = screen.getAllByTestId('bundle-row')
    expect(bundleRows).toHaveLength(bundles.length)
    bundles.forEach((bundle, index) => within(bundleRows[index]).getByText(bundle.title))
  })

  it('should disable search when no bundles in table', async () => {
    await renderBundlesTable([])

    expect(screen.getByPlaceholderText('Search releases')).toBeDisabled()
  })

  it('should enable and trigger a search when there are bundles in the table', async () => {
    await renderBundlesTable([{title: 'Bundle 1'}] as BundleDocument[])

    const searchInput = screen.getByPlaceholderText('Search releases')
    fireEvent.change(searchInput, {target: {value: 'Bundle 1'}})

    expect(mockSetSearchTerm).toHaveBeenCalledWith('Bundle 1')
  })

  describe('A bundle row', () => {
    it('should navigate to the bundle detail when clicked', async () => {
      const bundles = [{_id: '123', title: 'Bundle 1'}] as BundleDocument[]
      await renderBundlesTable(bundles)

      const bundleRow = screen.getAllByTestId('bundle-row')[0]
      fireEvent.click(within(bundleRow).getByText('Bundle 1'))

      expect(useRouter().navigate).toHaveBeenCalledWith({bundleId: '123'})
    })

    it('should delete bundle when menu button is clicked', async () => {
      const bundles = [{_id: '123', title: 'Bundle 1'}] as BundleDocument[]
      await renderBundlesTable(bundles)

      const bundleRow = screen.getAllByTestId('bundle-row')[0]
      fireEvent.click(within(bundleRow).getByLabelText('Release menu'))

      fireEvent.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith('123')
        expect(useRouter().navigate).toHaveBeenCalledWith({bundleId: undefined})
      })
    })
  })
})
