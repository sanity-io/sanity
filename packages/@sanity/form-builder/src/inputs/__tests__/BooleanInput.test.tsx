import userEvent from '@testing-library/user-event'
import {renderForm} from '../../../test/renderForm'

const booleanTestsType = {
  type: 'document',
  name: 'booleanTests',
  fields: [
    {
      name: 'booleanTest',
      title: 'Switch',
      type: 'boolean',
    },
    {
      name: 'booleanCheckbox',
      title: 'Checkbox',
      type: 'boolean',
      options: {
        layout: 'checkbox',
      },
    },
    {
      name: 'booleanReadOnly',
      title: 'Read-only',
      type: 'boolean',
      readOnly: true,
    },
    {
      name: 'readOnlyCallback',
      title: 'Boolean with callback',
      type: 'boolean',
      readOnly: () => false,
    },
    {
      name: 'readOnlyWithDocument',
      title: 'Boolean read-only with document',
      type: 'boolean',
      readOnly: ({document}) => document.title === 'Hello world',
    },
    {
      name: 'booleanHidden',
      title: 'Hidden',
      type: 'boolean',
      hidden: true,
    },
    {
      name: 'hiddenCallback',
      title: 'Boolean with callback',
      type: 'boolean',
      hidden: () => false,
    },
    {
      name: 'hiddenWithDocument',
      title: 'Boolean hidden with document',
      type: 'boolean',
      hidden: ({document}) => document.title === 'Hello world',
    },
    {
      name: 'booleanInitialValue',
      title: 'Initial value',
      type: 'boolean',
      initialValue: true,
    },
  ],
}

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'booleanFieldTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  booleanTest: undefined,
  title: 'Hello world',
}

it('renders the boolean input field', () => {
  const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
  const input = result.queryByTestId('input-booleanTest').querySelector('input')
  expect(input).toBeDefined()
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).toBePartiallyChecked()
})

describe('Mouse accessibility', () => {
  it('emits onFocus when clicked', () => {
    const {onFocus, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanTest')
    userEvent.click(inputContainer)
    expect(onFocus).toBeCalled()
    expect(onFocus.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Array [
            "booleanTest",
          ],
        ],
      ]
    `)
  })

  it('emits onChange when clicked', () => {
    const {onChange, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanTest')
    userEvent.click(inputContainer.querySelector('input'))
    expect(onChange).toBeCalled()
    expect(onChange.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            Array [
              Object {
                "set": Object {
                  "booleanTest": true,
                },
              },
            ],
          ],
        ]
      `)
  })
})

describe('Keyboard accessibility', () => {
  it('emits onFocus when navigating to field', () => {
    const {onFocus, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanTest')
    const input = inputContainer.querySelector('input')
    userEvent.tab({focusTrap: inputContainer})
    expect(input).toHaveFocus()
    expect(onFocus).toBeCalled()
    expect(onFocus.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Array [
            "booleanTest",
          ],
        ],
      ]
    `)
  })

  it('emits onChange when pressing enter', () => {
    const {onChange, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanTest')
    userEvent.tab({focusTrap: inputContainer})
    userEvent.keyboard('{space}')
    expect(onChange).toBeCalled()
    expect(onChange.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            Array [
              Object {
                "set": Object {
                  "booleanTest": true,
                },
              },
            ],
          ],
        ]
      `)
  })

  it('emits onBlur when navigating away from field', () => {
    const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanTest')
    const input = inputContainer.querySelector('input')
    userEvent.tab({focusTrap: inputContainer})
    userEvent.tab()
    expect(input).not.toHaveFocus()
  })
})

describe('Layout options', () => {
  it('renders a switch (default)', () => {
    const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanTest')
    const layout = inputContainer.querySelector(`[data-ui="Switch"]`)
    expect(layout).toBeDefined()
  })

  it('renders a checkbox', () => {
    const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanCheckbox')
    const layout = inputContainer.querySelector(`[data-ui="Checkbox"]`)
    expect(layout).toBeDefined()
  })
})

describe('readOnly property', () => {
  it('makes field read-only', () => {
    const {onChange, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanReadOnly')
    const input = inputContainer.querySelector('input')
    expect(input).toBeDisabled()

    // Mouse event
    userEvent.click(input)
    expect(onChange).not.toBeCalled()
    input.blur()
    // Keyboard event
    userEvent.tab({focusTrap: inputContainer})
    expect(input).not.toHaveFocus()
  })

  it('does not make field read-only with callback', () => {
    const {onChange, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-readOnlyCallback')
    const input = inputContainer.querySelector('input')
    expect(input).not.toBeDisabled()

    // Mouse event
    userEvent.click(input)
    expect(onChange).toBeCalled()
    input.blur()
    // Keyboard event
    userEvent.tab({shift: true})
    userEvent.tab({focusTrap: inputContainer})
    userEvent.keyboard('{space}')
    expect(onChange).toBeCalled()

    expect(onChange.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Array [
            Object {
              "set": Object {
                "readOnlyCallback": true,
              },
            },
          ],
        ],
        Array [
          Array [
            Object {
              "set": Object {
                "readOnlyCallback": true,
              },
            },
          ],
        ],
      ]
    `)
  })

  it('makes field read-only based on value in document', () => {
    const {onChange, result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-readOnlyWithDocument')
    const input = inputContainer.querySelector('input')
    expect(input).toBeDisabled()

    // Mouse event
    userEvent.click(input)
    expect(onChange).not.toBeCalled()
    // Keyboard event
    userEvent.tab({focusTrap: inputContainer})
    expect(input).not.toHaveFocus()
  })
})

describe('hidden property', () => {
  it('hides field', () => {
    const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-booleanHidden')
    expect(inputContainer).toBeNull()
  })

  it('does not hide field with callback', () => {
    const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-hiddenCallback')
    expect(inputContainer).toBeDefined()
  })

  it('hides field based on value in document', () => {
    const {result} = renderForm({type: booleanTestsType, value: dummyDocument})
    const inputContainer = result.queryByTestId('input-hiddenWithDocument')
    expect(inputContainer).toBeNull()
  })
})
