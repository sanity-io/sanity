import {describe, expect, it} from 'vitest'

import {applyMutations} from './applyMutations'
import {ContentLakeError} from './contentLakeError'

const INDEX = {a: {_id: 'a', _type: 'doc', count: 10}}

describe('applyMutations', () => {
  it('increments with inc', () => {
    expect(applyMutations(INDEX, [{patch: {id: 'a', inc: {count: 2}}}]).a?.count).toBe(12)
  })

  it('decrements with dec', () => {
    expect(applyMutations(INDEX, [{patch: {id: 'a', dec: {count: 3}}}]).a?.count).toBe(7)
  })

  it('applies inc and dec in one patch', () => {
    const index = {a: {_id: 'a', _type: 'doc', up: 1, down: 1}}
    const {a} = applyMutations(index, [{patch: {id: 'a', inc: {up: 1}, dec: {down: 1}}}])
    expect(a).toMatchObject({up: 2, down: 0})
  })

  it('wraps a failed apply in a 400', () => {
    const patchMissing = () => applyMutations({}, [{patch: {id: 'missing', set: {title: 'x'}}}])
    expect(patchMissing).toThrow(ContentLakeError)
    expect(patchMissing).toThrow(expect.objectContaining({statusCode: 400}))
  })

  describe('a diffMatchPatch on a value that is not a string', () => {
    const patch = '@@ -1 +1 @@\n-a\n+b\n'
    const index = {
      a: {_id: 'a', _type: 'doc', count: 1, items: [{_key: 'k', title: 'x'}], nested: {}},
    }

    function failureOf(path: string, position = 0) {
      const mutations = [
        ...Array.from({length: position}, () => ({patch: {id: 'a', set: {other: 1}}})),
        {patch: {id: 'a', diffMatchPatch: {[path]: patch}}},
      ]
      try {
        applyMutations(index, mutations)
      } catch (error) {
        return error
      }
      return undefined
    }

    it('answers 400 with the body Content Lake sends for a missing field', () => {
      expect(failureOf('title')).toMatchObject({
        statusCode: 400,
        body: {
          description:
            "Mutation failed: Can't diff-match-patch \"$['title']\", because it is not a string",
          items: [
            {
              error: {
                description: "Can't diff-match-patch \"$['title']\", because it is not a string",
                type: 'validationError',
              },
              index: 0,
            },
          ],
          type: 'mutationError',
        },
      })
    })

    it('names the index of the failing mutation', () => {
      expect(failureOf('title', 2)).toMatchObject({body: {items: [{index: 2}]}})
    })

    it('rejects a field that holds another type', () => {
      expect(failureOf('count')).toMatchObject({statusCode: 400})
    })

    it('extends the path for nested and keyed targets', () => {
      expect(failureOf('nested.title')).toMatchObject({
        body: {description: expect.stringContaining("\"$['nested']['title']\"")},
      })
      expect(failureOf('items[_key=="k"].missing')).toMatchObject({
        body: {description: expect.stringContaining("\"$['items'][?(@._key=='k')]['missing']\"")},
      })
    })
  })
})
