import userEvent from '@testing-library/user-event'
import {createRef} from 'react'
import {renderForm} from '../../../../test/renderForm'
import {renderObjectInput} from '../../../../test/renderInput'

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
      value: null,
      error: null,
      isLoading: false,
    })),
  }
})

const TOGGLE_BUTTON_SELECTOR = 'legend div'

const types = {
  collapsibleTest: {
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
  },
  focusTest: {
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
  },
  hiddenTest: {
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
  },
}

describe('collapsible behavior', () => {
  it('does not render collapsible fields on objects configured with collapsed: true', () => {
    const {result} = renderObjectInput({type: types.collapsibleTest})
    const collapsibleField = result.queryByTestId('input-field1')
    expect(collapsibleField).toBeNull()
  })

  it('renders collapsible fields with collapsed: true if given a focus path that targets it', () => {
    const {result} = renderObjectInput({
      props: {
        focusPath: ['collapsibleAndCollapsedByDefault', 'field1'],
      },
      type: types.collapsibleTest,
    })
    const collapsibleField = result.queryByTestId('input-field1')
    expect(collapsibleField).toBeVisible()
  })

  it('toggles the collapsible field when clicking the expand/collapse button', () => {
    const firstFieldPath = ['collapsibleAndCollapsedByDefault', 'field1']
    const {onFocus, rerender, result} = renderObjectInput({type: types.collapsibleTest})
    expect(result.queryByTestId('input-field1')).toBeNull()
    const button = result.container.querySelector(TOGGLE_BUTTON_SELECTOR)
    userEvent.click(button)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(firstFieldPath)
    rerender({focusPath: firstFieldPath})
    expect(result.queryByTestId('input-field1')).toBeVisible()
    userEvent.click(button)
    expect(onFocus).toHaveBeenCalledTimes(2)
    expect(onFocus).toHaveBeenLastCalledWith(['collapsibleAndCollapsedByDefault'])
    expect(result.queryByTestId('input-field1')).toBeNull()
  })

  it('does not show hidden fields', () => {
    const {result} = renderForm({type: types.hiddenTest})
    expect(result.queryByTestId('input-thisIsVisible')).toBeVisible()
    expect(result.queryByTestId('input-thisIsHidden')).toBeNull()
    expect(result.queryByTestId('input-thisMayBeVisible')).toBeVisible()
  })

  it('supports filtering fields based on a predicate', () => {
    const {result} = renderForm({
      filterField: (_type, field) => field.name !== 'thisMayBeVisible',
      type: types.hiddenTest,
    })
    expect(result.queryByTestId('input-thisIsVisible')).toBeVisible()
    expect(result.queryByTestId('input-thisIsHidden')).toBeNull()
    expect(result.queryByTestId('input-thisMayBeVisible')).toBeNull()
  })

  it("expands a field that's been manually collapsed when receiving a focus path that targets it", () => {
    const firstFieldPath = ['collapsibleAndCollapsedByDefault', 'field1']
    const {onFocus, rerender, result} = renderForm({type: types.collapsibleTest})
    expect(result.queryByTestId('input-field1')).toBeNull()
    const toggleButton = result.container.querySelector(TOGGLE_BUTTON_SELECTOR)
    userEvent.click(toggleButton)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(firstFieldPath)
    rerender({focusPath: firstFieldPath})
    expect(result.queryByTestId('input-field1')).toBeVisible()
    userEvent.click(toggleButton)
    rerender({focusPath: ['collapsibleAndCollapsedByDefault']})
    expect(result.queryByTestId('input-field1')).toBeNull()
    // Focus moves into the collapsed field (this happens when e.g. deep linking)
    rerender({focusPath: ['collapsibleAndCollapsedByDefault', 'field1']})
    expect(result.queryByTestId('input-field1')).toBeVisible()
    // Note: if focus moves to another field we don't want to collapse the field again
    rerender({focusPath: []})
    expect(result.queryByTestId('input-field1')).toBeVisible()
  })
})

describe('focus handling', () => {
  it('calling .focus() on its ref puts focus on DOM node for its first field', () => {
    const inputRef = createRef<any>()
    const {result} = renderObjectInput({props: {ref: inputRef}, type: types.focusTest})
    expect(inputRef.current).toBeDefined()
    inputRef.current.focus()
    expect(result.queryByTestId('input-title')?.querySelector('input')).toHaveFocus()
  })

  it('updates input focus based on passed focusPath', () => {
    const {result} = renderObjectInput({
      props: {focusPath: ['focusTest', 'field1']},
      type: types.focusTest,
    })
    expect(result.queryByTestId('input-field1')?.querySelector('input')).toHaveFocus()
  })

  it('emits an `onFocus()` event with the focus path of the first field when the imperative .focus() method is invoked', () => {
    // Note: this depends on the underlying native input component forwarding it's received onFocus prop
    const inputRef = createRef<any>()
    const {onFocus} = renderObjectInput({
      props: {ref: inputRef},
      type: types.focusTest,
    })
    inputRef.current.focus()
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(['title'])
  })
})
