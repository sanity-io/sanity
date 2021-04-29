// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, {ForwardedRef, forwardRef} from 'react'

import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import Schema from '@sanity/schema'
import ObjectInput, {Props} from '../ObjectInput'
import FormBuilderContext from '../../../FormBuilderContext'
import {Marker} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/lib/presence'
import is from '../../../utils/is'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      title: 'Object test',
      name: 'testObject',
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
  ],
})
// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const noop = () => {}

const GenericInput = forwardRef(function GenericInput(props: any, ref: ForwardedRef<any>) {
  return <div ref={ref} />
})

const GenericPreview = function GenericPreview(props: any) {
  return <div />
}

function inputResolver(type) {
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

function ObjectInputTester(props: Partial<Omit<Props, 'type'>> & {type: Props['type']}) {
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
          <ObjectInput {...DEFAULT_PROPS} {...props} />
        </FormBuilderContext>
      </LayerProvider>
    </ThemeProvider>
  )
}

const TOGGLE_BUTTON_SELECTOR = 'legend div'

describe('collapsible behavior', () => {
  it('does not render collapsible fields on objects configured with collapsed: true', () => {
    const {queryByTestId} = render(
      <ObjectInputTester type={schema.get('testObject')} focusPath={[]} />
    )
    expect(queryByTestId('input-field1')).toBeNull()
  })

  it('renders collapsible fields with collapsed: true if given a focus path that targets it', () => {
    const {queryByTestId} = render(
      <ObjectInputTester
        type={schema.get('testObject')}
        focusPath={['collapsibleAndCollapsedByDefault', 'field1']}
      />
    )
    expect(queryByTestId('input-field1')).toBeVisible()
  })

  it('toggles the collapsible field when clicking the expand/collapse button', () => {
    const {container, queryByTestId} = render(
      <ObjectInputTester level={0} isRoot type={schema.get('testObject')} />
    )
    expect(queryByTestId('input-field1')).toBeNull()
    const button = container.querySelector(TOGGLE_BUTTON_SELECTOR)
    userEvent.click(button)
    expect(queryByTestId('input-field1')).toBeVisible()
    userEvent.click(button)
    expect(queryByTestId('input-field1')).toBeNull()
  })

  it("expands a field that's been manually collapsed when receiving a focus path that targets it", () => {
    const {container, queryByTestId, rerender} = render(
      <ObjectInputTester type={schema.get('testObject')} />
    )
    expect(queryByTestId('input-field1')).toBeNull()

    const toggleButton = container.querySelector(TOGGLE_BUTTON_SELECTOR)

    userEvent.click(toggleButton)
    expect(queryByTestId('input-field1')).toBeVisible()

    userEvent.click(toggleButton)
    expect(queryByTestId('input-field1')).toBeNull()

    // Focus moves into the collapsed field (this happens when e.g. deep linking)
    rerender(
      <ObjectInputTester
        type={schema.get('testObject')}
        focusPath={['collapsibleAndCollapsedByDefault', 'field1']}
      />
    )
    expect(queryByTestId('input-field1')).toBeVisible()

    // Note: if focus moves to another field we don't want to collapse the field again
    rerender(<ObjectInputTester type={schema.get('testObject')} focusPath={[]} />)
    expect(queryByTestId('input-field1')).toBeVisible()
  })
})
