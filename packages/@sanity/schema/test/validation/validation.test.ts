import {flatten} from 'lodash'
import {validateSchema} from '../../src/sanity/validateSchema'

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

    const validation = validateSchema(schemaDef)

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

  test('validate block members as object like', () => {
    const schemaDef = [
      {
        title: 'Valid object',
        name: 'validObject',
        type: 'object',
        fields: [
          {
            title: 'Blocks',
            name: 'blocks',
            type: 'array',
            of: [{type: 'block', of: [{type: 'image', name: 'myImage'}]}],
          },
        ],
      },
      {
        title: 'Invalid object',
        name: 'invalidObject',
        type: 'object',
        fields: [
          {
            title: 'Blocks',
            name: 'blocks',
            type: 'array',
            of: [
              {
                type: 'block',
                of: [
                  // Should produce error
                  {type: 'string', name: 'foo'},
                  // Should produce warning
                  {type: 'object', name: 'validObject', fields: [{type: 'string', name: 'foo'}]},
                  // Should be allowed
                  {type: 'image', name: 'image'},
                  // Should be allowed
                  {type: 'reference', name: 'reference', to: {type: 'author'}},
                  // Should produce warning
                  {type: 'object', name: 'reference', fields: [{type: 'string', name: 'foo'}]},
                  // Should produce warning
                  {type: 'object', name: 'image', fields: [{type: 'string', name: 'foo'}]},
                  // Should produce warning
                  {type: 'object', name: 'file', fields: [{type: 'string', name: 'foo'}]},
                  // Should produce warning
                  {type: 'object', name: 'span', fields: [{type: 'string', name: 'foo'}]},
                  // Should not be allowed
                  {type: 'span', name: 'something', fields: [{type: 'string', name: 'foo'}]},
                  // Should be allowed
                  {type: 'reference', name: 'reference', to: {type: 'author'}},
                ],
              },
            ],
          },
        ],
      },
    ]

    const validation = validateSchema(schemaDef)

    const validObjectResult = validation.get('validObject')
    expect(validObjectResult._problems).toHaveLength(0)

    const invalidObjectResult = validation.get('invalidObject')
    const problems = flatten(
      invalidObjectResult.fields[0].of[0].of.map((item) => item._problems),
    ).filter(Boolean)
    expect(problems).toHaveLength(7)
    expect(problems[0]).toMatchObject({
      severity: 'error',
      helpId: 'schema-array-of-type-builtin-type-conflict',
    })
    expect(problems[1]).toMatchObject({
      severity: 'warning',
      helpId: 'schema-array-of-type-global-type-conflict',
    })
    expect(problems[2]).toMatchObject({
      severity: 'warning',
      helpId: 'schema-array-of-type-global-type-conflict',
    })
    expect(problems[3]).toMatchObject({
      severity: 'warning',
      helpId: 'schema-array-of-type-global-type-conflict',
    })
    expect(problems[4]).toMatchObject({
      severity: 'warning',
      helpId: 'schema-array-of-type-global-type-conflict',
    })
    expect(problems[5]).toMatchObject({
      severity: 'warning',
      helpId: 'schema-array-of-type-global-type-conflict',
    })
    expect(problems[6]).toMatchObject({
      severity: 'error',
      helpId: 'schema-array-of-type-builtin-type-conflict',
    })
  })
})
