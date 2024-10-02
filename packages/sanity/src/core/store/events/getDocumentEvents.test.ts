import {describe, expect, it} from '@jest/globals'

import {getDocumentEvents} from './getDocumentEvents'
import {
  type CreateDocumentVersionEvent,
  type CreateLiveDocumentEvent,
  type DeleteDocumentGroupEvent,
  type DeleteDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
  type Transaction,
  type UpdateLiveDocumentEvent,
} from './types'

describe('getDocumentEvents', () => {
  describe('document.createVersion', () => {
    it('creates a draft version', () => {
      const transactions = [
        {
          id: '3fb05c27-2beb-4228-95c4-48f33151dc80',
          timestamp: '2024-09-30T07:49:41.413474Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T07:49:40Z',
                  _id: 'drafts.foo',
                  _type: 'author',
                  _updatedAt: '2024-09-30T07:49:41Z',
                  name: 'bar',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const expectedEvent: CreateDocumentVersionEvent = {
        timestamp: '2024-09-30T07:49:41.413474Z',
        type: 'document.createVersion',
        documentId: 'foo',
        versionId: 'drafts.foo',
        versionRevisionId: '3fb05c27-2beb-4228-95c4-48f33151dc80',
        author: 'p8xDvUMxC',
        releaseId: undefined,
      }
      const events = getDocumentEvents('foo', transactions)

      expect(events).toEqual([expectedEvent])
    })
  })
  describe('document.editVersion ', () => {
    it('edits an existing draft', () => {
      const transactions: Transaction[] = [
        {
          id: 'edit-draft-tx-1',
          timestamp: '2024-10-01T08:20:39.328125Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '9', 23, 19, 20, 15, 17, 'new b', 'title'],
              revert: [19, 4, 11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15],
            },
          },
        },
      ]
      const expectedEvent: EditDocumentVersionEvent = {
        author: 'p8xDvUMxC',
        releaseId: undefined,
        timestamp: '2024-10-01T08:20:39.328125Z',
        type: 'document.editVersion',
        versionId: 'drafts.foo',
        versionRevisionId: 'edit-draft-tx-1',
      }
      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([expectedEvent])
    })
    it('edits an existing draft multiple times within the time window, they are grouped', () => {
      // TODO: Confirm this is the expected behavior
      const transactions: Transaction[] = [
        {
          id: 'edit-draft-tx-3',
          timestamp: '2024-10-01T08:20:40.759147Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 17, 22, '40', 23, 19, 20, 15, 11, 4, 23, 0, 5, 22, 'ook', 15],
              revert: [11, 3, 23, 0, 17, 22, '39', 23, 19, 20, 15, 11, 4, 23, 0, 5, 15],
            },
          },
        },
        {
          id: 'edit-draft-tx-2',
          timestamp: '2024-10-01T08:20:39.328125Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '9', 23, 19, 20, 15, 17, 'new b', 'title'],
              revert: [19, 4, 11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15],
            },
          },
        },
      ]
      const expectedEvent: EditDocumentVersionEvent = {
        type: 'document.editVersion',
        timestamp: '2024-10-01T08:20:40.759147Z',
        author: 'p8xDvUMxC',
        versionId: 'drafts.foo',
        versionRevisionId: 'edit-draft-tx-3',
        mergedEvents: [
          {
            type: 'document.editVersion',
            timestamp: '2024-10-01T08:20:39.328125Z',
            author: 'p8xDvUMxC',
            versionId: 'drafts.foo',
            versionRevisionId: 'edit-draft-tx-2',
          },
        ],
      }

      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([expectedEvent])

      const withAdditionalEvent = getDocumentEvents('foo', [
        {
          id: 'edit-draft-tx-4',
          timestamp: '2024-10-01T08:20:40.759147Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 17, 22, '40', 23, 19, 20, 15, 11, 4, 23, 0, 5, 22, 'ook', 15],
              revert: [11, 3, 23, 0, 17, 22, '39', 23, 19, 20, 15, 11, 4, 23, 0, 5, 15],
            },
          },
        },
        ...transactions,
      ])
      const expectedAdditionalEvent: EditDocumentVersionEvent = {
        type: 'document.editVersion',
        timestamp: '2024-10-01T08:20:40.759147Z',
        author: 'p8xDvUMxC',
        versionId: 'drafts.foo',
        versionRevisionId: 'edit-draft-tx-4',
        mergedEvents: [
          {
            type: 'document.editVersion',
            timestamp: '2024-10-01T08:20:40.759147Z',
            author: 'p8xDvUMxC',
            versionId: 'drafts.foo',
            versionRevisionId: 'edit-draft-tx-3',
          },
          {
            type: 'document.editVersion',
            timestamp: '2024-10-01T08:20:39.328125Z',
            author: 'p8xDvUMxC',
            versionId: 'drafts.foo',
            versionRevisionId: 'edit-draft-tx-2',
          },
        ],
      }

      expect(withAdditionalEvent).toEqual([expectedAdditionalEvent])
    })
  })
  describe('document.deleteVersion', () => {
    it('deletes a draft, no published version exists', () => {
      const transactions = [
        {
          id: 'delete-draft-tx',
          timestamp: '2024-09-30T15:46:07.630718Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T15:46:01Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:46:01Z',
                  title: 'delete draft',
                },
              ],
            },
          },
        },
        {
          id: 'create-draft-tx',
          timestamp: '2024-09-30T15:46:01.919235Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T15:46:01Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:46:01Z',
                  title: 'delete draft',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]

      const expectedEvent: DeleteDocumentVersionEvent = {
        type: 'document.deleteVersion',
        timestamp: '2024-09-30T15:46:07.630718Z',
        author: 'p8xDvUMxC',
        versionId: 'drafts.foo',
        versionRevisionId: 'create-draft-tx',
        releaseId: undefined,
      }

      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([
        expectedEvent,
        {
          type: 'document.createVersion',
          timestamp: '2024-09-30T15:46:01.919235Z',
          author: 'p8xDvUMxC',
          documentId: 'foo',
          versionId: 'drafts.foo',
          releaseId: undefined,
          versionRevisionId: 'create-draft-tx',
        },
      ])
    })
    it('deletes a draft (discard changes), published version exists', () => {
      const transactions: Transaction[] = [
        {
          id: 'discard-changes-tx',
          timestamp: '2024-09-30T16:04:31.096045Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T16:04:07Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T16:04:07Z',
                  title: 'creates  draft',
                },
              ],
            },
          },
        },
        {
          id: 'creates-draft-2-tx',
          timestamp: '2024-09-30T16:04:22.624454Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T16:04:07Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T16:04:07Z',
                  title: 'creates  draft',
                },
              ],
              revert: [0, null],
            },
          },
        },
        {
          id: 'publish-draft-tx',
          timestamp: '2024-09-30T16:04:10.258891Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T16:04:07Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T16:04:07Z',
                  title: 'delete draft, publish exists',
                },
              ],
              revert: [0, null],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T16:04:07Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T16:04:07Z',
                  title: 'delete draft, publish exists',
                },
              ],
            },
          },
        },
        {
          id: 'create-draft-tx',
          timestamp: '2024-09-30T16:04:07.646387Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T16:04:07Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-09-30T16:04:07Z',
                  title: 'delete draft, publish exists',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const expectedEvent: DeleteDocumentVersionEvent = {
        type: 'document.deleteVersion',
        timestamp: '2024-09-30T16:04:31.096045Z',
        author: 'p8xDvUMxC',
        versionId: 'drafts.foo',
        versionRevisionId: 'creates-draft-2-tx',
        releaseId: undefined,
      }

      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([
        expectedEvent,
        {
          type: 'document.createVersion',
          timestamp: '2024-09-30T16:04:22.624454Z',
          author: 'p8xDvUMxC',
          documentId: 'foo',
          versionId: 'drafts.foo',
          releaseId: undefined,
          versionRevisionId: 'creates-draft-2-tx',
        },
        {
          type: 'document.publishVersion',
          timestamp: '2024-09-30T16:04:10.258891Z',
          author: 'p8xDvUMxC',
          revisionId: 'publish-draft-tx',
          releaseId: undefined,
          versionId: 'drafts.foo',
          versionRevisionId: 'create-draft-tx',
          cause: {type: 'document.publish'},
        },
        {
          type: 'document.createVersion',
          timestamp: '2024-09-30T16:04:07.646387Z',
          author: 'p8xDvUMxC',
          documentId: 'foo',
          versionId: 'drafts.foo',
          releaseId: undefined,
          versionRevisionId: 'create-draft-tx',
        },
      ])
    })
    it.skip('deletes a version', () => {})
  })

  describe('document.publishVersion', () => {
    describe('draft version', () => {
      it('publishes a draft', () => {
        const transactions: Transaction[] = [
          {
            id: 'publish-tx',
            timestamp: '2024-09-30T14:00:55.540022Z',
            author: 'p8xDvUMxC',
            documentIDs: ['foo', 'drafts.foo'],
            effects: {
              'foo': {
                apply: [
                  0,
                  {
                    _createdAt: '2024-09-30T14:00:45Z',
                    _id: 'foo',
                    _type: 'author',
                    _updatedAt: '2024-09-30T14:00:50Z',
                    name: 'Foo',
                  },
                ],
                revert: [0, null],
              },
              'drafts.foo': {
                apply: [0, null],
                revert: [
                  0,
                  {
                    _createdAt: '2024-09-30T14:00:45Z',
                    _id: 'foo',
                    _type: 'author',
                    _updatedAt: '2024-09-30T14:00:50Z',
                    name: 'Foo',
                  },
                ],
              },
            },
          },
          {
            id: 'create-draft-tx',
            timestamp: '2024-09-30T14:00:46.027236Z',
            author: 'p8xDvUMxC',
            documentIDs: ['drafts.foo'],
            effects: {
              'drafts.foo': {
                apply: [
                  0,
                  {
                    _createdAt: '2024-09-30T14:00:45Z',
                    _id: 'drafts.foo',
                    _type: 'author',
                    _updatedAt: '2024-09-30T14:00:46Z',
                    name: 'Foo',
                  },
                ],
                revert: [0, null],
              },
            },
          },
        ]
        const expectedEvent: PublishDocumentVersionEvent = {
          type: 'document.publishVersion',
          timestamp: '2024-09-30T14:00:55.540022Z',
          author: 'p8xDvUMxC',
          revisionId: 'publish-tx',
          releaseId: undefined,
          versionId: 'drafts.foo',
          versionRevisionId: 'create-draft-tx',
          cause: {type: 'document.publish'},
        }
        const events = getDocumentEvents('foo', transactions)
        expect(events).toEqual([
          expectedEvent,
          {
            type: 'document.createVersion',
            timestamp: '2024-09-30T14:00:46.027236Z',
            author: 'p8xDvUMxC',
            documentId: 'foo',
            versionId: 'drafts.foo',
            releaseId: undefined,
            versionRevisionId: 'create-draft-tx',
          },
        ])
      })
      it.skip('publishes a scheduled draft', () => {})
    })
    describe('releases version  -- not-implemented', () => {
      it.skip('publishes a release with no schedule', () => {
        // TODO: Implement
        //   {
        //     type: 'document.publishVersion',
        //     timestamp: '2024-09-30T14:00:55.540022Z',
        //     author: 'p8xDvUMxC',
        //     revisionId: 'publish-tx',
        //     releaseId: undefined,
        //     versionId: 'versions.bar.foo',
        //     versionRevisionId: undefined,
        //     cause: {type: 'release.publish'},
        //   },
      })
      it.skip('publishes a release with  schedule', () => {
        // TODO: Implement
        //   {
        //     type: 'document.publishVersion',
        //     timestamp: '2024-09-30T14:00:55.540022Z',
        //     author: 'p8xDvUMxC',
        //     revisionId: 'publish-tx',
        //     releaseId: undefined,
        //     versionId: 'versions.bar.foo',
        //     versionRevisionId: undefined,
        //     cause: {type: 'release.schedule'},
        //   },
      })
    })
  })
  describe('document.unpublish', () => {
    it('unpublishes a document, no draft exists', () => {
      const transactions: Transaction[] = [
        {
          id: 'unpublish-tx',
          timestamp: '2024-09-30T14:40:02.837538Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo', 'foo'],
          effects: {
            'foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T14:00:45Z',
                  _id: 'drafts.foo',
                  _type: 'author',
                  _updatedAt: '2024-09-30T14:11:51Z',
                  name: 'Foo 2',
                },
              ],
            },
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T14:00:45Z',
                  _id: 'drafts.foo',
                  _type: 'author',
                  _updatedAt: '2024-09-30T14:11:51Z',
                  name: 'Foo 2',
                },
              ],
              revert: [0, null],
            },
          },
        },
        {
          id: 'publish-tx',
          timestamp: '2024-09-30T14:00:55.540022Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T14:00:45Z',
                  _id: 'foo',
                  _type: 'author',
                  _updatedAt: '2024-09-30T14:00:50Z',
                  name: 'Foo',
                },
              ],
              revert: [0, null],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T14:00:45Z',
                  _id: 'foo',
                  _type: 'author',
                  _updatedAt: '2024-09-30T14:00:50Z',
                  name: 'Foo',
                },
              ],
            },
          },
        },
        {
          id: 'create-draft-tx',
          timestamp: '2024-09-30T14:00:46.027236Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T14:00:45Z',
                  _id: 'drafts.foo',
                  _type: 'author',
                  _updatedAt: '2024-09-30T14:00:46Z',
                  name: 'Foo',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([
        {
          author: 'p8xDvUMxC',
          releaseId: undefined,
          timestamp: '2024-09-30T14:40:02.837538Z',
          type: 'document.unpublish',
          versionId: 'drafts.foo', // Is it correct to use the draft version id here, we are creating a draft by unpublishing the document.
          versionRevisionId: 'unpublish-tx', //
        },
        {
          type: 'document.publishVersion',
          timestamp: '2024-09-30T14:00:55.540022Z',
          author: 'p8xDvUMxC',
          revisionId: 'publish-tx',
          releaseId: undefined,
          versionId: 'drafts.foo',
          versionRevisionId: 'create-draft-tx',
          cause: {type: 'document.publish'},
        },
        {
          type: 'document.createVersion',
          timestamp: '2024-09-30T14:00:46.027236Z',
          author: 'p8xDvUMxC',
          documentId: 'foo',
          versionId: 'drafts.foo',
          releaseId: undefined,
          versionRevisionId: 'create-draft-tx',
        },
      ])
    })
    it('unpublishes a document, draft exists', () => {
      const transactions: Transaction[] = [
        {
          id: 'unpublish-document-tx',
          timestamp: '2024-09-30T15:04:37.077740Z',
          author: 'p8xDvUMxC',
          documentIDs: ['cffbb991'],
          effects: {
            cffbb991: {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T15:03:44Z',
                  _id: 'cffbb991',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:03:45Z',
                  title: 'a cool book',
                },
              ],
            },
          },
        },
        {
          id: 'edit-draft-tx',
          timestamp: '2024-09-30T15:04:29.810025Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.cffbb991'],
          effects: {
            'drafts.cffbb991': {
              apply: [
                11,
                3,
                23,
                0,
                15,
                22,
                '4:29',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                12,
                22,
                'draft',
                15,
              ],
              revert: [11, 3, 23, 0, 15, 22, '3:45', 23, 19, 20, 15, 11, 4, 23, 0, 12, 15],
            },
          },
        },
        {
          id: 'create-draft-2-tx',
          timestamp: '2024-09-30T15:04:27.776085Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.cffbb991'],
          effects: {
            'drafts.cffbb991': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T15:03:44Z',
                  _id: 'drafts.cffbb991',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:03:45Z',
                  title: 'a cool book ',
                },
              ],
              revert: [0, null],
            },
          },
        },
        {
          id: 'publish-draft-tx',
          timestamp: '2024-09-30T15:03:58.615758Z',
          author: 'p8xDvUMxC',
          documentIDs: ['cffbb991', 'drafts.cffbb991'],
          effects: {
            'cffbb991': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T15:03:44Z',
                  _id: 'cffbb991',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:03:45Z',
                  title: 'a cool book',
                },
              ],
              revert: [0, null],
            },
            'drafts.cffbb991': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-09-30T15:03:44Z',
                  _id: 'cffbb991',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:03:45Z',
                  title: 'a cool book',
                },
              ],
            },
          },
        },
        {
          id: 'create-draft-tx',
          timestamp: '2024-09-30T15:03:45.061639Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.cffbb991'],
          effects: {
            'drafts.cffbb991': {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T15:03:44Z',
                  _id: 'drafts.cffbb991',
                  _type: 'book',
                  _updatedAt: '2024-09-30T15:03:45Z',
                  title: 'a cool book',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const events = getDocumentEvents('cffbb991', transactions)
      expect(events).toEqual([
        {
          type: 'document.unpublish',
          timestamp: '2024-09-30T15:04:37.077740Z',
          author: 'p8xDvUMxC',
          versionId: undefined, // Draft already exists, a new draft was not created from this tx
          versionRevisionId: undefined, // Draft already exists, a new draft was not created from this tx, no revisionId to assign
          releaseId: undefined,
        },
        {
          type: 'document.editVersion',
          timestamp: '2024-09-30T15:04:29.810025Z',
          author: 'p8xDvUMxC',
          releaseId: undefined,
          versionId: 'drafts.cffbb991',
          versionRevisionId: 'edit-draft-tx',
        },
        {
          type: 'document.createVersion',
          timestamp: '2024-09-30T15:04:27.776085Z',
          author: 'p8xDvUMxC',
          documentId: 'cffbb991',
          versionId: 'drafts.cffbb991',
          releaseId: undefined,
          versionRevisionId: 'create-draft-2-tx',
        },
        {
          type: 'document.publishVersion',
          timestamp: '2024-09-30T15:03:58.615758Z',
          author: 'p8xDvUMxC',
          revisionId: 'publish-draft-tx',
          releaseId: undefined,
          versionId: 'drafts.cffbb991',
          versionRevisionId: 'create-draft-tx',
          cause: {type: 'document.publish'},
        },
        {
          type: 'document.createVersion',
          timestamp: '2024-09-30T15:03:45.061639Z',
          author: 'p8xDvUMxC',
          documentId: 'cffbb991',
          versionId: 'drafts.cffbb991',
          releaseId: undefined,
          versionRevisionId: 'create-draft-tx',
        },
      ])
    })
  })

  describe.skip('document.scheduleVersion -- not-implemented', () => {
    it('schedules a version to be published, state is pending', () => {})
    it('schedules a version to be published, state is unscheduled', () => {})
    it('schedules a version to be published, state is published', () => {})
  })
  describe.skip('document.unscheduleVersion -- not-implemented', () => {
    it('unschedules a version', () => {})
  })

  describe('document.deleteGroup  -- not-implemented', () => {
    it('deletes a group - only published doc exists', () => {
      // TODO: How to distinguish this from from a unpublish transaction if the draft exists.
      // They do the same type of operation given the draft is "unedited" it'
      const transactions: Transaction[] = [
        {
          id: 'NQAO7ykovR2JyvCJEXET8v',
          timestamp: '2024-10-01T09:13:02.083217Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T09:12:47Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T09:12:48Z',
                  title: 'delete group, only published doc',
                },
              ],
            },
          },
        },
        {
          id: 'NQAO7ykovR2JyvCJEXEQc9',
          timestamp: '2024-10-01T09:12:50.573839Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T09:12:47Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T09:12:48Z',
                  title: 'delete group, only published doc',
                },
              ],
              revert: [0, null],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T09:12:47Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T09:12:48Z',
                  title: 'delete group, only published doc',
                },
              ],
            },
          },
        },
      ]
      const expectedEvent: DeleteDocumentGroupEvent = {
        type: 'document.deleteGroup',
        timestamp: '2024-10-01T09:13:02.083217Z',
        author: 'p8xDvUMxC',
      }
      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([
        expectedEvent,
        {
          type: 'document.publishVersion',
          timestamp: '2024-10-01T09:12:50.573839Z',
          author: 'p8xDvUMxC',
          revisionId: 'NQAO7ykovR2JyvCJEXEQc9',
          releaseId: undefined,
          versionId: 'drafts.foo',
          versionRevisionId: 'not-found',
          cause: {type: 'document.publish'},
        },
      ])
    })
    it('deletes a group - only draft doc exists', () => {
      // TODO: Confirm we want to have a type: document.deleteVersion in this case
      // This uses the discard action
      const transactions: Transaction[] = [
        {
          id: 'NQAO7ykovR2JyvCJEXQZNp',
          timestamp: '2024-10-01T10:19:35.130918Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T10:19:27Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T10:19:29Z',
                  title: 'Foo bookj',
                },
              ],
            },
          },
        },
        {
          id: 'e6e8a58d-f926-4743-9db9-122012273f67',
          timestamp: '2024-10-01T10:19:29.867625Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '9', 23, 19, 20, 15, 17, 'Foo bookj', 'title'],
              revert: [11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15, 11, 4, 23, 0, 4, 15],
            },
          },
        },
      ]
      const expectedEvent: DeleteDocumentVersionEvent = {
        type: 'document.deleteVersion',
        timestamp: '2024-10-01T10:19:35.130918Z',
        author: 'p8xDvUMxC',
        versionId: 'drafts.foo',
        versionRevisionId: 'e6e8a58d-f926-4743-9db9-122012273f67',
        releaseId: undefined,
      }
      const events = getDocumentEvents('foo', transactions)
      expect(events[0]).toEqual(expectedEvent)
    })
    it('deletes a group - draft and published docs exist', () => {
      const transactions = [
        {
          id: 'Cs9MM9AmleFTukvUAlITNA',
          timestamp: '2024-10-01T10:25:50.203497Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T10:25:33Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T10:25:34Z',
                  title: 'Foo bar',
                },
              ],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T10:25:33Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T10:25:39Z',
                  title: 'Foo bar aras',
                },
              ],
            },
          },
        },
      ]
      const expectedEvent: DeleteDocumentGroupEvent = {
        author: 'p8xDvUMxC',
        timestamp: '2024-10-01T10:25:50.203497Z',
        type: 'document.deleteGroup',
      }
      const events = getDocumentEvents('foo', transactions)
      expect(events[0]).toEqual(expectedEvent)
    })
    it.skip('deletes a group - draft, versions and published docs exist', () => {})
  })

  describe('document.createLive', () => {
    it('creates a live document', () => {
      const transactions: Transaction[] = [
        {
          id: 'create-live-doc-tx',
          timestamp: '2024-09-30T16:15:06.436356Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T16:15:05Z',
                  _id: 'foo',
                  _type: 'playlist',
                  _updatedAt: '2024-09-30T16:15:06Z',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const expectedEvent: CreateLiveDocumentEvent = {
        type: 'document.createLive',
        timestamp: '2024-09-30T16:15:06.436356Z',
        author: 'p8xDvUMxC',
        revisionId: 'create-live-doc-tx',
        documentId: 'foo',
      }
      const events = getDocumentEvents('foo', transactions)

      expect(events).toEqual([expectedEvent])
    })
  })
  describe('document.updateLive', () => {
    it('updates a live document', () => {
      const transactions: Transaction[] = [
        {
          id: 'update-live-doc-tx',
          timestamp: '2024-09-30T16:22:37.797887Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [11, 3, 23, 0, 18, 22, '7', 23, 19, 20, 15, 17, 'live', 'name'],
              revert: [19, 4, 10, 0, 14, '_updatedAt'],
            },
          },
        },
        {
          id: 'create-live-doc-tx',
          timestamp: '2024-09-30T16:22:30.845003Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [
                0,
                {
                  _createdAt: '2024-09-30T16:22:30Z',
                  _id: 'foo',
                  _type: 'playlist',
                  _updatedAt: '2024-09-30T16:22:30Z',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const expectedEvent: UpdateLiveDocumentEvent = {
        type: 'document.updateLive',
        timestamp: '2024-09-30T16:22:37.797887Z',
        author: 'p8xDvUMxC',
        documentId: 'foo',
        revisionId: 'update-live-doc-tx',
      }
      const events = getDocumentEvents('foo', transactions)
      expect(events).toEqual([
        expectedEvent,
        {
          type: 'document.createLive',
          timestamp: '2024-09-30T16:22:30.845003Z',
          author: 'p8xDvUMxC',
          documentId: 'foo',
          revisionId: 'create-live-doc-tx',
        },
      ])
    })
  })
  describe('a long chain of transactions, imitating documents lifecycle', () => {
    it('creates a draft document, adds some edits, publishes the document, updates the draft and publishes again, then the group is removed', () => {
      const transactions: Transaction[] = [
        {
          id: '7X3uqAgvtaInRcPnekUfOB',
          timestamp: '2024-10-01T13:50:40.265737Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T13:50:03Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:50:27Z',
                  title: 'Doing some edits, edits after publish',
                },
              ],
            },
          },
        },
        {
          id: 'hfvKO9BRAN56Oji1mf9vyF',
          timestamp: '2024-10-01T13:50:27.113129Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [
                11,
                3,
                23,
                0,
                17,
                22,
                '27',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                18,
                22,
                'edits after publish',
                15,
              ],
              revert: [
                11,
                3,
                23,
                0,
                17,
                22,
                '15',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                18,
                22,
                'new more edits',
                15,
              ],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T13:50:03Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:50:22Z',
                  title: 'Doing some edits, edits after publish',
                },
              ],
            },
          },
        },
        {
          id: '43322dc5-dd5d-4264-8380-839820114a47',
          timestamp: '2024-10-01T13:50:22.074572Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                11,
                3,
                23,
                0,
                18,
                22,
                '2',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                31,
                22,
                'ublish',
                15,
              ],
              revert: [11, 3, 23, 0, 18, 22, '0', 23, 19, 20, 15, 11, 4, 23, 0, 31, 15],
            },
          },
        },
        {
          id: '119a88fa-c842-460f-bf95-3f59e8a337cf',
          timestamp: '2024-10-01T13:50:20.790669Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                11,
                3,
                23,
                0,
                17,
                22,
                '20',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                19,
                22,
                'dits after p',
                15,
              ],
              revert: [11, 3, 23, 0, 17, 22, '15', 23, 19, 20, 15, 11, 4, 23, 0, 19, 15],
            },
          },
        },
        {
          id: 'f2090b01-2652-4022-a00f-1e2bab214feb',
          timestamp: '2024-10-01T13:50:19.164999Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:50:03Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:50:15Z',
                  title: 'Doing some edits, e',
                },
              ],
              revert: [0, null],
            },
          },
        },
        {
          id: '7X3uqAgvtaInRcPnekUQCf',
          timestamp: '2024-10-01T13:50:16.101750Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:50:03Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:50:15Z',
                  title: 'Doing some edits, new more edits',
                },
              ],
              revert: [0, null],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T13:50:03Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:50:15Z',
                  title: 'Doing some edits, new more edits',
                },
              ],
            },
          },
        },
        {
          id: 'df1015a4-56e3-4e9b-a113-58574d953872',
          timestamp: '2024-10-01T13:50:15.326470Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                11,
                3,
                23,
                0,
                18,
                22,
                '5',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                26,
                22,
                ' edits',
                15,
              ],
              revert: [11, 3, 23, 0, 18, 22, '3', 23, 19, 20, 15, 11, 4, 23, 0, 26, 15],
            },
          },
        },
        {
          id: 'ee2fcd85-c6a7-4edf-81ba-020a09e43249',
          timestamp: '2024-10-01T13:50:13.565141Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                11,
                3,
                23,
                0,
                18,
                22,
                '3',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                17,
                22,
                ' new more',
                15,
              ],
              revert: [11, 3, 23, 0, 18, 22, '1', 23, 19, 20, 15, 11, 4, 23, 0, 17, 15],
            },
          },
        },
        {
          id: '4b6c1788-39d1-4735-9fbf-efba941ea228',
          timestamp: '2024-10-01T13:50:11.933594Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 17, 22, '11', 23, 19, 20, 15, 11, 4, 23, 0, 16, 22, ',', 15],
              revert: [11, 3, 23, 0, 17, 22, '07', 23, 19, 20, 15, 11, 4, 23, 0, 16, 15],
            },
          },
        },
        {
          id: 'df84dbb2-a525-4535-ac0d-1e47452f87c4',
          timestamp: '2024-10-01T13:50:07.215155Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '7', 23, 19, 20, 15, 11, 4, 23, 0, 14, 22, 'ts', 15],
              revert: [11, 3, 23, 0, 18, 22, '5', 23, 19, 20, 15, 11, 4, 23, 0, 14, 15],
            },
          },
        },
        {
          id: 'cf73dd44-c9fb-4277-93b1-1c7295fa4f91',
          timestamp: '2024-10-01T13:50:05.765932Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '5', 23, 19, 20, 15, 17, 'Doing some edi', 'title'],
              revert: [19, 4, 11, 3, 23, 0, 18, 22, '4', 23, 19, 20, 15],
            },
          },
        },
        {
          id: '7f789263-e111-4e43-826e-c4f98013b531',
          timestamp: '2024-10-01T13:50:04.125782Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:50:03Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:50:04Z',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const events = getDocumentEvents('foo', transactions)
      const expectedEvents: DocumentGroupEvent[] = [
        {
          timestamp: '2024-10-01T13:50:40.265737Z',
          author: 'p8xDvUMxC',
          type: 'document.deleteGroup',
        },
        {
          timestamp: '2024-10-01T13:50:27.113129Z',
          author: 'p8xDvUMxC',
          type: 'document.publishVersion',
          revisionId: 'hfvKO9BRAN56Oji1mf9vyF',
          versionId: 'drafts.foo',
          versionRevisionId: '43322dc5-dd5d-4264-8380-839820114a47',
          cause: {
            type: 'document.publish',
          },
        },
        {
          timestamp: '2024-10-01T13:50:22.074572Z',
          author: 'p8xDvUMxC',
          type: 'document.editVersion',
          versionId: 'drafts.foo',
          versionRevisionId: '43322dc5-dd5d-4264-8380-839820114a47',
          mergedEvents: [
            {
              timestamp: '2024-10-01T13:50:20.790669Z',
              author: 'p8xDvUMxC',
              type: 'document.editVersion',
              versionId: 'drafts.foo',
              versionRevisionId: '119a88fa-c842-460f-bf95-3f59e8a337cf',
            },
          ],
        },
        {
          timestamp: '2024-10-01T13:50:19.164999Z',
          author: 'p8xDvUMxC',
          type: 'document.createVersion',
          documentId: 'foo',
          versionId: 'drafts.foo',
          versionRevisionId: 'f2090b01-2652-4022-a00f-1e2bab214feb',
        },
        {
          timestamp: '2024-10-01T13:50:16.101750Z',
          author: 'p8xDvUMxC',
          type: 'document.publishVersion',
          revisionId: '7X3uqAgvtaInRcPnekUQCf',
          versionId: 'drafts.foo',
          versionRevisionId: 'df1015a4-56e3-4e9b-a113-58574d953872',
          cause: {
            type: 'document.publish',
          },
        },
        {
          timestamp: '2024-10-01T13:50:15.326470Z',
          author: 'p8xDvUMxC',
          type: 'document.editVersion',
          versionId: 'drafts.foo',
          versionRevisionId: 'df1015a4-56e3-4e9b-a113-58574d953872',
          mergedEvents: [
            {
              timestamp: '2024-10-01T13:50:13.565141Z',
              author: 'p8xDvUMxC',
              type: 'document.editVersion',
              versionId: 'drafts.foo',
              versionRevisionId: 'ee2fcd85-c6a7-4edf-81ba-020a09e43249',
            },
            {
              timestamp: '2024-10-01T13:50:11.933594Z',
              author: 'p8xDvUMxC',
              type: 'document.editVersion',
              versionId: 'drafts.foo',
              versionRevisionId: '4b6c1788-39d1-4735-9fbf-efba941ea228',
            },
            {
              timestamp: '2024-10-01T13:50:07.215155Z',
              author: 'p8xDvUMxC',
              type: 'document.editVersion',
              versionId: 'drafts.foo',
              versionRevisionId: 'df84dbb2-a525-4535-ac0d-1e47452f87c4',
            },
            {
              timestamp: '2024-10-01T13:50:05.765932Z',
              author: 'p8xDvUMxC',
              type: 'document.editVersion',
              versionId: 'drafts.foo',
              versionRevisionId: 'cf73dd44-c9fb-4277-93b1-1c7295fa4f91',
            },
          ],
        },
        {
          timestamp: '2024-10-01T13:50:04.125782Z',
          author: 'p8xDvUMxC',
          type: 'document.createVersion',
          documentId: 'foo',
          versionId: 'drafts.foo',
          versionRevisionId: '7f789263-e111-4e43-826e-c4f98013b531',
        },
      ]
      expect(events).toEqual(expectedEvents)
    })
    it('creates a draft document, adds some edits, publishes the doc, then the document is unpublished, draft is removed, finally draft is restored', () => {
      const transactions: Transaction[] = [
        {
          id: 'NQAO7ykovR2JyvCJEYUfaz',
          timestamp: '2024-10-01T13:57:18.716920Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:57:18Z',
                  title: 'Foo 12',
                },
              ],
              revert: [0, null],
            },
          },
        },
        {
          id: '7X3uqAgvtaInRcPnekY9ep',
          timestamp: '2024-10-01T13:57:02.426734Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:56:03Z',
                  title: 'Foo 12',
                },
              ],
            },
          },
        },
        {
          id: 'Cs9MM9AmleFTukvUAmGEQ4',
          timestamp: '2024-10-01T13:56:25.700407Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo', 'foo'],
          effects: {
            'foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:56:03Z',
                  title: 'Foo 12',
                },
              ],
            },
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:56:03Z',
                  title: 'Foo 12',
                },
              ],
              revert: [0, null],
            },
          },
        },
        {
          id: '7X3uqAgvtaInRcPnekXqDV',
          timestamp: '2024-10-01T13:56:19.108493Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo', 'drafts.foo'],
          effects: {
            'foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:56:03Z',
                  title: 'Foo 12',
                },
              ],
              revert: [0, null],
            },
            'drafts.foo': {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:56:03Z',
                  title: 'Foo 12',
                },
              ],
            },
          },
        },
        {
          id: 'a9953800-b9ef-4744-9f83-4b86caa3f988',
          timestamp: '2024-10-01T13:56:03.479036Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '3', 23, 19, 20, 15, 11, 4, 23, 0, 5, 22, '2', 15],
              revert: [11, 3, 23, 0, 18, 22, '2', 23, 19, 20, 15, 11, 4, 23, 0, 5, 15],
            },
          },
        },
        {
          id: '6affadb3-925e-4705-a1a5-34f8258cbd14',
          timestamp: '2024-10-01T13:56:02.073790Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [11, 3, 23, 0, 18, 22, '2', 23, 19, 20, 15, 17, 'Foo 1', 'title'],
              revert: [10, 0, 14, '_updatedAt', 11, 4, 23, 0, 4, 15],
            },
          },
        },
        {
          id: '14e5c10d-e003-42ed-a289-785dd4d1c0d3',
          timestamp: '2024-10-01T13:56:00.375209Z',
          author: 'p8xDvUMxC',
          documentIDs: ['drafts.foo'],
          effects: {
            'drafts.foo': {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T13:56:00Z',
                  _id: 'drafts.foo',
                  _type: 'book',
                  _updatedAt: '2024-10-01T13:56:00Z',
                  title: 'Foo ',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const events = getDocumentEvents('foo', transactions)
      const expectedEvents: DocumentGroupEvent[] = [
        {
          timestamp: '2024-10-01T13:57:18.716920Z',
          author: 'p8xDvUMxC',
          // TODO: Consider having a "document.restoreVersion" event
          type: 'document.createVersion',
          documentId: 'foo',
          versionId: 'drafts.foo',
          versionRevisionId: 'NQAO7ykovR2JyvCJEYUfaz',
        },
        {
          timestamp: '2024-10-01T13:57:02.426734Z',
          author: 'p8xDvUMxC',
          type: 'document.deleteVersion',
          versionId: 'drafts.foo',
          versionRevisionId: 'Cs9MM9AmleFTukvUAmGEQ4',
        },
        {
          timestamp: '2024-10-01T13:56:25.700407Z',
          author: 'p8xDvUMxC',
          type: 'document.unpublish',
          versionId: 'drafts.foo',
          versionRevisionId: 'Cs9MM9AmleFTukvUAmGEQ4',
        },
        {
          timestamp: '2024-10-01T13:56:19.108493Z',
          author: 'p8xDvUMxC',
          type: 'document.publishVersion',
          revisionId: '7X3uqAgvtaInRcPnekXqDV',
          versionId: 'drafts.foo',
          versionRevisionId: 'a9953800-b9ef-4744-9f83-4b86caa3f988',
          cause: {
            type: 'document.publish',
          },
        },
        {
          timestamp: '2024-10-01T13:56:03.479036Z',
          author: 'p8xDvUMxC',
          type: 'document.editVersion',
          versionId: 'drafts.foo',
          versionRevisionId: 'a9953800-b9ef-4744-9f83-4b86caa3f988',
          mergedEvents: [
            {
              timestamp: '2024-10-01T13:56:02.073790Z',
              author: 'p8xDvUMxC',
              type: 'document.editVersion',
              versionId: 'drafts.foo',
              versionRevisionId: '6affadb3-925e-4705-a1a5-34f8258cbd14',
            },
          ],
        },
        {
          timestamp: '2024-10-01T13:56:00.375209Z',
          author: 'p8xDvUMxC',
          type: 'document.createVersion',
          documentId: 'foo',
          versionId: 'drafts.foo',
          versionRevisionId: '14e5c10d-e003-42ed-a289-785dd4d1c0d3',
        },
      ]
      expect(events).toEqual(expectedEvents)
    })
    it('creates a live editable document and do edits on it, then it is removed', () => {
      const transactions: Transaction[] = [
        {
          id: '7X3uqAgvtaInRcPnekknt5',
          timestamp: '2024-10-01T14:18:42.658609Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [0, null],
              revert: [
                0,
                {
                  _createdAt: '2024-10-01T14:17:56Z',
                  _id: 'foo',
                  _type: 'playlist',
                  _updatedAt: '2024-10-01T14:18:05Z',
                  name: 'live editing this is now saved',
                },
              ],
            },
          },
        },
        {
          id: 'f7e370f2-0996-4f58-8ae7-ac9b074d4b2d',
          timestamp: '2024-10-01T14:18:05.245942Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [11, 3, 23, 0, 18, 22, '5', 23, 19, 20, 15, 11, 4, 23, 0, 25, 22, 'saved', 15],
              revert: [11, 3, 23, 0, 18, 22, '4', 23, 19, 20, 15, 11, 4, 23, 0, 25, 15],
            },
          },
        },
        {
          id: '68cb1bd2-da1f-4680-b904-4c8663ef1978',
          timestamp: '2024-10-01T14:18:04.238826Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [
                11,
                3,
                23,
                0,
                18,
                22,
                '4',
                23,
                19,
                20,
                15,
                11,
                4,
                23,
                0,
                14,
                22,
                'his is now ',
                15,
              ],
              revert: [11, 3, 23, 0, 18, 22, '3', 23, 19, 20, 15, 11, 4, 23, 0, 14, 15],
            },
          },
        },
        {
          id: '9b84c71f-5757-4be9-a687-141a5ad60787',
          timestamp: '2024-10-01T14:18:03.193480Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [11, 3, 23, 0, 18, 22, '3', 23, 19, 20, 15, 11, 4, 23, 0, 13, 22, 't', 15],
              revert: [11, 3, 23, 0, 18, 22, '1', 23, 19, 20, 15, 11, 4, 23, 0, 13, 15],
            },
          },
        },
        {
          id: '584182b2-2bc3-4808-a03d-da18774702b5',
          timestamp: '2024-10-01T14:18:01.900710Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [11, 3, 23, 0, 15, 22, '8:01', 23, 19, 20, 15, 11, 4, 23, 0, 12, 22, ' ', 15],
              revert: [11, 3, 23, 0, 15, 22, '7:59', 23, 19, 20, 15, 11, 4, 23, 0, 12, 15],
            },
          },
        },
        {
          id: 'd7791764-2204-4a7e-89e3-3d6a6f2434d7',
          timestamp: '2024-10-01T14:17:59.547949Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [11, 3, 23, 0, 18, 22, '9', 23, 19, 20, 15, 11, 4, 22, 'l', 23, 0, 11, 15],
              revert: [11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15, 11, 4, 23, 1, 12, 15],
            },
          },
        },
        {
          id: 'b15933c6-0691-4436-8d75-b8bdfc4ec6eb',
          timestamp: '2024-10-01T14:17:58.508566Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [17, 'ive editing', 'name'],
              revert: [19, 4],
            },
          },
        },
        {
          id: '1d551112-0866-480b-844a-ca370e86a95a',
          timestamp: '2024-10-01T14:17:58.047179Z',
          author: 'p8xDvUMxC',
          documentIDs: ['foo'],
          effects: {
            foo: {
              apply: [
                0,
                {
                  _createdAt: '2024-10-01T14:17:56Z',
                  _id: 'foo',
                  _type: 'playlist',
                  _updatedAt: '2024-10-01T14:17:58Z',
                },
              ],
              revert: [0, null],
            },
          },
        },
      ]
      const events = getDocumentEvents('foo', transactions)
      const expectedEvents = [
        {
          timestamp: '2024-10-01T14:18:42.658609Z',
          author: 'p8xDvUMxC',
          type: 'document.deleteGroup',
        },
        {
          timestamp: '2024-10-01T14:18:05.245942Z',
          author: 'p8xDvUMxC',
          type: 'document.updateLive',
          documentId: 'foo',
          revisionId: 'f7e370f2-0996-4f58-8ae7-ac9b074d4b2d',
        },
        {
          timestamp: '2024-10-01T14:18:04.238826Z',
          author: 'p8xDvUMxC',
          type: 'document.updateLive',
          documentId: 'foo',
          revisionId: '68cb1bd2-da1f-4680-b904-4c8663ef1978',
        },
        {
          timestamp: '2024-10-01T14:18:03.193480Z',
          author: 'p8xDvUMxC',
          type: 'document.updateLive',
          documentId: 'foo',
          revisionId: '9b84c71f-5757-4be9-a687-141a5ad60787',
        },
        {
          timestamp: '2024-10-01T14:18:01.900710Z',
          author: 'p8xDvUMxC',
          type: 'document.updateLive',
          documentId: 'foo',
          revisionId: '584182b2-2bc3-4808-a03d-da18774702b5',
        },
        {
          timestamp: '2024-10-01T14:17:59.547949Z',
          author: 'p8xDvUMxC',
          type: 'document.updateLive',
          documentId: 'foo',
          revisionId: 'd7791764-2204-4a7e-89e3-3d6a6f2434d7',
        },
        {
          timestamp: '2024-10-01T14:17:58.508566Z',
          author: 'p8xDvUMxC',
          type: 'document.updateLive',
          documentId: 'foo',
          revisionId: 'b15933c6-0691-4436-8d75-b8bdfc4ec6eb',
        },
        {
          timestamp: '2024-10-01T14:17:58.047179Z',
          author: 'p8xDvUMxC',
          type: 'document.createLive',
          documentId: 'foo',
          revisionId: '1d551112-0866-480b-844a-ca370e86a95a',
        },
      ]
      expect(events).toEqual(expectedEvents)
    })
  })
})
