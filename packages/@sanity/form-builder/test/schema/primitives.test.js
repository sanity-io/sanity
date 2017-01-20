import {test} from 'tap'
import {Schema} from '../../src'

test('strings with default options', t => {
  const schema = Schema.compile({
    name: 'my-schema',
    types: [
      {name: 'foo', type: 'string'}
    ]
  })
  t.deepEqual(schema.getType('foo'), {name: 'foo', type: 'string', format: 'plain'})
  t.end()
})

test('objects with default options', t => {
  const schema = Schema.compile({
    name: 'my-schema',
    types: [
      {
        name: 'foo',
        type: 'object',
        fields: [
          {name: 'garfield', type: 'string'}
        ]
      }
    ]
  })
  t.deepEqual(schema.getType('foo'), {
    name: 'foo',
    type: 'object',
    fields: [{name: 'garfield', type: 'string', format: 'plain'}],
    fieldsets: [
      {
        single: true,
        field: {name: 'garfield', type: 'string', format: 'plain'}
      }
    ],
    options: {}
  })
  t.end()
})
