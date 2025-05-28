import {describe, expect, it} from 'vitest'

import {defineField} from '../schema'
import {isAssetAspect} from './asserters'
import {defineAssetAspect} from './defineAssetAspect'

describe('defineAssetAspect', () => {
  it('produces a valid aspect document', () => {
    const aspect = defineAssetAspect({
      name: 'someAspect',
      title: 'Some Aspect',
      type: 'object',
      fields: [
        defineField({
          name: 'test',
          type: 'string',
        }),
      ],
    })

    expect(aspect._type).toBe('sanity.asset.aspect')

    expect(isAssetAspect(aspect)).toBeTruthy()

    expect(aspect).toMatchInlineSnapshot(`
      {
        "_id": "someAspect",
        "_type": "sanity.asset.aspect",
        "definition": {
          "fields": [
            {
              "name": "test",
              "type": "string",
            },
          ],
          "name": "someAspect",
          "title": "Some Aspect",
          "type": "object",
        },
      }
    `)
  })

  it('sets the `_id` to the same value as `name`', () => {
    const aspect = defineAssetAspect({
      name: 'someAspect',
      title: 'Some Aspect',
      type: 'object',
      fields: [
        defineField({
          name: 'test',
          type: 'string',
        }),
      ],
    })

    expect(aspect._id).toBe('someAspect')
  })
})
