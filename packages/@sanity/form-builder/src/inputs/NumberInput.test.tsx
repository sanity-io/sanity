// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {renderForm} from '../../test/renderForm'

// This mock is needed to prevent the "not wrapped in act()" error from React testing library.
// The reason is that the `useCurrentUser` is used by `ObjectInput` to figure out which fields are
// hidden, and using this hook causes the `ObjectInput` to render again once the user is loaded.
//
// NOTE!
// We can remove this mock when `ObjectInput` no longer uses `useCurrentUser`.
jest.mock('@sanity/base/hooks', () => {
  const hooks = jest.requireActual('@sanity/base/hooks')

  return {
    ...hooks,
    useCurrentUser: jest.fn().mockImplementation(() => ({
      value: {},
      error: null,
      isLoading: false,
    })),
  }
})

const numberFieldTestType = {
  name: 'numberFieldTest',
  type: 'document',
  fields: [{name: 'num', title: 'Number', type: 'number'}],
}

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'numberFieldTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  num: 0,
  title: 'Hello world',
}

describe('number-input', () => {
  it('renders the number input field', () => {
    const {result} = renderForm({type: numberFieldTestType, value: dummyDocument})
    const field = result.queryByTestId('input-num')
    if (!field) {
      throw new Error('No field with test id "input-num" found')
    }

    const input = field.querySelector('input')
    expect(input).toBeDefined()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('accepts decimals by default', () => {
    const {result} = renderForm({type: numberFieldTestType, value: dummyDocument})
    const field = result.queryByTestId('input-num')
    if (!field) {
      throw new Error('No field with test id "input-num" found')
    }

    const input = field.querySelector('input')
    if (!input) {
      throw new Error('No input found')
    }

    input.value = '1.2'
    expect(input.value).toBe('1.2')
    expect(input.checkValidity()).toBe(true)
  })
})
