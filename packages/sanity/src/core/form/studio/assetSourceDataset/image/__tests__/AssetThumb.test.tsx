import {type Asset} from '@sanity/types'
import {render} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'

import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../../config'
import {AssetThumb} from '../AssetThumb'

const mockAsset = {
  _id: 'image-abc123-200x200-png',
  _type: 'sanity.imageAsset',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _rev: 'rev1',
  assetId: 'abc123',
  extension: 'png',
  mimeType: 'image/png',
  originalFilename: 'test.png',
  path: 'images/mock-project/test/abc123-200x200.png',
  sha1hash: 'abc',
  size: 1024,
  uploadId: 'upload-1',
  url: 'https://cdn.sanity.io/images/mock-project/test/abc123-200x200.png',
  metadata: {
    _type: 'sanity.imageMetadata',
    dimensions: {
      _type: 'sanity.imageDimensions',
      width: 200,
      height: 200,
      aspectRatio: 1,
    },
    hasAlpha: false,
    isOpaque: true,
  },
} as unknown as Asset

describe('AssetThumb', () => {
  // Regression test for https://github.com/sanity-io/sanity/issues/13664 —
  // the grid thumbnail's <img> must set referrerPolicy="strict-origin-when-cross-origin"
  // so it isn't broken on the hosted studio at www.sanity.io, whose document-level
  // Referrer-Policy would otherwise cause the cdn.sanity.io request to be rejected.
  test('renders the thumbnail img with referrerPolicy="strict-origin-when-cross-origin"', async () => {
    const client = createMockSanityClient()
    const TestProvider = await createTestProvider({
      client: client as any,
      config: defineConfig({projectId: 'mock-project-id', dataset: 'test'}),
    })

    const {container} = render(
      <TestProvider>
        <AssetThumb
          asset={mockAsset}
          isSelected={false}
          onClick={noop}
          onKeyPress={noop}
          onDeleteFinished={noop}
        />
      </TestProvider>,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin')
  })
})
