import {defineField} from '@sanity/types'
import {screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {renderBooleanInput} from '../../../../test/form/renderBooleanInput'
import {BooleanInput} from './BooleanInput'

const defs = {
  booleanTest: defineField({
    name: 'booleanTest',
    title: 'Switch',
    type: 'boolean',
  }),

  booleanReadOnly: defineField({
    name: 'booleanReadOnly',
    title: 'Read-only',
    type: 'boolean',
    readOnly: true,
  }),

  readOnlyCallback: defineField({
    name: 'readOnlyCallback',
    title: 'Boolean with callback',
    type: 'boolean',
    readOnly: () => false,
  }),

  readOnlyWithDocument: defineField({
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
  await renderBooleanInput({
    fieldDefinition: defs.booleanTest,
    render: (inputProps) => <BooleanInput {...inputProps} />,
  })

  const input = screen.getByRole('checkbox')
  expect(input).toBeDefined()
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).toBePartiallyChecked()
})

describe('Mouse accessibility', () => {
  it('emits onFocus when clicked', async () => {
    const {onFocus} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })
    const input = screen.getByRole('checkbox')
    await userEvent.click(input)
    expect(onFocus).toBeCalled()
  })

  it('emits onChange when clicked', async () => {
    const {onChange} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    await userEvent.click(input)
    expect(onChange).toBeCalled()
  })
})

describe('Keyboard accessibility', () => {
  it('emits onFocus when tabbing to input', async () => {
    const {onFocus} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    await userEvent.tab()
    expect(input).toHaveFocus()
    expect(onFocus).toBeCalled()
  })

  it('emits onChange when pressing enter', async () => {
    const {onChange} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    await userEvent.click(input)
    await waitFor(() => {
      expect(onChange).toBeCalled()
    })
  })

  it('emits onBlur when navigating away from field', async () => {
    const {onBlur} = await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    await userEvent.tab()
    await userEvent.tab()
    expect(input).not.toHaveFocus()

    expect(onBlur).toBeCalled()
  })
})

describe('Layout options', () => {
  it('renders a switch (default)', async () => {
    await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    expect(input).toHaveAttribute('data-ui', 'Switch')
  })

  it('renders a checkbox', async () => {
    await renderBooleanInput({
      fieldDefinition: defs.booleanTest,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    expect(input).toHaveAttribute('data-ui', 'Checkbox')
  })
})

describe('readOnly property', () => {
  it('makes field read-only', async () => {
    const {onChange} = await renderBooleanInput({
      fieldDefinition: defs.booleanReadOnly,
      render: (inputProps) => <BooleanInput {...inputProps} readOnly />,
    })

    const input = screen.getByRole('checkbox')
    expect(input).toBeDisabled()

    // Mouse event
    await userEvent.click(input)
    // expect(input).toHaveFocus()
    expect(onChange).not.toBeCalled()

    // Keyboard event
    await userEvent.tab()
    expect(input).not.toHaveFocus()
  })

  it('renders a tooltip on the switch', async () => {
    await renderBooleanInput({
      fieldDefinition: defs.booleanReadOnly,
      render: (inputProps) => <BooleanInput {...inputProps} readOnly />,
    })

    const input = screen.getByRole('checkbox')
    await userEvent.hover(input)

    await screen.findByText('Disabled')
  })

  it('does not make field read-only with callback', async () => {
    const {onChange} = await renderBooleanInput({
      fieldDefinition: defs.readOnlyCallback,
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    expect(input).not.toBeDisabled()

    // Mouse event
    await userEvent.click(input)
    expect(onChange).toBeCalled()

    // Keyboard event
    await userEvent.tab({shift: true})
    await userEvent.tab()
    await userEvent.keyboard('{space}')
    expect(onChange).toBeCalled()
  })

  it.skip('makes field read-only based on value in document', async () => {
    const {onChange} = await renderBooleanInput({
      fieldDefinition: defs.readOnlyWithDocument,
      props: {documentValue: {title: 'Hello, world'}},
      render: (inputProps) => <BooleanInput {...inputProps} />,
    })

    const input = screen.getByRole('checkbox')
    expect(input).toBeDisabled()

    // Mouse event
    await userEvent.click(input)
    expect(onChange).not.toBeCalled()

    // Keyboard event
    await userEvent.tab()
    expect(input).not.toHaveFocus()
  })
})
