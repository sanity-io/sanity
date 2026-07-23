import {Schema} from '@sanity/schema'
import {describe, expect, it} from 'vitest'

import {mediaLibrarySchemas} from '../../schemas'

describe('sanity.video schema options', () => {
  it('preserves disableNew on field-level options', () => {
    const schema = Schema.compile({
      name: 'test',
      types: [
        ...mediaLibrarySchemas,
        {
          name: 'testDoc',
          type: 'document',
          fields: [
            {
              name: 'video',
              type: 'sanity.video',
              options: {disableNew: true},
            },
          ],
        },
      ],
    })

    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    const field = schema.get('testDoc').fields.find((f) => f.name === 'video')
    expect(field?.type.options?.disableNew).toBe(true)
  })
})
