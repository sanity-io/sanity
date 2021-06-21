const Schema = require('@sanity/schema').default
const inferFromSchema = require('../src/inferFromSchema')

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
      await expectNoError(type.validation, listOptions[0])
    })

    test('disallowed value', async () => {
      const type = inferFromSchema(schema).get('colorList')
      await expectError(
        type.validation,
        {value: '#ccc', title: 'Gray'},
        'Value did not match any allowed value'
      )
    })
  })
  describe('shared validation rule', () => {
    const fieldValidationInferReproSharedObject = {
      type: 'object',
      name: 'someObjectType',
      fields: [
        {name: 'first', type: 'string'},
        {name: 'second', type: 'string'},
      ],
    }
    const fieldValidationInferReproDoc = {
      name: 'fieldValidationInferReproDoc',
      type: 'document',
      title: 'FieldValidationRepro',
      fields: [
        {
          name: 'withValidation',
          type: 'someObjectType',
          title: 'Field of someObjectType with validation',
          description: 'First field should be required',
          validation: (Rule) =>
            Rule.fields({
              first: (fieldRule) => fieldRule.required(),
            }),
        },
        {
          name: 'withoutValidation',
          type: 'someObjectType',
          title: 'Field of someObjectType without validation',
          description: 'First field should not be required',
        },
      ],
    }

    const schema = Schema.compile({
      types: [fieldValidationInferReproSharedObject, fieldValidationInferReproDoc],
    })

    test('should not overwrite field validations for the same field in different types', () => {
      const type = inferFromSchema(schema).get('fieldValidationInferReproDoc')
      const fieldWithValidation = type.fields.find((field) => field.name === 'withValidation')
      const fieldWithoutValidation = type.fields.find((field) => field.name === 'withoutValidation')

      expect(fieldWithValidation.type.fields[0].type.validation).not.toEqual([])
      expect(fieldWithoutValidation.type.fields[0].type.validation).toEqual([])
    })
  })
})

async function expectNoError(validations, value) {
  const errors = (await Promise.all(validations.map((rule) => rule.validate(value)))).flat()
  if (errors.length === 0) {
    // This shouldn't actually be needed, but counts against an assertion in jest-terms
    expect(errors).toHaveLength(0)
    return
  }

  const messages = errors.map((err) => err.item && err.item.message).join('\n\n- ')
  throw new Error(`Expected no errors, but found ${errors.length}:\n- ${messages}`)
}

async function expectError(validations, value, message, level = 'error') {
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
