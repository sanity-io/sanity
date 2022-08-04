import type {SanityDocument} from '@sanity/types'
import type {OperationArgs} from '../../types'
import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {publish} from './publish'

jest.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: jest.fn()}))

beforeEach(() => {
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
        publish.disabled({
          typeName: 'blah',
          snapshots: {
            draft: undefined,
            published: {} as SanityDocument,
          },
        } as unknown as OperationArgs)
      ).toBe('ALREADY_PUBLISHED')
    })

    it('returns NO_CHANGES if there is no draft and there is no published version', () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => false
      )

      expect(
        publish.disabled({
          typeName: 'blah',
          snapshots: {
            draft: undefined,
            published: undefined,
          },
        } as unknown as OperationArgs)
      ).toBe('NO_CHANGES')
    })

    it("otherwise the operation isn't disabled", () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => false
      )

      expect(
        publish.disabled({
          typeName: 'blah',
          snapshots: {
            draft: {} as SanityDocument,
            published: {} as SanityDocument,
          },
        } as unknown as OperationArgs)
      ).toBe(false)
    })
  })

  describe('execute', () => {
    it('removes the `_updatedAt` field', () => {
      const client = createMockSanityClient()

      publish.execute({
        client,
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
      } as unknown as OperationArgs)

      expect(client.$log).toMatchSnapshot()
    })

    it('calls createOrReplace with _revision_lock_pseudo_field_ if there is an already published document', () => {
      const client = createMockSanityClient()

      publish.execute({
        client,
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
      } as unknown as OperationArgs)

      expect(client.$log).toMatchSnapshot()
    })

    it('takes in any and strengthens references where _strengthenOnPublish is true', () => {
      const client = createMockSanityClient()

      publish.execute({
        client,
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
      } as unknown as OperationArgs)

      expect(client.$log).toMatchSnapshot()
    })
  })
})
