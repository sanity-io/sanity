import {SquareIcon} from '@sanity/icons'
import {flatten} from 'lodash-es'
import {describe, expect, test} from 'vitest'

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
      invalidObjectResult.fields[0].of[0].of.map((item: {_problems: unknown[]}) => item._problems),
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

  test('accepts blocks with a style icon', () => {
    const schemaDef = [
      {
        name: 'testBlock',
        type: 'block',
        styles: [{icon: SquareIcon, title: 'Normal text', value: 'normal'}],
      },
    ]

    const validation = validateSchema(schemaDef).get('testBlock')
    const validationErrors = validation._problems.filter(
      (problem: any) => problem.severity === 'error',
    )
    expect(validationErrors).toHaveLength(0)
  })
  test('accepts blocks without a style icon', () => {
    const schemaDef = [
      {
        name: 'testBlock',
        type: 'block',
        styles: [{title: 'Normal text', value: 'normal'}],
      },
    ]

    const validation = validateSchema(schemaDef).get('testBlock')
    const validationErrors = validation._problems.filter(
      (problem: any) => problem.severity === 'error',
    )
    expect(validationErrors).toHaveLength(0)
  })

  describe('DOM property name validation', () => {
    test('warns when field name is a reserved DOM property (parentNode)', () => {
      const schemaDef = [
        {
          type: 'document',
          name: 'myDocument',
          fields: [
            {type: 'string', name: 'title'},
            {type: 'reference', name: 'parentNode', to: [{type: 'myDocument'}]},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const myDocument = validation.get('myDocument')
      const parentNodeField = myDocument.fields.find((f: any) => f.name === 'parentNode')

      expect(parentNodeField._problems).toHaveLength(1)
      expect(parentNodeField._problems[0]).toMatchObject({
        severity: 'warning',
        helpId: 'schema-field-name-reserved-dom-property',
      })
      expect(parentNodeField._problems[0].message).toContain('parentNode')
      expect(parentNodeField._problems[0].message).toContain('DOM API property')
    })

    test('warns when field name is a reserved DOM property (children)', () => {
      const schemaDef = [
        {
          type: 'object',
          name: 'myObject',
          fields: [{type: 'array', name: 'children', of: [{type: 'string'}]}],
        },
      ]

      const validation = validateSchema(schemaDef)
      const myObject = validation.get('myObject')
      const childrenField = myObject.fields.find((f: any) => f.name === 'children')

      expect(childrenField._problems).toHaveLength(1)
      expect(childrenField._problems[0]).toMatchObject({
        severity: 'warning',
        helpId: 'schema-field-name-reserved-dom-property',
      })
    })

    test('warns for various reserved DOM property names', () => {
      const schemaDef = [
        {
          type: 'object',
          name: 'testObject',
          fields: [
            {type: 'string', name: 'parentNode'},
            {type: 'string', name: 'childNodes'},
            {type: 'string', name: 'firstChild'},
            {type: 'string', name: 'lastChild'},
            {type: 'string', name: 'nextSibling'},
            {type: 'string', name: 'textContent'},
            {type: 'string', name: 'innerHTML'},
            {type: 'string', name: 'className'},
            {type: 'string', name: 'tagName'},
            {type: 'string', name: 'attributes'},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const testObject = validation.get('testObject')

      for (const field of testObject.fields) {
        expect(field._problems).toHaveLength(1)
        expect(field._problems[0]).toMatchObject({
          severity: 'warning',
          helpId: 'schema-field-name-reserved-dom-property',
        })
      }
    })

    test('does not warn for non-reserved field names', () => {
      const schemaDef = [
        {
          type: 'object',
          name: 'myObject',
          fields: [
            {type: 'string', name: 'title'},
            {type: 'string', name: 'description'},
            {type: 'reference', name: 'parent', to: [{type: 'myObject'}]},
            {type: 'array', name: 'items', of: [{type: 'string'}]},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const myObject = validation.get('myObject')

      for (const field of myObject.fields) {
        expect(field._problems).toHaveLength(0)
      }
    })
  })
})
