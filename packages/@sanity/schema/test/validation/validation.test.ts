/* eslint-disable max-nested-callbacks */
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

  describe('array with multiple primitive types of the same JSON type', () => {
    test('warns when array contains both string and text types', () => {
      const schemaDef = [
        {
          type: 'array',
          name: 'contentArray',
          of: [
            {type: 'string', name: 'heading'},
            {type: 'text', name: 'paragraph'},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const contentArray = validation.get('contentArray')

      const warnings = contentArray._problems.filter((p: any) => p.severity === 'warning')
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]).toMatchObject({
        severity: 'warning',
        helpId: 'schema-array-of-duplicate-primitive-json-type',
      })
      expect(warnings[0].message).toContain('JSON type "string"')
      expect(warnings[0].message).toContain('no way to distinguish between them')
    })

    test('warns when array contains multiple string-based types', () => {
      const schemaDef = [
        {
          type: 'array',
          name: 'multiStringArray',
          of: [
            {type: 'string', name: 'title'},
            {type: 'text', name: 'body'},
            {type: 'url', name: 'link'},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const multiStringArray = validation.get('multiStringArray')

      const warnings = multiStringArray._problems.filter((p: any) => p.severity === 'warning')
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]).toMatchObject({
        helpId: 'schema-array-of-duplicate-primitive-json-type',
      })
    })

    test('allows array with a single primitive type', () => {
      const schemaDef = [
        {
          type: 'array',
          name: 'singleStringArray',
          of: [{type: 'string'}],
        },
      ]

      const validation = validateSchema(schemaDef)
      const singleStringArray = validation.get('singleStringArray')

      const errors = singleStringArray._problems.filter((p: any) => p.severity === 'error')
      expect(errors).toHaveLength(0)
    })

    test('allows array with different primitive JSON types', () => {
      const schemaDef = [
        {
          type: 'array',
          name: 'mixedPrimitivesArray',
          of: [
            {type: 'string', name: 'text'},
            {type: 'number', name: 'count'},
            {type: 'boolean', name: 'flag'},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const mixedPrimitivesArray = validation.get('mixedPrimitivesArray')

      // Should have errors because mixing primitives and objects is also not allowed,
      // but no duplicate JSON type errors
      const duplicateJsonTypeErrors = mixedPrimitivesArray._problems.filter(
        (p: any) => p.helpId === 'schema-array-of-duplicate-primitive-json-type',
      )
      expect(duplicateJsonTypeErrors).toHaveLength(0)
    })

    test('warns when array contains email and string types (both resolve to JSON string)', () => {
      // Tests that date-like and text-like built-in types that resolve to JSON string are detected
      const schemaDef = [
        {
          type: 'array',
          name: 'stringVariantsArray',
          of: [
            {type: 'string', name: 'title'},
            {type: 'email', name: 'contactEmail'},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const stringVariantsArray = validation.get('stringVariantsArray')

      const warnings = stringVariantsArray._problems.filter(
        (p: any) => p.helpId === 'schema-array-of-duplicate-primitive-json-type',
      )
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0].severity).toBe('warning')
      expect(warnings[0].message).toContain('JSON type "string"')
    })
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

  describe('field type is a document type', () => {
    test('warns when a field type references a document type', () => {
      const schemaDef = [
        {
          name: 'person',
          type: 'document',
          fields: [{name: 'name', type: 'string'}],
        },
        {
          name: 'myObject',
          type: 'object',
          fields: [{name: 'author', type: 'person'}],
        },
      ]

      const validation = validateSchema(schemaDef)
      const myObject = validation.get('myObject')
      const authorField = myObject.fields[0]

      const warnings = authorField._problems.filter(
        (p: any) => p.helpId === 'schema-field-type-is-document',
      )
      expect(warnings).toHaveLength(1)
      expect(warnings[0].message).toContain('person')
    })

    test('warns when a nested field type references a document type', () => {
      const schemaDef = [
        {
          name: 'person',
          type: 'document',
          fields: [{name: 'name', type: 'string'}],
        },
        {
          name: 'otherType',
          type: 'document',
          fields: [
            {
              name: 'author',
              type: 'person',
            },
            {
              name: 'hero',
              type: 'object',
              fields: [
                {
                  name: 'legend',
                  type: 'person',
                },
              ],
            },
            {
              name: 'people',
              type: 'array',
              of: [
                {
                  name: 'person',
                  type: 'person',
                },
                {
                  name: 'objectPerson',
                  type: 'object',
                  fields: [
                    {
                      name: 'person',
                      type: 'person',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const otherTypeValidation = validation.get('otherType')

      expect(otherTypeValidation._problems).toHaveLength(0)

      const authorField = otherTypeValidation.fields[0]
      expect(authorField._problems).toHaveLength(1)
      expect(authorField._problems[0]).toHaveProperty('helpId', 'schema-field-type-is-document')

      const objectField = otherTypeValidation.fields.find((f: any) => f.name === 'hero')
      expect(objectField._problems).toHaveLength(0)
      expect(objectField.fields[0]._problems).toHaveLength(1)
      expect(objectField.fields[0]._problems[0]).toHaveProperty(
        'helpId',
        'schema-field-type-is-document',
      )

      const arrayField = otherTypeValidation.fields.find((f: any) => f.name === 'people')
      expect(arrayField._problems).toHaveLength(0)
      expect(arrayField.of[0]._problems).toHaveLength(1)
      expect(arrayField.of[0]._problems[0]).toHaveProperty(
        'helpId',
        'schema-field-type-is-document',
      )

      const arrayObjectField = arrayField.of[1].fields[0]
      expect(arrayObjectField._problems).toHaveLength(1)
      expect(arrayObjectField._problems[0]).toHaveProperty(
        'helpId',
        'schema-field-type-is-document',
      )
    })

    test('does not warn for object field types', () => {
      const schemaDef = [
        {
          name: 'address',
          type: 'object',
          fields: [{name: 'street', type: 'string'}],
        },
        {
          name: 'myDocument',
          type: 'document',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'address', type: 'address'},
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const myDocument = validation.get('myDocument')

      for (const field of myDocument.fields) {
        const warnings = field._problems.filter(
          (p: any) => p.helpId === 'schema-field-type-is-document',
        )
        expect(warnings).toHaveLength(0)
      }
    })
  })

  describe('block annotations with custom types', () => {
    test('accepts custom object type used directly as annotation', () => {
      // This is the pattern that was broken in issue #3782
      // https://github.com/sanity-io/sanity/issues/3782
      const schemaDef = [
        {
          name: 'ctaAnnotation',
          type: 'object',
          title: 'CTA',
          fields: [
            {name: 'url', type: 'url'},
            {name: 'label', type: 'string'},
          ],
        },
        {
          name: 'testDocument',
          type: 'document',
          fields: [
            {
              name: 'body',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        type: 'ctaAnnotation',
                        name: 'cta',
                        title: 'CTA Link',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const testDocument = validation.get('testDocument')

      // Check document has no errors
      expect(testDocument._problems).toHaveLength(0)

      // Check the block field has no errors
      const bodyField = testDocument.fields.find((f: any) => f.name === 'body')
      expect(bodyField._problems).toHaveLength(0)

      // Check the block type has no errors
      const blockType = bodyField.of[0]
      expect(blockType._problems).toHaveLength(0)

      // Check the annotation has no errors
      const annotation = blockType.marks.annotations[0]
      expect(annotation._problems).toHaveLength(0)
    })

    test('accepts multiple custom object types as annotations', () => {
      const schemaDef = [
        {
          name: 'linkAnnotation',
          type: 'object',
          fields: [{name: 'href', type: 'url'}],
        },
        {
          name: 'tooltipAnnotation',
          type: 'object',
          fields: [{name: 'text', type: 'string'}],
        },
        {
          name: 'testDocument',
          type: 'document',
          fields: [
            {
              name: 'body',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {type: 'linkAnnotation', name: 'link', title: 'Link'},
                      {type: 'tooltipAnnotation', name: 'tooltip', title: 'Tooltip'},
                    ],
                  },
                },
              ],
            },
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const testDocument = validation.get('testDocument')
      const bodyField = testDocument.fields.find((f: any) => f.name === 'body')
      const blockType = bodyField.of[0]

      // Both annotations should have no errors
      expect(blockType.marks.annotations[0]._problems).toHaveLength(0)
      expect(blockType.marks.annotations[1]._problems).toHaveLength(0)
    })

    test('still accepts inline object annotations', () => {
      const schemaDef = [
        {
          name: 'testDocument',
          type: 'document',
          fields: [
            {
              name: 'body',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        type: 'object',
                        name: 'inlineLink',
                        title: 'Inline Link',
                        fields: [
                          {name: 'href', type: 'url'},
                          {name: 'blank', type: 'boolean'},
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const testDocument = validation.get('testDocument')
      const bodyField = testDocument.fields.find((f: any) => f.name === 'body')
      const blockType = bodyField.of[0]

      expect(blockType.marks.annotations[0]._problems).toHaveLength(0)
    })

    test('still rejects non-object types as annotations', () => {
      const schemaDef = [
        {
          name: 'stringType',
          type: 'string',
        },
        {
          name: 'testDocument',
          type: 'document',
          fields: [
            {
              name: 'body',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        type: 'stringType',
                        name: 'invalidAnnotation',
                        title: 'Invalid',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const testDocument = validation.get('testDocument')
      const bodyField = testDocument.fields.find((f: any) => f.name === 'body')
      const blockType = bodyField.of[0]
      const annotation = blockType.marks.annotations[0]

      // Should have an error because annotations must inherit from object
      const errors = annotation._problems.filter((p: any) => p.severity === 'error')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('annotation types must inherit from object')
    })

    test('accepts mixed custom and inline annotations', () => {
      const schemaDef = [
        {
          name: 'customLink',
          type: 'object',
          fields: [{name: 'url', type: 'url'}],
        },
        {
          name: 'testDocument',
          type: 'document',
          fields: [
            {
              name: 'body',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      // Custom type reference
                      {type: 'customLink', name: 'customLink', title: 'Custom Link'},
                      // Inline object definition
                      {
                        type: 'object',
                        name: 'inlineNote',
                        title: 'Note',
                        fields: [{name: 'text', type: 'text'}],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ]

      const validation = validateSchema(schemaDef)
      const testDocument = validation.get('testDocument')
      const bodyField = testDocument.fields.find((f: any) => f.name === 'body')
      const blockType = bodyField.of[0]

      // Both should work without errors
      expect(blockType.marks.annotations[0]._problems).toHaveLength(0)
      expect(blockType.marks.annotations[1]._problems).toHaveLength(0)
    })
  })
})
