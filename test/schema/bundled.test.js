import {test} from 'tap'
import {Schema} from '../../src'

test('image types with fields', t => {
  const schema = Schema.compile({
    name: 'my-schema',
    types: [
      {
        name: 'someImage',
        type: 'image',
        fields: [
          {name: 'caption', type: 'string'}
        ]
      }
    ]
  })
  t.deepEqual(schema.getType('someImage'), {
    name: 'someImage',
    type: 'image',
    fields: [{name: 'caption', type: 'string', format: 'plain'}],
    fieldsets: [
      {
        single: true,
        field: {name: 'caption', type: 'string', format: 'plain'}
      }
    ],
    options: {}
  })
  t.end()
})

test('image types without fields', t => {
  const schema = Schema.compile({
    name: 'my-schema',
    types: [
      {
        name: 'someImage',
        type: 'image'
      }
    ]
  })
  t.deepEqual(schema.getType('someImage'), {
    name: 'someImage',
    type: 'image',
    fields: [],
    fieldsets: [],
    options: {}
  })
  t.end()
})
