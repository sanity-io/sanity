import traverseSchema from '../../src/core/traverseSchema'
import object from '../../src/sanity/validation/types/object'
import array from '../../src/sanity/validation/types/array'

const coreTypes = [
  {name: 'array', type: 'type'},
  {name: 'string', type: 'type'},
  {name: 'object', type: 'type'},
]
const schemaDef = [
  {
    type: 'array',
    name: 'myArray',
    of: [{type: 'string'}, {type: 'string'}],
  },
  {
    type: 'object',
    name: 'myObject',
    fields: [
      {type: 'string', name: {foo: 'bar'}},
      {type: 'string'},
      {name: 'objectWithoutFields', type: 'object'},
    ],
  },
]

const visitors = {
  array: {visit: array},
  object: {visit: object},
}
test('Validation test', () => {
  const validation = traverseSchema(schemaDef, coreTypes, (typeDef, visitorContext) => {
    const visitor = visitors[typeDef.type]
    return visitor ? visitor.visit(typeDef, visitorContext) : typeDef
  })

  const myArray = validation.get('myArray')
  expect(myArray._problems.length).toBeGreaterThan(0)
  const myObject = validation.get('myObject')
  expect(myObject.fields[0]._problems.length).toBeGreaterThan(0)
  expect(myObject.fields[2]._problems.length).toBeGreaterThan(0)
})
