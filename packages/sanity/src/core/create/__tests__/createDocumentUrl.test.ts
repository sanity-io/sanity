import {describe, expect, it} from 'vitest'

import {getCreateDocumentUrl, getCreateLinkUrl} from '../createDocumentUrls'
import {type CreateLinkMetadata} from '../types'

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

  describe('getCreateLinkUrl', () => {
    it(`returns Create prod create link url`, async () => {
      expect(
        getCreateLinkUrl({
          docId: 'id',
          documentType: 'documentType',
          appId: 'appId',
          projectId: 'projectId',
          workspaceName: 'workspace',
        }),
      ).toEqual(
        'https://www.sanity.io/app/create/studio-import?' +
          'projectId=projectId&' +
          'applicationId=appId&' +
          'workspaceName=workspace&' +
          'documentType=documentType&' +
          'documentId=id',
      )
    })

    it(`returns Create staging create link url`, async () => {
      expect(
        getCreateLinkUrl({
          docId: 'id',
          documentType: 'documentType',
          appId: 'appId',
          projectId: 'projectId',
          workspaceName: 'workspace',
          customHost: 'https://www.sanity.work',
        }),
      ).toEqual(
        'https://create-staging.sanity.build/app/create/studio-import?' +
          'projectId=projectId&' +
          'applicationId=appId&' +
          'workspaceName=workspace&' +
          'documentType=documentType&' +
          'documentId=id',
      )
    })
  })
})
