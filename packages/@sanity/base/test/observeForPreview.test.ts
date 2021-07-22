import {SchemaType, ReferenceSchemaType} from '@sanity/types'
import {first, take, toArray, share, delay} from 'rxjs/operators'
import {v4 as uuid} from 'uuid'
import {clientV1 as client} from '../fixtures/clients'
import observeFields, {__INTERNAL_CLOSE as close} from '../src/preview/observeFields'
import {createPreviewObserver} from '../src/preview/createPreviewObserver'
import {createPathObserver} from '../src/preview/createPathObserver'
import resolveRefType from '../src/preview/utils/resolveRefType'
import {INSUFFICIENT_PERMISSIONS_FALLBACK, INVALID_PREVIEW_FALLBACK} from '../src/preview/constants'

const observePaths = createPathObserver(observeFields)
const observeForPreview = createPreviewObserver(observePaths, resolveRefType)

const createId = () => `test.doc.delete.me.${uuid()}`
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

jest.setTimeout(30 * 1000)
jest.mock('part:@sanity/base/client', () => require('../fixtures/clients').clientV1)

describe('createPreviewObserver', () => {
  afterAll(async () => {
    close()
    await client.mutate([{delete: {query: '*[_id match "test.doc.delete.me"]'}}])
  })

  it('returns an observable factory that takes in a value and returns a prepared preview snapshot stream', async () => {
    const mockValue = {name: 'Name'}
    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'object',
      // @ts-expect-error types are not accurate to usage
      preview: {select: {title: 'name'}},
      fields: [
        {
          name: 'name',
          type: {name: 'name', jsonType: 'string'},
        },
      ],
    }

    const result = await observeForPreview(mockValue, mockType).pipe(first()).toPromise()

    expect(result).toEqual({
      snapshot: {title: 'Name'},
      type: mockType,
    })
  })

  it('works with no preview config', async () => {
    const mockValue = {title: 'Title'}
    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'object',
      fields: [
        {
          name: 'title',
          type: {name: 'title', jsonType: 'string'},
        },
      ],
    }

    const result = await observeForPreview(mockValue, mockType).pipe(first()).toPromise()

    expect(result).toEqual({
      snapshot: {title: 'Title'},
      type: mockType,
    })
  })

  it('returns a null snapshot with a non-object value', async () => {
    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'object',
      fields: [
        {
          name: 'title',
          type: {name: 'title', jsonType: 'string'},
        },
      ],
    }

    const result = await observeForPreview('title', mockType).pipe(first()).toPromise()

    expect(result).toEqual({
      snapshot: null,
      type: mockType,
    })
  })

  it('utilizes the schema preview selection and prepare', async () => {
    const mockValue = {name: 'Name'}
    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'object',
      preview: {
        select: {title: 'name'},
        prepare: ({title}) => ({title: `cool ${title}`}),
      },
      fields: [
        {
          name: 'name',
          type: {name: 'name', jsonType: 'string'},
        },
      ],
    }

    const result = await observeForPreview(mockValue, mockType).pipe(first()).toPromise()

    expect(result).toEqual({
      snapshot: {title: 'cool Name'},
      type: mockType,
    })
  })

  it('watches for changes for the selected preview values', async () => {
    const id = createId()

    await client.createOrReplace({
      _id: id,
      _type: 'tempTestDocObserveForPreview',
      name: 'Name',
      otherValue: 'foo',
    })

    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'tempTestDocObserveForPreview',
      // @ts-expect-error types are not accurate to usage
      preview: {select: {title: 'name'}},
      fields: [
        {
          name: 'name',
          type: {name: 'name', jsonType: 'string'},
        },
        {
          name: 'otherValue',
          type: {name: 'otherValue', jsonType: 'string'},
        },
      ],
    }

    const shared = observeForPreview(id, mockType).pipe(delay(1000), share())
    const resultPromise = shared.pipe(take(2), toArray()).toPromise()
    await shared.pipe(first()).toPromise() // wait for next one

    await client.patch(id, {set: {name: 'Name CHANGED'}}).commit()
    await shared.pipe(first()).toPromise() // wait for next one

    const result = await resultPromise

    expect(result).toHaveLength(2)
    const [a, b] = result

    expect(a).toEqual({
      snapshot: {
        _id: id,
        _type: 'tempTestDocObserveForPreview',
        title: 'Name',
      },
      type: mockType,
    })

    expect(b).toEqual({
      snapshot: {
        _id: id,
        _type: 'tempTestDocObserveForPreview',
        title: 'Name CHANGED',
      },
      type: mockType,
    })
  })

  it('resolves and updates references', async () => {
    const refId = createId()

    const refDoc = {
      _id: refId,
      _type: 'tempTestDocObservePathsRef',
      name: 'testing ref',
      otherValue: 'foo',
    }

    await client.createOrReplace(refDoc)
    await wait(1000)

    const mockType: ReferenceSchemaType = {
      jsonType: 'object',
      name: 'tempTestDocObserveForPreview',
      to: [
        {
          // @ts-expect-error types are not accurate to usage
          preview: {select: {title: 'name'}},
          jsonType: 'object',
          name: 'tempTestDocObservePathsRef',
          fields: [
            {
              name: 'name',
              type: {name: 'name', jsonType: 'string'},
            },
          ],
        },
      ],
      fields: [
        {
          name: '_ref',
          type: {name: '_ref', jsonType: 'string'},
        },
        {
          name: '_type',
          type: {name: '_type', jsonType: 'string'},
        },
      ],
    }

    const shared = observeForPreview({_ref: refId}, mockType).pipe(delay(1000), share())
    const resultPromise = shared.pipe(take(2), toArray()).toPromise()
    await shared.pipe(first()).toPromise() // wait for next one

    await client.patch(refId, {set: {name: 'testing ref CHANGED'}}).commit()
    await shared.pipe(first()).toPromise() // wait for next one

    const result = await resultPromise
    expect(result).toHaveLength(2)

    const [a, b] = result

    expect(a).toEqual({
      type: mockType.to[0],
      snapshot: {
        _id: refId,
        _type: 'tempTestDocObservePathsRef',
        title: 'testing ref',
      },
    })

    expect(b).toEqual({
      type: mockType.to[0],
      snapshot: {
        _id: refId,
        _type: 'tempTestDocObservePathsRef',
        title: 'testing ref CHANGED',
      },
    })
  })

  it('resolves to a null snapshot if `_ref` is not found', async () => {
    const mockType: ReferenceSchemaType = {
      jsonType: 'object',
      name: 'tempTestDocObserveForPreview',
      to: [
        {
          // @ts-expect-error types are not accurate to usage
          preview: {select: {title: 'name'}},
          jsonType: 'object',
          name: 'tempTestDocObservePathsRef',
          fields: [
            {
              name: 'name',
              type: {name: 'name', jsonType: 'string'},
            },
          ],
        },
      ],
      fields: [
        {
          name: '_ref',
          type: {name: '_ref', jsonType: 'string'},
        },
        {
          name: '_type',
          type: {name: '_type', jsonType: 'string'},
        },
      ],
    }

    const result = await observeForPreview({}, mockType).toPromise()

    // notice how there is no type
    expect(result).toEqual({snapshot: null})
  })

  it('resolves to a null snapshot + parent type if no matching ref type is found', async () => {
    const refId = createId()

    const refDoc = {
      _id: refId,
      _type: 'tempTestDocObservePathsRef',
      name: 'testing ref',
      otherValue: 'foo',
    }

    const mockType: ReferenceSchemaType = {
      jsonType: 'object',
      name: 'tempTestDocObserveForPreview',
      to: [
        // NOTE: no matching types will cause the returned snapshot to be null
      ],
      fields: [
        {
          name: '_ref',
          type: {name: '_ref', jsonType: 'string'},
        },
        {
          name: '_type',
          type: {name: '_type', jsonType: 'string'},
        },
      ],
    }

    await client.createOrReplace(refDoc)
    await wait(1000)

    const result = await observeForPreview({_ref: refId}, mockType).toPromise()

    // notice how there is no type
    expect(result).toEqual({snapshot: null, type: mockType})
  })

  it('resolves and updates previews with references paths and a prepare function', async () => {
    const refId = createId()
    const id = createId()

    const refDoc = {
      _id: refId,
      _type: 'tempTestDocObservePathsRef',
      name: 'testing ref',
      otherValue: 'foo',
    }

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      otherValueTwo: 'bar',
      reference: {
        _type: 'reference',
        _ref: refId,
      },
    }

    await client.createOrReplace(refDoc)
    await wait(1000)

    await client.createOrReplace(testDoc)
    await wait(1000)

    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'tempTestDocObserveForPreview',
      preview: {
        // @ts-expect-error types are not accurate to usage
        select: {foo: 'reference.name'},
        // @ts-expect-error types are not accurate to usage
        prepare: ({foo}) => ({title: foo, subtitle: 'hard-coded'}),
      },
      fields: [
        {
          name: 'name',
          type: {name: 'name', jsonType: 'string'},
        },
        {
          name: 'otherValue',
          type: {name: 'otherValue', jsonType: 'string'},
        },
        {
          name: 'reference',
          type: {
            name: 'reference',
            jsonType: 'object',
            fields: [
              {
                name: '_ref',
                type: {name: '_ref', jsonType: 'string'},
              },
              {
                name: '_type',
                type: {name: '_type', jsonType: 'string'},
              },
            ],
          },
        },
      ],
    }

    const shared = observeForPreview(id, mockType).pipe(delay(1000), share())
    const resultPromise = shared.pipe(take(3), toArray()).toPromise()
    await shared.pipe(first()).toPromise() // wait for next one

    await client.patch(id, {set: {name: 'testing CHANGED'}}).commit()
    await shared.pipe(first()).toPromise() // wait for next one

    await client.patch(refId, {set: {name: 'testing ref CHANGED'}}).commit()
    await shared.pipe(first()).toPromise() // wait for next one

    const result = await resultPromise
    expect(result).toHaveLength(3)

    const [a, b, c] = result

    expect(a).toEqual({
      type: mockType,
      snapshot: {
        _id: id,
        _type: 'tempTestDocObservePaths',
        title: 'testing ref',
        subtitle: 'hard-coded',
      },
    })

    expect(b).toEqual({
      type: mockType,
      snapshot: {
        _id: id,
        _type: 'tempTestDocObservePaths',
        title: 'testing ref',
        subtitle: 'hard-coded',
      },
    })

    expect(c).toEqual({
      type: mockType,
      snapshot: {
        _id: id,
        _type: 'tempTestDocObservePaths',
        title: 'testing ref CHANGED',
        subtitle: 'hard-coded',
      },
    })
  })

  it('resolves to an insufficient permissions fallback if ref is non-existence but marked as strong', async () => {
    const nonexistentId = createId()
    const id = createId()

    const mockType: ReferenceSchemaType = {
      jsonType: 'object',
      weak: false,
      name: 'tempTestDocObserveForPreview',
      // @ts-expect-error types are not accurate to usage
      preview: {select: {title: 'name'}},
      to: [
        {
          jsonType: 'object',
          name: 'reference',
          fields: [{name: 'name', type: {name: 'name', jsonType: 'string'}}],
        },
      ],
      fields: [
        {
          name: '_ref',
          type: {name: '_ref', jsonType: 'string'},
        },
        {
          name: '_type',
          type: {name: '_type', jsonType: 'string'},
        },
      ],
    }

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      otherValueTwo: 'bar',
      reference: {
        _type: 'reference',
        _weak: true,
        _ref: nonexistentId,
      },
    }

    await client.createOrReplace(testDoc)
    await wait(1000)

    const result = await observeForPreview({_ref: nonexistentId}, mockType)
      .pipe(first())
      .toPromise()

    expect(result).toEqual({
      type: mockType,
      snapshot: INSUFFICIENT_PERMISSIONS_FALLBACK,
    })
  })

  it('resolves to an invalid preview fallback if the prepare function throws', async () => {
    const id = createId()

    const mockType: SchemaType = {
      jsonType: 'object',
      name: 'tempTestDocObserveForPreview',
      preview: {
        select: {title: 'name'},
        prepare: () => {
          throw new Error()
        },
      },
      fields: [
        {
          name: 'name',
          type: {name: 'name', jsonType: 'string'},
        },
      ],
    }

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
    }

    await client.createOrReplace(testDoc)
    await wait(1000)

    const result = await observeForPreview(id, mockType).pipe(first()).toPromise()

    expect(result).toEqual({
      type: mockType,
      snapshot: INVALID_PREVIEW_FALLBACK,
    })
  })
})
