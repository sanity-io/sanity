import {defineType} from '@sanity/types'
import userEvent from '@testing-library/user-event'
import React, {createRef} from 'react'
import {renderObjectInput} from '../../../../../test/form'
import {ObjectInput} from '../ObjectInput'

const TOGGLE_BUTTON_SELECTOR = 'legend div'

const defs = {
  collapsibleTest: defineType({
    title: 'Collapsible test',
    name: 'collapsibleTest',
    type: 'object',
    fields: [
      {
        name: 'collapsibleAndCollapsedByDefault',
        type: 'object',
        options: {collapsible: true, collapsed: true},
        fields: [{name: 'field1', type: 'string'}],
      },
    ],
  }),

  focusTest: defineType({
    title: 'Focus test',
    name: 'focusTest',
    type: 'object',
    fields: [
      {
        name: 'title',
        type: 'string',
      },
      {
        name: 'focusTest',
        type: 'object',
        fields: [{name: 'field1', type: 'string'}],
      },
    ],
  }),

  hiddenTest: defineType({
    title: 'Hidden test',
    name: 'hiddenTest',
    type: 'object',
    fields: [
      {
        name: 'thisIsVisible',
        type: 'string',
      },
      {
        name: 'thisIsHidden',
        type: 'string',
        hidden: true,
      },
      {
        name: 'thisMayBeVisible',
        type: 'string',
      },
    ],
  }),
}

describe('collapsible behavior', () => {
  it('does not render collapsible fields on objects configured with collapsed: true', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: defs.collapsibleTest,
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const collapsibleField = result.queryByTestId('input-field1')
    expect(collapsibleField).toBeNull()
  })

  it('renders collapsible fields with collapsed: true if given a focus path that targets it', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: defs.collapsibleTest,
      render: (inputProps) => (
        <ObjectInput {...inputProps} focusPath={['collapsibleAndCollapsedByDefault', 'field1']} />
      ),
    })

    const collapsibleField = result.queryByTestId('input-field1')
    expect(collapsibleField).toBeVisible()
  })

  it('toggles the collapsible field when clicking the expand/collapse button', async () => {
    const firstFieldPath = ['collapsibleAndCollapsedByDefault', 'field1']

    const {onFocus, rerender, result} = await renderObjectInput({
      fieldDefinition: defs.collapsibleTest,
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    expect(result.queryByTestId('input-field1')).toBeNull()
    const button = result.container.querySelector(TOGGLE_BUTTON_SELECTOR)
    userEvent.click(button!)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(firstFieldPath)

    rerender((inputProps) => <ObjectInput {...inputProps} focusPath={firstFieldPath} />)

    expect(result.queryByTestId('input-field1')).toBeVisible()
    userEvent.click(button!)
    expect(onFocus).toHaveBeenCalledTimes(2)
    expect(onFocus).toHaveBeenLastCalledWith(['collapsibleAndCollapsedByDefault'])
    expect(result.queryByTestId('input-field1')).toBeNull()
  })

  it('does not show hidden fields', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: defs.hiddenTest,
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    expect(result.queryByTestId('input-thisIsVisible')).toBeVisible()
    expect(result.queryByTestId('input-thisIsHidden')).toBeNull()
    expect(result.queryByTestId('input-thisMayBeVisible')).toBeVisible()
  })

  // it('supports filtering fields based on a predicate', () => {
  //   const filterField = (_type, field) => field.name !== 'thisMayBeVisible'

  //   const {result} = renderObjectInput({
  //     fieldDefinition: defs.hiddenTest,
  //     render: (inputProps) => <ObjectInput {...inputProps} filterField={filterField} />,
  //   })

  //   expect(result.queryByTestId('input-thisIsVisible')).toBeVisible()
  //   expect(result.queryByTestId('input-thisIsHidden')).toBeNull()
  //   expect(result.queryByTestId('input-thisMayBeVisible')).toBeNull()
  // })

  it("expands a field that's been manually collapsed when receiving a focus path that targets it", async () => {
    const firstFieldPath = ['collapsibleAndCollapsedByDefault', 'field1']

    const {onFocus, rerender, result} = await renderObjectInput({
      fieldDefinition: defs.collapsibleTest,
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    expect(result.queryByTestId('input-field1')).toBeNull()
    const toggleButton = result.container.querySelector(TOGGLE_BUTTON_SELECTOR)
    userEvent.click(toggleButton!)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(firstFieldPath)

    rerender((inputProps) => <ObjectInput {...inputProps} focusPath={firstFieldPath} />)

    expect(result.queryByTestId('input-field1')).toBeVisible()
    userEvent.click(toggleButton!)

    rerender((inputProps) => (
      <ObjectInput {...inputProps} focusPath={['collapsibleAndCollapsedByDefault']} />
    ))

    expect(result.queryByTestId('input-field1')).toBeNull()

    // Focus moves into the collapsed field (this happens when e.g. deep linking)
    rerender((inputProps) => (
      <ObjectInput {...inputProps} focusPath={['collapsibleAndCollapsedByDefault', 'field1']} />
    ))

    expect(result.queryByTestId('input-field1')).toBeVisible()

    // Note: if focus moves to another field we don't want to collapse the field again
    rerender((inputProps) => <ObjectInput {...inputProps} focusPath={[]} />)

    expect(result.queryByTestId('input-field1')).toBeVisible()
  })
})

describe('focus handling', () => {
  it('calling .focus() on its ref puts focus on DOM node for its first field', async () => {
    const inputRef = createRef<any>()

    const {result} = await renderObjectInput({
      fieldDefinition: defs.focusTest,
      render: (inputProps) => <ObjectInput {...inputProps} focusRef={inputRef} />,
    })

    expect(inputRef.current).toBeDefined()
    inputRef.current.focus()
    expect(result.queryByTestId('input-title')?.querySelector('input')).toHaveFocus()
  })

  it('updates input focus based on passed focusPath', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: defs.focusTest,
      render: (inputProps) => <ObjectInput {...inputProps} focusPath={['focusTest', 'field1']} />,
    })

    expect(result.queryByTestId('input-field1')?.querySelector('input')).toHaveFocus()
  })

  it('emits an `onFocus()` event with the focus path of the first field when the imperative .focus() method is invoked', async () => {
    // Note: this depends on the underlying native input component forwarding it's received onFocus prop
    const inputRef = createRef<any>()

    const {onFocus} = await renderObjectInput({
      fieldDefinition: defs.focusTest,
      render: (inputProps) => <ObjectInput {...inputProps} focusRef={inputRef} />,
    })

    inputRef.current.focus()
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(['title'])
  })
})
