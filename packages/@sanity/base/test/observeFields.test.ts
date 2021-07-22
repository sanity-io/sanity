import {v4 as uuid} from 'uuid'
import {first, take, toArray} from 'rxjs/operators'
import {clientV1 as client} from '../fixtures/clients'
import observeFields, {__INTERNAL_CLOSE as close} from '../src/preview/observeFields'

const createId = () => `test.doc.delete.me.${uuid()}`
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

jest.setTimeout(30 * 1000)
jest.mock('part:@sanity/base/client', () => require('../fixtures/clients').clientV1)

describe('observeFields', () => {
  afterAll(async () => {
    close()
    await client.mutate([{delete: {query: '*[_id match "test.doc.delete.me"]'}}])
  })

  it('takes in an ID and an array of fields and returns an observable', async () => {
    const id = createId()

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObserveFields',
      name: 'testing',
      otherValue: 'foo',
    }

    await client.createOrReplace(testDoc)

    const result = await observeFields(
      id,
      // only watch the name field
      ['name']
    )
      .pipe(first())
      .toPromise()

    expect(result).toHaveProperty('name')
    expect(result.name).toBe(testDoc.name)
    expect(result).not.toHaveProperty('otherValue')

    expect(Object.keys(result).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "name",
      ]
    `)
  })

  it('pushes new values down as they update', async () => {
    const id = createId()

    const testDoc = {
      _id: id,
      _type: 'tempTestDocObserveFields',
      name: 'testing',
      otherValue: 'foo',
    }

    await client.createOrReplace(testDoc)

    const resultPromise = observeFields(
      id,
      // only watch the name field
      ['name']
    )
      .pipe(take(3), toArray())
      .toPromise()

    await client.patch(id, {set: {name: 'testing CHANGED'}}).commit()
    await wait(500)

    await client.patch(id, {set: {otherValue: 'foo CHANGED'}}).commit()
    await wait(500)

    await client.patch(id, {set: {name: 'testing CHANGED AGAIN'}}).commit()
    await wait(500)

    const result = await resultPromise

    expect(result.length).toBe(3)
    const [a, b, c] = result

    expect(Object.keys({...a, ...b, ...c}).sort()).toMatchInlineSnapshot(`
      Array [
        "_id",
        "_rev",
        "_type",
        "name",
      ]
    `)

    // first emission is the initial value
    expect(a.name).toBe('testing')
    // second value is the testing CHANGED (note: otherValue is not watched)
    expect(b.name).toBe('testing CHANGED')
    // third value is the last emission
    expect(c.name).toBe('testing CHANGED AGAIN')
  })
})
