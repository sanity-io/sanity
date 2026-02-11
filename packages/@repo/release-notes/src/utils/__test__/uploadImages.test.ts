import {type SanityImageAssetDocument} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {markdownToPortableText} from '../portabletext-markdown/markdownToPortableText'
import {extractReleaseNotes} from '../pullRequestReleaseNotes'
import {uploadImages} from '../uploadImages'
import {keyGenerator, readFixture} from './helpers'

const assetDocument = ({id}: {id: string}): SanityImageAssetDocument => ({
  _id: id,
  _createdAt: '',
  _originalId: '',
  _rev: '',
  _updatedAt: '',
  extension: '',
  metadata: {
    _type: 'sanity.imageMetadata',
    dimensions: {_type: 'sanity.imageDimensions', aspectRatio: 0, height: 0, width: 0},
    hasAlpha: false,
    isOpaque: false,
  },
  mimeType: '',
  originalFilename: '',
  path: '',
  sha1hash: '',
  size: 0,
  uploadId: '',
  url: '',
  _type: 'sanity.imageAsset',
  assetId: 'mocked_asset_id',
})

describe('uploadImages()', () => {
  it('uploads images from markdown', async () => {
    const notes = extractReleaseNotes(
      markdownToPortableText(await readFixture('pr-with-images.md'), {
        keyGenerator: keyGenerator(),
      }),
    )

    const imageNumber = 0
    const mockClient = {
      assets: {
        upload: vi.fn(async () => {
          return assetDocument({id: `mocked_image_id_${imageNumber}`})
        }),
      },
    }
    const notesWithAssets = await uploadImages(mockClient, notes)

    expect(notesWithAssets).toMatchInlineSnapshot(`
      [
        {
          "_key": "key-6",
          "_type": "block",
          "children": [
            {
              "_key": "key-7",
              "_type": "span",
              "marks": [],
              "text": "In markdown’s gentle, ticking time,
      I shape my thoughts in simple rhyme—
      With hashes bold and asterisks bright,
      I carve out headings in the night.",
            },
          ],
          "markDefs": [],
          "style": "normal",
        },
        {
          "_key": "key-8",
          "_type": "block",
          "children": [
            {
              "_key": "key-9",
              "_type": "image",
              "asset": {
                "_ref": "mocked_image_id_0",
                "_type": "reference",
              },
            },
            {
              "_key": "key-11",
              "_type": "span",
              "marks": [
                "key-10",
              ],
              "text": "pr-with-images.md",
            },
          ],
          "markDefs": [
            {
              "_key": "key-10",
              "_type": "link",
              "href": "pr-with-images.md",
            },
          ],
          "style": "normal",
        },
        {
          "_key": "key-18",
          "_type": "image",
          "alt": "Screenshot 2026-01-28 at 12 55 05",
          "asset": {
            "_ref": "mocked_image_id_0",
            "_type": "reference",
          },
        },
        {
          "_key": "key-13",
          "_type": "block",
          "children": [
            {
              "_key": "key-14",
              "_type": "span",
              "marks": [],
              "text": "Some gifs:
      ",
            },
            {
              "_key": "key-15",
              "_type": "image",
              "asset": {
                "_ref": "mocked_image_id_0",
                "_type": "reference",
              },
            },
          ],
          "markDefs": [],
          "style": "normal",
        },
        {
          "_key": "key-20",
          "_type": "image",
          "alt": "Image",
          "asset": {
            "_ref": "mocked_image_id_0",
            "_type": "reference",
          },
        },
      ]
    `)
  })
})
