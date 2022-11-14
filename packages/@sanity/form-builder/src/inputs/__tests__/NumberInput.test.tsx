// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import Schema from '@sanity/schema'
import {inputTester} from '../../utils/tests/FormBuilderTester'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'book',
      type: 'document',
      fields: [
        {
          name: 'defaultNumber',
          title: 'Integer',
          type: 'number',
        },
        {
          name: 'positiveNumber',
          title: 'A positive number',
          type: 'number',
          validation: [{_rules: [{flag: 'min', constraint: 0}]}],
        },
        {
          name: 'positiveInteger',
          title: 'Integer',
          type: 'number',
          validation: [{_rules: [{flag: 'min', constraint: 0}, {flag: 'integer'}]}],
        },
        {
          // should be handled the same way as an integer
          name: 'positiveZeroPrecisionNumber',
          title: 'Integer',
          type: 'number',
          validation: [
            {
              _rules: [
                {flag: 'min', constraint: 0},
                {flag: 'precision', constraint: 0},
              ],
            },
          ],
        },
      ],
    },
  ],
})
const documentType = schema.get('book')
const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'numberFieldTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  num: 1,
  title: 'Hello world',
}

function renderInput(testId: string) {
  return inputTester(dummyDocument, documentType, schema, testId)
}

describe('number-input', () => {
  it('renders the number input field', () => {
    const {inputContainer} = renderInput('input-defaultNumber')
    const input = inputContainer.querySelector('input')

    expect(input).toBeDefined()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('accepts decimals by default', () => {
    const {inputContainer} = renderInput('input-defaultNumber')
    const input = inputContainer.querySelector('input')

    input.value = '1.2'
    expect(input.valueAsNumber).toBe(1.2)
    expect(input.checkValidity()).toBe(true)
  })

  it('renders inputMode equals text if there is no min rule', () => {
    // Note: we want "text" because devices may or may not show a minus key.
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode#values
    const {inputContainer} = renderInput('input-defaultNumber')
    const input = inputContainer.querySelector('input')

    expect(input.inputMode).toBe('text')
  })

  it('renders inputMode equals "decimal" if there is a min rule', () => {
    const {inputContainer} = renderInput('input-positiveNumber')
    const input = inputContainer.querySelector('input')

    expect(input.inputMode).toBe('decimal')
  })

  it('renders inputMode equals "numeric" if there is a min rule and integer rule', () => {
    const {inputContainer} = renderInput('input-positiveInteger')
    const input = inputContainer.querySelector('input')

    expect(input.inputMode).toBe('numeric')
  })

  it('renders inputMode equals "numeric" if there is a min rule and zero precision rule', () => {
    const {inputContainer} = renderInput('input-positiveZeroPrecisionNumber')
    const input = inputContainer.querySelector('input')

    expect(input.inputMode).toBe('numeric')
  })
})
