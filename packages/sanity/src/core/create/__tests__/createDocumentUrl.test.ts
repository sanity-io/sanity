import {getCreateDocumentUrl} from '../createDocumentUrls'
import {type CreateLinkMetadata} from '../types'
import {describe, expect, it} from 'vitest'

describe('createDocumentUrls', () => {
  describe('getCreateDocumentUrl', () => {
    it(`returns Create prod document url`, async () => {
      const metadata: CreateLinkMetadata = {
        _id: 'id',
        dataset: 'dataset',
        ejected: false,
      }
      expect(getCreateDocumentUrl(metadata)).toEqual('https://www.sanity.io/app/create/dataset/id')
    })

    it(`returns Create staging document url`, async () => {
      const metadata: CreateLinkMetadata = {
        _id: 'id',
        dataset: 'dataset',
        ejected: false,
        host: 'https://www.sanity.work',
      }
      expect(getCreateDocumentUrl(metadata)).toEqual(
        'https://create-staging.sanity.build/app/create/dataset/id',
      )
    })
  })
})
