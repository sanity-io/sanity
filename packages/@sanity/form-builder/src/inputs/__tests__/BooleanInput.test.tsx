// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import Schema from '@sanity/schema'
import userEvent from '@testing-library/user-event'
import {inputTester} from '../../utils/tests/FormBuilderTester'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'book',
      type: 'document',
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
    },
  ],
})
const documentType = schema.get('book')
const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'booleanFieldTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  booleanTest: undefined,
  title: 'Hello world',
}

function renderInput(testId: string) {
  return inputTester(dummyDocument, documentType, schema, testId)
}

it('renders the boolean input field', () => {
  const {inputContainer} = renderInput('input-booleanTest')
  const input = inputContainer.querySelector('input')
  expect(input).toBeDefined()
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).toBePartiallyChecked()
})

describe('Mouse accessibility', () => {
  it('emits onFocus when clicked', () => {
    const {inputContainer, onFocus} = renderInput('input-booleanTest')
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
    const {inputContainer, onChange} = renderInput('input-booleanTest')
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
  // Looks like a bug in Sanity UI that the input doesn't get an updated checked property
  // uncomment when this is fixed
  // it('updates value when input is clicked', () => {
  //   const {inputContainer} = renderInput('input-booleanTest')
  //   const input = inputContainer.querySelector('input')
  //   userEvent.click(input)
  //   expect(input).toBeChecked()
  //   userEvent.click(input)
  //   expect(input).not.toBeChecked()
  // })
})

describe('Keyboard accessibility', () => {
  it('emits onFocus when navigating to field', () => {
    const {inputContainer, onFocus} = renderInput('input-booleanTest')
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
    const {inputContainer, onChange} = renderInput('input-booleanTest')
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
  // Looks like a bug in Sanity UI that the input doesn't get an updated checked property
  // uncomment when this is fixed
  // it('updates value when space is pressed', () => {
  //   const {inputContainer} = renderInput('input-booleanTest')
  //   const input = inputContainer.querySelector('input')
  //   userEvent.tab({focusTrap: inputContainer})
  //   userEvent.keyboard('{space}')
  //   expect(input).toBeChecked()
  //   userEvent.keyboard('{space}')
  //   expect(input).not.toBeChecked()
  // })

  it('emits onBlur when navigating away from field', () => {
    const {inputContainer} = renderInput('input-booleanTest')
    const input = inputContainer.querySelector('input')
    userEvent.tab({focusTrap: inputContainer})
    userEvent.tab()
    expect(input).not.toHaveFocus()
  })
})

describe('Layout options', () => {
  it('renders a switch (default)', () => {
    const {inputContainer} = renderInput('input-booleanTest')
    const layout = inputContainer.querySelector(`[data-ui="Switch"]`)
    expect(layout).toBeDefined()
  })

  it('renders a checkbox', () => {
    const {inputContainer} = renderInput('input-booleanCheckbox')
    const layout = inputContainer.querySelector(`[data-ui="Checkbox"]`)
    expect(layout).toBeDefined()
  })
})

describe('readOnly property', () => {
  it('makes field read-only', () => {
    const {inputContainer, onChange} = renderInput('input-booleanReadOnly')
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
    const {inputContainer, onChange} = renderInput('input-readOnlyCallback')
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
    const {inputContainer, onChange} = renderInput('input-readOnlyWithDocument')
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
    const {inputContainer} = renderInput('input-booleanHidden')
    expect(inputContainer).toBeNull()
  })

  it('does not hide field with callback', () => {
    const {inputContainer} = renderInput('input-hiddenCallback')
    expect(inputContainer).toBeDefined()
  })

  it('hides field based on value in document', () => {
    const {inputContainer} = renderInput('input-hiddenWithDocument')
    expect(inputContainer).toBeNull()
  })
})

// describe('initial value', () => {
//   it('has correct initial value (true)', () => {
//     const {inputContainer} = renderInput('input-booleanInitialValue')
//     const input = inputContainer.querySelector('input')
//     expect(input).toBeChecked()
//   })
// })
