// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, {ForwardedRef, forwardRef} from 'react'

import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import Schema from '@sanity/schema'
import {SchemaType} from '@sanity/types'
import {ObjectInput, Props} from '../ObjectInput'
import FormBuilderContext from '../../../FormBuilderContext'
import is from '../../../utils/is'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      title: 'Fieldsets test',
      name: 'fieldsetsTest',
      type: 'document',
      fieldsets: [
        {name: 'withDefaults', title: 'Fieldset with defaults'},
        {
          name: 'collapsibleWithDefaults',
          title: 'Collapsible fieldset with defaults',
          options: {collapsible: true},
        },
      ],
      fields: [
        {
          name: 'withDefaults1',
          type: 'string',
          fieldset: 'withDefaults',
        },
        {
          name: 'collapsibleWithDefaults1',
          type: 'string',
          fieldset: 'collapsibleWithDefaults',
        },
      ],
    },
  ],
})

const GenericInput = forwardRef(function GenericInput(props: any, ref: ForwardedRef<any>) {
  return <input type="string" ref={ref} onFocus={props.onFocus} />
})

const GenericPreview = function GenericPreview(props: any) {
  return <div />
}

function inputResolver(type: SchemaType) {
  if (is('object', type)) {
    return ObjectInput
  }
  return GenericInput
}

const DEFAULT_PROPS = {
  onFocus: jest.fn(),
  onBlur: jest.fn(),
  onChange: jest.fn(),
  markers: [],
  level: 0,
  presence: [],
}

// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const noop = () => {}

const ObjectInputTester = forwardRef(function ObjectInputTester(
  props: Partial<Omit<Props, 'type'>> & {type: Props['type']},
  ref: ForwardedRef<any>
) {
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <FormBuilderContext
          value={undefined}
          patchChannel={{onPatch: noop}}
          schema={schema}
          filterField={() => true}
          resolveInputComponent={inputResolver}
          resolvePreviewComponent={(type) => GenericPreview}
        >
          <ObjectInput {...DEFAULT_PROPS} {...props} ref={ref} />
        </FormBuilderContext>
      </LayerProvider>
    </ThemeProvider>
  )
})

describe('fieldset with default options', () => {
  it('renders fields in a <fieldset element and includes a <legend', () => {
    const {queryByTestId} = render(<ObjectInputTester type={schema.get('fieldsetsTest')} />)
    const fieldset = queryByTestId('fieldset-withDefaults')
    expect(fieldset).toBeVisible()
    expect(fieldset!.tagName).toBe('FIELDSET')
    const legend = fieldset!.querySelector('legend')
    expect(legend).toBeVisible()
    expect(legend).toContainHTML('Fieldset with defaults')
    const field1 = queryByTestId('input-withDefaults1')
    expect(field1).toBeVisible()
    expect(fieldset).toContainElement(field1)
  })

  it('does not render a toggle button for the fieldset legend ', () => {
    const {container} = render(<ObjectInputTester type={schema.get('fieldsetsTest')} />)
    const fieldset = container.querySelector('fieldset')
    expect(fieldset).toBeVisible()
    const legend = fieldset!.querySelector('legend')
    expect(legend).toBeVisible()
    expect(legend!.querySelector('button')).toBeNull()
  })
})

describe('collapsible fieldset with default options', () => {
  it('renders fields in a <fieldset element and includes a <legend', () => {
    const {queryByTestId} = render(<ObjectInputTester type={schema.get('fieldsetsTest')} />)
    const fieldset = queryByTestId('fieldset-collapsibleWithDefaults')
    expect(fieldset).toBeVisible()
    expect(fieldset!.tagName).toBe('FIELDSET')
    const legend = fieldset!.querySelector('legend')
    expect(legend).toBeVisible()
    expect(legend).toContainHTML('Collapsible fieldset with defaults')
  })

  it('renders a button for the fieldset legend ', () => {
    const {queryByTestId} = render(<ObjectInputTester type={schema.get('fieldsetsTest')} />)
    const fieldset = queryByTestId('fieldset-collapsibleWithDefaults')
    expect(fieldset).toBeVisible()
    const toggleButton = fieldset!.querySelector('legend button')
    expect(toggleButton).toBeVisible()
  })

  it('renders collapsed initially', () => {
    const {queryByTestId} = render(<ObjectInputTester type={schema.get('fieldsetsTest')} />)
    const fieldset = queryByTestId('fieldset-collapsibleWithDefaults')
    expect(fieldset).toBeVisible()
    const field1 = queryByTestId('input-collapsibleWithDefaults1')
    expect(field1).toBeNull()
  })

  it('expands if focus path targets a field inside the fieldset', () => {
    const {queryByTestId} = render(
      <ObjectInputTester
        focusPath={['collapsibleWithDefaults1']}
        type={schema.get('fieldsetsTest')}
      />
    )
    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeVisible()
  })

  it('emits a focus path targeting the field when clicking toggle button', () => {
    const onFocus = jest.fn()
    const {queryByTestId} = render(
      <ObjectInputTester onFocus={onFocus} type={schema.get('fieldsetsTest')} />
    )
    const fieldset = queryByTestId('fieldset-collapsibleWithDefaults')
    expect(fieldset).toBeVisible()
    const toggleButton = fieldset!.querySelector('legend button')

    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeNull()

    expect(toggleButton).toBeDefined()
    userEvent.click(toggleButton!)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith(['collapsibleWithDefaults1'])
  })

  it('toggles collapse/expand despite focus path targeting field inside', () => {
    const innerFieldPath = ['collapsibleWithDefaults1']
    const {queryByTestId, rerender} = render(
      <ObjectInputTester focusPath={innerFieldPath} type={schema.get('fieldsetsTest')} />
    )

    const fieldset = queryByTestId('fieldset-collapsibleWithDefaults')

    // visible because of focus path
    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeVisible()

    const toggleButton = fieldset!.querySelector('legend button')
    expect(toggleButton).toBeDefined()
    userEvent.click(toggleButton!)
    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeNull()

    // click to expand again
    userEvent.click(toggleButton!)
    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeVisible()

    // move focus to another field should keep it open
    rerender(<ObjectInputTester focusPath={[]} type={schema.get('fieldsetsTest')} />)
    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeVisible()

    // collapse again
    userEvent.click(toggleButton!)

    // move focus to a field inside again should make it expand
    rerender(<ObjectInputTester focusPath={innerFieldPath} type={schema.get('fieldsetsTest')} />)
    expect(queryByTestId('input-collapsibleWithDefaults1')).toBeVisible()
  })

  it('does not emit a new focus path when being collapsed', () => {
    // Note: this is important because ObjectFieldsets are "virtual", e.g. they are UI only and does not represent a location in the document
    // and putting focus on the parent document node will in some cases create "focus jumps"
    const onFocus = jest.fn()

    const {queryByTestId} = render(
      <ObjectInputTester
        onFocus={onFocus}
        focusPath={['collapsibleWithDefaults1']}
        type={schema.get('fieldsetsTest')}
      />
    )
    const fieldset = queryByTestId('fieldset-collapsibleWithDefaults')

    const toggleButton = fieldset!.querySelector('legend button')
    expect(toggleButton).toBeDefined()
    userEvent.click(toggleButton!)
    expect(onFocus).not.toHaveBeenCalled()
  })
})
