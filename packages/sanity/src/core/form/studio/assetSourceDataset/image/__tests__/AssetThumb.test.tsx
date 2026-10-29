import {type Asset} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'

import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../../config/defineConfig'
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
  // The hosted studio serves a strict document Referrer-Policy; without an explicit referrerPolicy
  // the cdn.sanity.io thumbnail request loses its referrer and the CDN refuses it (broken thumbnails).
  test('sets referrerPolicy on the thumbnail img so the CDN request keeps its referrer', async () => {
    const client = createMockSanityClient()
    const TestProvider = await createTestProvider({
      client: client as any,
      config: defineConfig({projectId: 'mock-project-id', dataset: 'test'}),
    })

    render(
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

    const img = screen.getByAltText('test.png')
    expect(img.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin')
  })
})
