import {defineType} from '@sanity/types'
import React from 'react'
import {renderObjectInput} from '../../../../../../test/form'
import {ObjectInput} from '../ObjectInput'

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

// const noopRenderDefault = () => <></>

describe('ObjectInput', () => {
  it('renders as empty if given no members', async () => {
    const {container} = await renderObjectInput({
      fieldDefinition: defs.basic as any,
      render: (inputProps) => <ObjectInput {...inputProps} members={[]} />,
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('calls renderField and renderInput for each member', async () => {
    const renderField = jest
      .fn()
      .mockImplementationOnce((props) => (
        <div data-testid={`field-${props.inputId}`}>{props.children}</div>
      ))

    const renderInput = jest
      .fn()
      .mockImplementationOnce((props) => <div data-testid={`input-${props.id}`} />)

    const {result} = await renderObjectInput({
      fieldDefinition: defs.collapsibleTest as any,
      render: (inputProps) => (
        <ObjectInput
          {...inputProps}
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
                schemaType: inputProps.schemaType,
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
          renderField={renderField}
          renderInput={renderInput}
        />
      ),
    })

    expect(result.queryByTestId('field-first-field')).toBeInTheDocument()
    expect(result.queryByTestId('input-first-field')).toBeInTheDocument()
    expect(renderField.mock.calls.length).toBe(1)
    expect(renderInput.mock.calls.length).toBe(1)
  })
})
