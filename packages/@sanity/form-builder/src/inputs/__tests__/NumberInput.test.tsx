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
      fields: [{name: 'num', title: 'Number', type: 'number'}],
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
  num: 0,
  title: 'Hello world',
}

function renderInput(testId: string) {
  return inputTester(dummyDocument, documentType, schema, testId)
}

describe('number-input', () => {
  it('renders the number input field', () => {
    const {inputContainer} = renderInput('input-num')
    const input = inputContainer.querySelector('input')

    expect(input).toBeDefined()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('accepts decimals by default', () => {
    const {inputContainer} = renderInput('input-num')
    const input = inputContainer.querySelector('input')

    input.value = '1.2'
    expect(input.value).toBe('1.2')
    expect(input.checkValidity()).toBe(true)
  })
})
