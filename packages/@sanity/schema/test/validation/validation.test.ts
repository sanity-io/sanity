import {traverseSchema} from '../../src/core/traverseSchema'
import {validateSchema} from '../../src/sanity/validateSchema'
import object from '../../src/sanity/validation/types/object'
import array from '../../src/sanity/validation/types/array'

describe('Validation test', () => {
  test('assigns/populates `_problems` property', () => {
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

    const coreTypes = [
      {name: 'array', type: 'type'},
      {name: 'string', type: 'type'},
      {name: 'object', type: 'type'},
    ]

    const visitors = {
      array: {visit: array},
      object: {visit: object},
    }

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

  test('validate standalone blocks', () => {
    const result = validateSchema([
      {
        title: 'Valid object',
        name: 'validObject',
        type: 'object',
        fields: [
          {
            title: 'Blocks',
            name: 'blocks',
            type: 'array',
            of: [{type: 'block'}],
          },
        ],
      },
      {
        title: 'Invalid object',
        name: 'invalidObject',
        type: 'object',
        fields: [
          {
            name: 'field1',
            title: 'Block 1',
            type: 'block',
          },
          {
            name: 'field2',
            title: 'Block 2',
            type: 'block',
          },
        ],
      },
    ])

    const validObjectResult = result.get('validObject')
    expect(validObjectResult._problems).toHaveLength(0)

    const invalidObjectResult = result.get('invalidObject')
    expect(invalidObjectResult._problems).toHaveLength(1)
    expect(invalidObjectResult._problems[0]).toMatchObject({
      severity: 'error',
      helpId: 'schema-standalone-block-type',
    })
  })
})
