import {SanityDocument} from '@sanity/types'
import {versionedClient} from '../../../../client/versionedClient'
import {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {publish} from './publish'

jest.mock('../../../../client/versionedClient', () => {
  const fn = jest.fn()

  const proxy = new Proxy(
    {},
    {
      get: (_, property) => {
        return (...args: unknown[]) => {
          fn(property, ...args)
          return proxy
        }
      },
    }
  )

  return {
    versionedClient: {
      _fn: fn,
      transaction: () => proxy,
    },
  }
})

jest.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: jest.fn()}))

beforeEach(() => {
  ;((versionedClient as unknown) as {_fn: jest.Mock})._fn.mockClear()
  ;(isLiveEditEnabled as jest.Mock).mockClear()
})

describe('publish', () => {
  describe('disabled', () => {
    // kind of a useless test but preserves the order at least
    it('returns with LIVE_EDIT_ENABLED if isLiveEditEnabled', () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => true
      )

      expect(
        publish.disabled(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {} as any
        )
      ).toBe('LIVE_EDIT_ENABLED')
    })

    it('returns ALREADY_PUBLISHED if there is no draft and there is a published version', () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => false
      )

      expect(
        publish.disabled(({
          typeName: 'blah',
          snapshots: {
            draft: undefined,
            published: {} as SanityDocument,
          },
        } as unknown) as OperationArgs)
      ).toBe('ALREADY_PUBLISHED')
    })

    it('returns NO_CHANGES if there is no draft and there is no published version', () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => false
      )

      expect(
        publish.disabled(({
          typeName: 'blah',
          snapshots: {
            draft: undefined,
            published: undefined,
          },
        } as unknown) as OperationArgs)
      ).toBe('NO_CHANGES')
    })

    it("otherwise the operation isn't disabled", () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => false
      )

      expect(
        publish.disabled(({
          typeName: 'blah',
          snapshots: {
            draft: {} as SanityDocument,
            published: {} as SanityDocument,
          },
        } as unknown) as OperationArgs)
      ).toBe(false)
    })
  })

  describe('execute', () => {
    it('removes the _updatedAt field', () => {
      publish.execute(({
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
        },
        snapshots: {
          draft: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _rev: 'exampleRev',
            _id: 'drafts.my-id',
            _type: 'example',
            _updatedAt: '2021-09-14T22:48:02.303Z',
            newValue: 'hey',
          },
        },
      } as unknown) as OperationArgs)

      expect(((versionedClient as unknown) as {_fn: jest.Mock})._fn.mock.calls).toMatchObject([
        [
          'create',
          {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _id: 'my-id',
            _rev: 'exampleRev',
            _type: 'example',
            newValue: 'hey',
          },
        ],
        ['delete', 'drafts.my-id'],
        ['commit', {tag: 'document.publish'}],
      ])
    })

    it('calls createOrReplace with _revision_lock_pseudo_field_ if there is an already published document', () => {
      publish.execute(({
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
        },
        snapshots: {
          draft: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _rev: 'exampleRev',
            _id: 'drafts.my-id',
            _type: 'example',
            _updatedAt: '2021-09-14T22:48:02.303Z',
            newValue: 'hey',
          },
          published: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _rev: 'exampleRev',
            _id: 'drafts.my-id',
            _type: 'example',
            _updatedAt: '2021-09-14T22:48:02.303Z',
          },
        },
      } as unknown) as OperationArgs)

      expect(((versionedClient as unknown) as {_fn: jest.Mock})._fn.mock.calls).toMatchObject([
        ['patch', 'my-id', {ifRevisionID: 'exampleRev', unset: ['_revision_lock_pseudo_field_']}],
        [
          'createOrReplace',
          {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _id: 'my-id',
            _rev: 'exampleRev',
            _type: 'example',
            newValue: 'hey',
          },
        ],
        ['delete', 'drafts.my-id'],
        ['commit', {tag: 'document.publish'}],
      ])
    })

    it('takes in any  and strengthens references where _strengthenOnPublish is true', () => {
      publish.execute(({
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
        },
        snapshots: {
          draft: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _id: 'drafts.my-id',
            _rev: 'exampleRev',
            _type: 'my-type',
            _updatedAt: '2021-09-14T22:48:02.303Z',
            simpleRef: {
              _type: 'reference',
              _weak: true,
              _ref: 'my-ref',
              _strengthenOnPublish: true,
            },
            notToBeStrengthened: {
              _type: 'reference',
              _weak: true,
              _ref: 'my-ref',
            },
            inAn: [
              {
                _type: 'reference',
                _weak: true,
                _ref: 'my-ref-in-an-',
                _strengthenOnPublish: true,
                _key: 'my-key',
              },
              {
                _key: 'my-other-key',
                _type: 'nestedObj',
                myRef: {
                  _weak: true,
                  _ref: 'my-ref-in-an--nested',
                  _strengthenOnPublish: true,
                },
              },
              {
                _type: 'reference',
                _weak: true,
                _ref: 'my-ref-in-an--no-key',
                _strengthenOnPublish: true,
              },
            ],
          },
          published: null,
        },
      } as unknown) as OperationArgs)

      expect(((versionedClient as unknown) as {_fn: jest.Mock})._fn.mock.calls).toMatchObject([
        [
          'create',
          {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _id: 'my-id',
            _rev: 'exampleRev',
            _type: 'my-type',
            inAn: [
              {_key: 'my-key', _ref: 'my-ref-in-an-', _type: 'reference'},
              {_key: 'my-other-key', _type: 'nestedObj', myRef: {_ref: 'my-ref-in-an--nested'}},
              {_ref: 'my-ref-in-an--no-key', _type: 'reference'},
            ],
            notToBeStrengthened: {_ref: 'my-ref', _type: 'reference', _weak: true},
            simpleRef: {_ref: 'my-ref', _type: 'reference'},
          },
        ],
        ['delete', 'drafts.my-id'],
        ['commit', {tag: 'document.publish'}],
      ])
    })
  })
})
