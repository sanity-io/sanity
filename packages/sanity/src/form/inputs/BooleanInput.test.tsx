import userEvent from '@testing-library/user-event'
import {defineType} from '@sanity/types'
import React, {ComponentType} from 'react'
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

it('renders the boolean input field', async () => {
  const {result} = await renderBooleanInput({
    fieldDefinition: defs.booleanTest,
    render: (inputProps) => <BooleanInput {...inputProps} />,
  })

  const input = result.container.querySelector('input[id="booleanTest"]')
  expect(input).toBeDefined()
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).toBePartiallyChecked()
})

describe('Mouse accessibility', () => {
  it('emits onFocus when clicked', async () => {
    const {onFocus, result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })
    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.click(input!)
    expect(onFocus).toBeCalled()
  })

  it('emits onChange when clicked', async () => {
    const {onChange, result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.click(input!)
    expect(onChange).toBeCalled()
  })
})

describe('Keyboard accessibility', () => {
  it('emits onFocus when tabbing to input', async () => {
    const {onFocus, result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.tab({focusTrap: result.container})
    expect(input).toHaveFocus()
    expect(onFocus).toBeCalled()
  })

  it('emits onChange when pressing enter', async () => {
    const {onChange, result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    userEvent.tab({focusTrap: result.container})
    userEvent.keyboard('{space}')
    expect(onChange).toBeCalled()
  })

  it('emits onBlur when navigating away from field', async () => {
    const {onBlur, result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"]')
    userEvent.tab({focusTrap: result.container})
    userEvent.tab()
    expect(input).not.toHaveFocus()

    expect(onBlur).toBeCalled()
  })
})

describe('Layout options', () => {
  it('renders a switch (default)', async () => {
    const {result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"][data-ui="Switch"]')
    expect(input).toBeDefined()
  })

  it('renders a checkbox', async () => {
    const {result} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = result.container.querySelector('input[id="booleanTest"][data-ui="Checkbox"]')
    expect(input).toBeDefined()
  })
})

describe('readOnly property', () => {
  it('makes field read-only', async () => {
    const {onChange, result} = await renderBooleanInput({
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

  it('does not make field read-only with callback', async () => {
    const {onChange, result} = await renderBooleanInput({
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
  })

  it.skip('makes field read-only based on value in document', async () => {
    const {onChange, result} = await renderBooleanInput({
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
