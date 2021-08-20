import Schema from '@sanity/schema'
import {ObjectSchemaType, Rule} from '@sanity/types'
import inferFromSchema from '../src/inferFromSchema'

describe('schema validation inference', () => {
  describe('object with `options.list` and `value` field', () => {
    const listOptions = [
      {value: '#f00', title: 'Red'},
      {value: '#0f0', title: 'Green'},
      {value: '#00f', title: 'Blue'},
    ]

    const schema = Schema.compile({
      types: [
        {
          name: 'colorList',
          type: 'object',
          fields: [
            {name: 'value', type: 'string'},
            {name: 'title', type: 'string'},
          ],
          options: {
            list: listOptions,
          },
        },
      ],
    })

    test('allowed value', async () => {
      const type = inferFromSchema(schema).get('colorList')
      await expectNoError(type.validation as Rule[], listOptions[0])
    })

    test('disallowed value', async () => {
      const type = inferFromSchema(schema).get('colorList')
      await expectError(
        type.validation as Rule[],
        {value: '#ccc', title: 'Gray'},
        'Value did not match any allowed value'
      )
    })
  })
  describe('field validations', () => {
    const fieldValidationInferReproDoc = {
      name: 'fieldValidationInferReproDoc',
      type: 'document',
      title: 'FieldValidationRepro',
      // eslint-disable-next-line no-shadow
      validation: (Rule: Rule) =>
        Rule.fields({
          stringField: (fieldRule) => fieldRule.required(),
        }),

      fields: [
        {
          name: 'stringField',
          type: 'string',
          title: 'Field of someObjectType with validation',
          description: 'First field should be required',
        },
      ],
    }

    const schema = Schema.compile({
      types: [fieldValidationInferReproDoc],
    })

    test('field validations defined on an object type does not affect the field type validation', () => {
      const documentType = inferFromSchema(schema).get(
        'fieldValidationInferReproDoc'
      ) as ObjectSchemaType
      const fieldWithoutValidation = documentType.fields.find(
        (field) => field.name === 'stringField'
      )

      // The first field should only have the validation rules that comes with its type
      expect(
        (fieldWithoutValidation?.type.validation as Rule[]).flatMap(
          // eslint-disable-next-line dot-notation
          (validation) => validation['_rules']
        )
      ).toEqual([{flag: 'type', constraint: 'String'}])
    })
  })
})

async function expectNoError(validations: Rule[], value: unknown) {
  const errors = (await Promise.all(validations.map((rule) => rule.validate(value)))).flat()
  if (errors.length === 0) {
    // This shouldn't actually be needed, but counts against an assertion in jest-terms
    expect(errors).toHaveLength(0)
    return
  }

  const messages = errors.map((err) => err.item && err.item.message).join('\n\n- ')
  throw new Error(`Expected no errors, but found ${errors.length}:\n- ${messages}`)
}

async function expectError(
  validations: Rule[],
  value: unknown,
  message: string | undefined,
  level = 'error'
) {
  const errors = (await Promise.all(validations.map((rule) => rule.validate(value)))).flat()
  if (!errors.length) {
    throw new Error(`Expected error matching "${message}", but no errors were returned.`)
  }

  const matches = errors.filter((err) => err.item && err.item.message.includes(message))
  if (matches.length === 0) {
    const messages = errors.map((err) => err.item && err.item.message).join('\n\n- ')
    throw new Error(`Expected error matching "${message}" not found. Errors found:\n- ${messages}`)
  }

  const levelMatch = matches.find((err) => err.level === level)
  if (!levelMatch) {
    throw new Error(`Expected error to have level "${level}", got ${matches[0].level}`)
  }

  // This shouldn't actually be needed, but counts against an assertion in jest-terms
  expect(levelMatch.item.message).toMatch(message)
}
