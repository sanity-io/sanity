import userEvent from '@testing-library/user-event'
import {defineType} from '@sanity/types'
import React from 'react'
import {renderBooleanInput} from '../../../test/form/renderBooleanInput'
import {BooleanInput} from './BooleanInput'

const defs = {
  booleanTest: defineType({
    name: 'booleanTest',
    title: 'Switch',
    type: 'boolean',
  }),

  booleanReadOnly: defineType({
    name: 'booleanReadOnly',
    title: 'Read-only',
    type: 'boolean',
    readOnly: true,
  }),

  readOnlyCallback: defineType({
    name: 'readOnlyCallback',
    title: 'Boolean with callback',
    type: 'boolean',
    readOnly: () => false,
  }),

  readOnlyWithDocument: defineType({
    name: 'readOnlyWithDocument',
    title: 'Boolean read-only with document',
    type: 'boolean',
    readOnly: (context) => context.document?.title === 'Hello world',
  }),

  booleanHidden: {
    name: 'booleanHidden',
    title: 'Hidden',
    type: 'boolean',
    hidden: true,
  },

  hiddenCallback: {
    name: 'hiddenCallback',
    title: 'Boolean with callback',
    type: 'boolean',
    hidden: () => false,
  },

  hiddenWithDocument: {
    name: 'hiddenWithDocument',
    title: 'Boolean hidden with document',
    type: 'boolean',
    hidden: ({document}: any) => document.title === 'Hello world',
  },
}

it('renders the boolean input field', () => {
  const {result} = renderBooleanInput({
    fieldDefinition: defs.booleanTest,
    render: (inputProps) => <BooleanInput {...inputProps} />,
  })

  const input = result.container.querySelector('input[id="booleanTest"]')
  expect(input).toBeDefined()
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).toBePartiallyChecked()
})

describe('Mouse accessibility', () => {
  it('emits onFocus when clicked', () => {
    const {onFocus, result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })
    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.click(input!)
    expect(onFocus).toBeCalled()
    expect(onFocus.mock.calls).toMatchSnapshot()
  })

  it('emits onChange when clicked', () => {
    const {onChange, result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.click(input!)
    expect(onChange).toBeCalled()
    expect(onChange.mock.calls).toMatchSnapshot()
  })
})

describe('Keyboard accessibility', () => {
  it('emits onFocus when tabbing to input', () => {
    const {onFocus, result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.tab({focusTrap: result.container})
    expect(input).toHaveFocus()
    expect(onFocus).toBeCalled()
    expect(onFocus.mock.calls).toMatchSnapshot()
  })

  it('emits onChange when pressing enter', () => {
    const {onChange, result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    userEvent.tab({focusTrap: result.container})
    userEvent.keyboard('{space}')
    expect(onChange).toBeCalled()
    expect(onChange.mock.calls).toMatchSnapshot()
  })

  it('emits onBlur when navigating away from field', () => {
    const {onBlur, result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.tab({focusTrap: result.container})
    userEvent.tab()
    expect(input).not.toHaveFocus()

    expect(onBlur).toBeCalled()
    expect(onBlur.mock.calls).toMatchSnapshot()
  })
})

describe('Layout options', () => {
  it('renders a switch (default)', () => {
    const {result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"][data-ui="Switch"]')
    expect(input).toBeDefined()
  })

  it('renders a checkbox', () => {
    const {result} = renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"][data-ui="Checkbox"]')
    expect(input).toBeDefined()
  })
})

describe('readOnly property', () => {
  it('makes field read-only', () => {
    const {onChange, result} = renderBooleanInput({
      fieldDefinition: defs.booleanReadOnly,
      render: (inputProps) => <BooleanInput {...inputProps} readOnly />,
    })

    const input = result.container.querySelector('input[id="booleanReadOnly"]')
    expect(input).toBeDisabled()

    // Mouse event
    userEvent.click(input!)
    // expect(input).toHaveFocus()
    expect(onChange).not.toBeCalled()

    // Keyboard event
    userEvent.tab({focusTrap: result.container})
    expect(input).not.toHaveFocus()
  })

  it('does not make field read-only with callback', () => {
    const {onChange, result} = renderBooleanInput({
      fieldDefinition: defs.readOnlyCallback,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="readOnlyCallback"]')
    expect(input).not.toBeDisabled()

    // Mouse event
    userEvent.click(input!)
    expect(onChange).toBeCalled()

    // Keyboard event
    userEvent.tab({shift: true})
    userEvent.tab({focusTrap: result.container})
    userEvent.keyboard('{space}')
    expect(onChange).toBeCalled()
    expect(onChange.mock.calls).toMatchSnapshot()
  })

  it.skip('makes field read-only based on value in document', () => {
    const {onChange, result} = renderBooleanInput({
      fieldDefinition: defs.readOnlyWithDocument,
      props: {documentValue: {title: 'Hello, world'}},
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="readOnlyWithDocument"]')
    expect(input).toBeDisabled()

    // Mouse event
    userEvent.click(input!)
    expect(onChange).not.toBeCalled()

    // Keyboard event
    userEvent.tab({focusTrap: result.container})
    expect(input).not.toHaveFocus()
  })
})

describe('hidden property', () => {
  it('hides field', () => {
    expect(() =>
      renderBooleanInput({
        fieldDefinition: defs.booleanHidden,
        render: (inputProps) => <BooleanInput {...inputProps} />,
      })
    ).toThrow('no field member: booleanHidden')
  })

  it('does not hide field with callback', () => {
    const {result} = renderBooleanInput({
      fieldDefinition: defs.hiddenCallback,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })
    const input = result.container.querySelector('input[id="hiddenCallback"]')

    expect(input).toBeDefined()
  })

  it.skip('hides field based on value in document', () => {
    expect(() =>
      renderBooleanInput({
        fieldDefinition: defs.hiddenWithDocument,
        props: {documentValue: {title: 'Hello, world'}},
        render: (inputProps) => <BooleanInput {...inputProps} />,
      })
    ).toThrow('no field member: hiddenWithDocument')
  })
})
