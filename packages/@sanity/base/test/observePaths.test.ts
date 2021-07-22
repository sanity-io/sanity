import {v4 as uuid} from 'uuid'
import {first, take, toArray, share, delay} from 'rxjs/operators'
import {clientV1 as client} from '../fixtures/clients'
import observeFields, {__INTERNAL_CLOSE as close} from '../src/preview/observeFields'
import {createPathObserver} from '../src/preview/createPathObserver'

const observePaths = createPathObserver(observeFields)
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const createId = () => `test.doc.delete.me.${uuid()}`

jest.setTimeout(30 * 1000)
jest.mock('part:@sanity/base/client', () => require('../fixtures/clients').clientV1)

describe('observePaths', () => {
  afterAll(async () => {
    close()
    await client.mutate([{delete: {query: '*[_id match "test.doc.delete.me"]'}}])
  })

  it('takes in a document ID and paths and returns a stream of resolved values', async () => {
    const id = createId()
    const testDoc = {
      _id: id,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      second: 'foo',
      otherValue: 'bar',
    }

    await client.createOrReplace(testDoc)

    const result = await observePaths(id, [['name'], ['second']])
      .pipe(first())
      .toPromise()

    expect(Object.keys(result).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "name",
        "second",
      ]
    `)

    expect(result.name).toBe('testing')
    expect(result.second).toBe('foo')
    expect(result).not.toHaveProperty('otherValue')
  })

  it('recursively resolves references', async () => {
    const refId = createId()
    const id = createId()

    const refDoc = {
      _id: refId,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      otherValue: 'foo',
    }

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      reference: {
        _type: 'reference',
        _ref: refId,
      },
    }

    await client.createOrReplace(refDoc)
    await wait(500)

    await client.createOrReplace(testDoc)
    await wait(500)

    const result = await observePaths(id, [['reference', 'name']])
      .pipe(first())
      .toPromise()

    expect(result).toHaveProperty('reference')
    expect(result.reference).toHaveProperty('name')

    expect(Object.keys(result).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "reference",
      ]
    `)
    expect(Object.keys(result.reference).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "name",
      ]
    `)
  })

  it('accepts paths with dots in them', async () => {
    const refId = createId()
    const id = createId()

    const refDoc = {
      _id: refId,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      otherValue: 'foo',
    }

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
      reference: {
        _type: 'reference',
        _ref: refId,
      },
    }

    await client.createOrReplace(refDoc)
    await wait(500)

    await client.createOrReplace(testDoc)
    await wait(500)

    const result = await observePaths(id, ['reference.name']).pipe(first()).toPromise()

    expect(result).toHaveProperty('reference')
    expect(result.reference).toHaveProperty('name')

    expect(Object.keys(result).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "reference",
      ]
    `)
    expect(Object.keys(result.reference).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "name",
      ]
    `)
  })

  it('pushes doc values when either the doc or the referenced doc updates', async () => {
    const refId = createId()
    const id = createId()

    const refDoc = {
      _id: refId,
      _type: 'tempTestDocObservePaths',
      name: 'testing',
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

    const shared = observePaths(id, [['name'], ['reference', 'name']]).pipe(delay(1000), share())
    const resultPromise = shared.pipe(take(3), toArray()).toPromise()
    await shared.pipe(first()).toPromise() // wait for next one

    await client.patch(id, {set: {name: 'testing CHANGED'}}).commit()
    await shared.pipe(first()).toPromise() // wait for next one

    await client.patch(refId, {set: {name: 'testing CHANGED'}}).commit()
    await shared.pipe(first()).toPromise() // wait for next one

    const result = await resultPromise
    expect(result).toHaveLength(3)
    const [a, b, c] = result

    expect(a.name).toBe('testing')
    expect((a.reference as Record<string, unknown>).name).toBe('testing')

    expect(b.name).toBe('testing CHANGED')
    expect((b.reference as Record<string, unknown>).name).toBe('testing')

    expect(c.name).toBe('testing CHANGED')
    expect((c.reference as Record<string, unknown>).name).toBe('testing CHANGED')
  })
})
