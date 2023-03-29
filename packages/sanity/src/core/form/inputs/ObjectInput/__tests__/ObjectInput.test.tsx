import {defineType, ObjectSchemaType} from '@sanity/types'
import React from 'react'
import {ObjectInput} from '../ObjectInput'
import {ObjectInputProps} from '../../../types'
import {FormCallbacksProvider} from '../../../studio/contexts/FormCallbacks'
import {createSchema} from '../../../../schema'
import {render} from './test-utils'

const noopRenderDefault = () => <></>

const defs = {
  basic: defineType({
    title: 'very basic object',
    name: 'basic',
    type: 'object',
    fields: [{name: 'first', type: 'string'}],
  }),
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

function getTestSchema(name: keyof typeof defs): ObjectSchemaType {
  return createSchema({name: 'test', types: [defs[name]]}).get(name) as ObjectSchemaType
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop(...args: any[]): void {}
function returnNull(...args: any[]): null {
  return null
}

const noopProps: Omit<ObjectInputProps, 'schemaType' | 'renderDefault'> = {
  groups: [],
  onChange: noop,
  onFieldCollapse: noop,
  onFieldExpand: noop,
  onFieldSetCollapse: noop,
  onFieldSetExpand: noop,
  onFieldGroupSelect: noop,
  onPathFocus: noop,
  onFieldOpen: noop,
  onFieldClose: noop,
  renderAnnotation: returnNull,
  renderBlock: returnNull,
  renderInlineBlock: returnNull,
  renderInput: returnNull,
  renderField: returnNull,
  renderItem: returnNull,
  renderPreview: returnNull,
  members: [],
  focusPath: [],
  id: 'test',
  level: 0,
  path: [],
  presence: [],
  validation: [],
  value: {},
  changed: false,
  elementProps: {ref: {current: null}, onBlur: noop, onFocus: noop, id: 'test'},
}

describe('basic examples', () => {
  it('renders as empty if given no members', () => {
    const {container} = render(
      <ObjectInput
        {...noopProps}
        renderDefault={noopRenderDefault}
        schemaType={getTestSchema('basic')}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
  it('calls renderField and renderInput for each member', () => {
    const schemaType = getTestSchema('collapsibleTest')
    const renderField = jest
      .fn()
      .mockImplementationOnce((props) => (
        <div data-testid={`field-${props.inputId}`}>{props.children}</div>
      ))
    const renderInput = jest
      .fn()
      .mockImplementationOnce((props) => <div data-testid={`input-${props.id}`} />)

    const {queryByTestId} = render(
      <FormCallbacksProvider
        onFieldGroupSelect={noop}
        onChange={noop}
        onSetFieldSetCollapsed={noop}
        onSetPathCollapsed={noop}
        onPathFocus={noop}
        onPathBlur={noop}
        onPathOpen={noop}
      >
        <ObjectInput
          {...noopProps}
          members={[
            {
              kind: 'field',
              collapsed: true,
              name: 'first',
              open: false,
              collapsible: true,
              key: 'first-field',
              inSelectedGroup: false,
              groups: [],
              index: 0,
              field: {
                schemaType,
                validation: [],
                level: 0,
                path: ['first'],
                presence: [],
                value: 'something',
                changed: false,
                focused: false,
                id: 'first-field',
                readOnly: false,
              },
            },
          ]}
          schemaType={schemaType}
          renderInput={renderInput}
          renderField={renderField}
          renderDefault={noopRenderDefault}
        />
      </FormCallbacksProvider>
    )
    expect(queryByTestId('field-first-field')).toBeInTheDocument()
    expect(queryByTestId('input-first-field')).toBeInTheDocument()
    expect(renderField.mock.calls.length).toBe(1)
    expect(renderInput.mock.calls.length).toBe(1)
  })
})
