import {type SanityClient} from '@sanity/client'
import {type AssetSourceComponentProps} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {noop} from 'lodash'
import {describe, expect, test} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config'
import {createSanityMediaLibraryFileSource} from '../createAssetSource'

const fileAssetSource = createSanityMediaLibraryFileSource({
  libraryId: null,
})

const projectId = 'mock-project-id'
const organizationId = 'mock-organization-id'

function createWrapperComponent(client: SanityClient) {
  const config = defineConfig({
    projectId,
    dataset: 'test',
  })

  return createTestProvider({
    client,
    config,
  })
}
const AssetSourceComponent = fileAssetSource.component
const assetSourceComponentProps: AssetSourceComponentProps = {
  accept: '*/*',
  action: 'select',
  assetSource: fileAssetSource,
  assetType: 'file',
  selectionType: 'single',
  selectedAssets: [],
  onClose: noop,
  onSelect: noop,
}

const assetSourceComponent = <AssetSourceComponent {...assetSourceComponentProps} />

describe('provisioning', () => {
  test('renders error when organizationId is not found', async () => {
    const client = createMockSanityClient({
      requests: {
        '/projects/mock-project-id': {
          organizationId: undefined,
        },
      },
    })
    const TestProvider = await createWrapperComponent(client as any)

    const {getByTestId} = render(<TestProvider>{assetSourceComponent}</TestProvider>)

    await waitFor(() => {
      expect(getByTestId('media-library-provision-error')).toBeInTheDocument()
      expect(getByTestId('ERROR_NO_ORGANIZATION_FOUND')).toBeInTheDocument()
    })
  })

  test('renders error when there are no Media Libraries result', async () => {
    const client = createMockSanityClient({
      requests: {
        '/projects/mock-project-id': {
          organizationId,
        },
      },
    })
    const TestProvider = await createWrapperComponent(client as any)

    const {getByTestId} = render(<TestProvider>{assetSourceComponent}</TestProvider>)

    await waitFor(() => {
      expect(getByTestId('media-library-provision-error')).toBeInTheDocument()
      expect(getByTestId('ERROR_NO_MEDIA_LIBRARIES_FOUND')).toBeInTheDocument()
    })
  })

  test('renders error if creating a new Media Library fails', async () => {
    const client = createMockSanityClient({
      requests: {
        '/projects/mock-project-id': {
          organizationId,
        },
        '/media-libraries?organizationId=mock-organization-id': {
          data: [],
        },
      },
    })
    const TestProvider = await createWrapperComponent(client as any)
    const {getByTestId} = render(<TestProvider>{assetSourceComponent}</TestProvider>)

    await waitFor(() => {
      expect(getByTestId('media-library-provision-error')).toBeInTheDocument()
      expect(getByTestId('ERROR_FAILED_TO_CREATE_MEDIA_LIBRARY')).toBeInTheDocument()
    })
  })

  test('renders error catch by the ErrorBoundary if something unexpected happens', async () => {
    const client = createMockSanityClient({
      requestCallback: (request) => {
        switch (request.uri) {
          case '/projects/mock-project-id':
            return {
              statusCode: 200,
              data: {
                organizationId,
              },
            }
          case '/media-libraries?organizationId=mock-organization-id':
            return {
              statusCode: 400,
              data: {
                error: 'Unexpected error',
              },
            }
          default:
            return undefined
        }
      },
    })
    const TestProvider = await createWrapperComponent(client as any)
    const {getByTestId} = render(<TestProvider>{assetSourceComponent}</TestProvider>)

    await waitFor(() => {
      expect(getByTestId('media-library-provision-error')).toBeInTheDocument()
      expect(getByTestId('MEDIA_LIBRARY_ERROR_UNEXPECTED')).toBeInTheDocument()
    })
  })

  test('provisions a media library successfully', async () => {
    const client = createMockSanityClient({
      requests: {
        '/projects/mock-project-id': {
          organizationId,
        },
        '/media-libraries?organizationId=mock-organization-id': {
          data: [],
        },
        // POST request response to provision a Media Library
        '/media-libraries': {
          id: 'mock-library-id',
          name: 'Mock Media Library',
          organizationId,
          status: 'provisioning',
        },
        '/media-libraries/mock-library-id': {
          id: 'mock-library-id',
          name: 'Mock Media Library',
          organizationId,
          status: 'active',
        },
      },
    })
    const TestProvider = await createWrapperComponent(client as any)
    render(<TestProvider>{assetSourceComponent}</TestProvider>)

    // Provisioning message should be shown
    await waitFor(() => {
      expect(screen.queryByTestId('media-library-provisioning-message')).toBeInTheDocument()
    })

    // Provisioning message should not be shown after the Media Library is provisioned
    await waitFor(() => {
      expect(screen.queryByTestId('media-library-provisioning-message')).not.toBeInTheDocument()
    })

    // Media Library dialog should be shown
    await waitFor(() => {
      expect(screen.queryByTestId('media-library-plugin-dialog-select-assets')).toBeInTheDocument()
    })
  })
})
