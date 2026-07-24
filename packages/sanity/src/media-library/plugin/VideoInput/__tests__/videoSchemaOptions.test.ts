import {Schema} from '@sanity/schema'
import {describe, expect, it} from 'vitest'

import {mediaLibrarySchemas} from '../../schemas'

describe('sanity.video schema options', () => {
  it('normalizes the selected asset references into a sanity.video media value', () => {
    const schema = Schema.compile({
      name: 'test',
      types: mediaLibrarySchemas,
    })
    const videoType = schema.get('sanity.video')
    const asset = {
      _type: 'globalDocumentReference' as const,
      _ref: 'media-library:library-id:video-asset-instance-id',
      _resource: {type: 'media-library' as const, id: 'library-id'},
    }
    const media = {
      _type: 'globalDocumentReference' as const,
      _ref: 'media-library:library-id:asset-container-id',
      _resource: {type: 'media-library' as const, id: 'library-id'},
    }

    expect(videoType.preview?.select).toEqual({asset: 'asset', media: 'media'})
    expect(videoType.preview?.prepare?.({asset, media})).toEqual({
      media: {_type: 'sanity.video', asset, media},
    })
  })

  it('preserves disableNew on field-level options', () => {
    const schema = Schema.compile({
      name: 'test',
      types: [
        ...mediaLibrarySchemas,
        {
          name: 'testDoc',
          type: 'document',
          fields: [
            {
              name: 'video',
              type: 'sanity.video',
              options: {disableNew: true},
            },
          ],
        },
      ],
    })

    const field = schema.get('testDoc').fields.find((f) => f.name === 'video')
    expect(field?.type.options?.disableNew).toBe(true)
  })
})
