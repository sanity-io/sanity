import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'

import {queryByDataUi} from '../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useBundlesStore} from '../../../store/bundles'
import {BundlesProvider} from '../../../store/bundles/BundlesProvider'
import {type BundleDocument} from '../../../store/bundles/types'
import {releasesUsEnglishLocaleBundle} from '../../i18n'
import BundlesOverview from '../BundlesOverview'

// TODO: move this to test for CreateBundleDialog
jest.mock('../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({deleteBundle: jest.fn()}),
}))

jest.mock('../../../store/bundles/useBundlesStore', () => ({
  useBundlesStore: jest.fn(),
}))

jest.mock('sanity/router', () => ({
  ...(jest.requireActual('sanity/router') || {}),
  useRouter: jest.fn().mockReturnValue({state: {}, navigate: jest.fn()}),
}))

const createWrapper = async () => {
  const TestProvider = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <TestProvider>
        <BundlesProvider>{children}</BundlesProvider>
      </TestProvider>
    )
  }
}

const mockUseBundleStore = useBundlesStore as jest.Mock<typeof useBundlesStore>

describe('BundlesOverview', () => {
  describe('when loading bundles', () => {
    beforeEach(async () => {
      mockUseBundleStore.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        dispatch: jest.fn(),
      })

      const wrapper = await createWrapper()

      return render(<BundlesOverview />, {wrapper})
    })

    it('does not show bundles table but shows loader', () => {
      expect(screen.queryByRole('table')).toBeNull()
      queryByDataUi(document.body, 'Spinner')
    })

    it('does not allow for switching between history modes', () => {
      expect(screen.getByText('Open').closest('button')).toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).toBeDisabled()
    })

    it('does show the page heading', () => {
      screen.getByText('Releases')
    })

    it('allows for creating a new bundle', () => {
      expect(screen.getByText('Create release')).not.toBeDisabled()
    })
  })

  describe('when no bundles are available', () => {
    beforeEach(async () => {
      mockUseBundleStore.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        dispatch: jest.fn(),
      })
      const wrapper = await createWrapper()

      return render(<BundlesOverview />, {wrapper})
    })

    it('shows a message that no bundles are available', () => {
      screen.getByText('No Releases')
    })

    it('does not show bundle history mode switch', () => {
      expect(screen.queryByText('Open')).toBeNull()
      expect(screen.queryByText('Archived')).toBeNull()
    })

    it('shows the page heading', () => {
      screen.getByText('Releases')
    })

    it('shows create releases button', () => {
      expect(screen.getByText('Create release')).not.toBeDisabled()
    })
  })

  describe('when bundles are loaded', () => {
    const bundles = [
      {title: 'Bundle 1'},
      {title: 'Bundle 2'},
      {title: 'Bundle 3', publishedAt: new Date()},
    ] as unknown as BundleDocument[]

    beforeEach(async () => {
      mockUseBundleStore.mockReturnValue({
        data: bundles,
        loading: false,
        error: null,
        dispatch: jest.fn(),
      })
      const wrapper = await createWrapper()

      return render(<BundlesOverview />, {wrapper})
    })
    it('shows each open bundle', () => {
      screen.getByText('Bundle 1')
      screen.getByText('Bundle 2')
    })

    it('allows for switching between history modes', () => {
      expect(screen.getByText('Open').closest('button')).not.toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).not.toBeDisabled()
    })

    it('shows published bundles', () => {
      fireEvent.click(screen.getByText('Archived'))

      screen.getByText('Bundle 3')
      expect(screen.queryByText('Bundle 1')).toBeNull()
    })

    it('allows for searching bundles', () => {
      expect(screen.getByPlaceholderText('Search releases')).not.toBeDisabled()
      fireEvent.change(screen.getByPlaceholderText('Search releases'), {
        target: {value: 'Bundle 1'},
      })

      screen.getByText('Bundle 1')
      expect(screen.queryByText('Bundle 2')).toBeNull()

      // search for non-existent bundle title
      fireEvent.change(screen.getByPlaceholderText('Search releases'), {
        target: {value: 'Bananas'},
      })

      screen.getByText('No Releases')
      expect(screen.queryByText('Bundle 1')).toBeNull()
    })
  })
})
