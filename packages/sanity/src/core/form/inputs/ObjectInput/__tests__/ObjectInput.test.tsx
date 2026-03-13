import {defineType} from '@sanity/types'
import {screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {renderObjectInput} from '../../../../../../test/form'
import {type RenderFieldCallback, type RenderInputCallback} from '../../../types'
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
}

describe('ObjectInput', () => {
  it('renders as empty if given no members', async () => {
    const {container} = await renderObjectInput({
      fieldDefinition: defs.basic as any,
      render: (inputProps) => <ObjectInput {...inputProps} members={[]} />,
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('calls renderField and renderInput for each member', async () => {
    const renderField = vi
      .fn<RenderFieldCallback>()
      .mockImplementationOnce((props) => (
        <div data-testid={`field-${props.inputId}`}>{props.children}</div>
      ))

    const renderInput = vi
      .fn<RenderInputCallback>()
      .mockImplementationOnce((props) => <div data-testid={`input-${props.id}`} />)

    const {result} = await renderObjectInput({
      fieldDefinition: defs.basic as any,
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
                schemaType: inputProps.schemaType.fields[0].type,
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

    expect(screen.getByTestId('field-first-field')).toBeInTheDocument()
    expect(screen.getByTestId('input-first-field')).toBeInTheDocument()
    expect(renderField.mock.calls.length).toBe(1)
    expect(renderInput.mock.calls.length).toBe(1)
  })

  it('renders unknown reference previews and keeps raw JSON visible', async () => {
    const user = userEvent.setup()

    const renderPreview = vi.fn(({value}: {value: {_ref?: string}}) => (
      <div data-testid="unknown-reference-preview">{value?._ref}</div>
    )) as RenderPreviewCallback

    await renderObjectInput({
      fieldDefinition: defs.basic as any,
      props: {
        documentValue: {
          _id: 'doc-1',
          _type: 'test',
          basic: {
            first: 'something',
            legacyRef: {_type: 'reference', _ref: 'target-doc-id'},
          },
        },
      },
      render: (inputProps) => <ObjectInput {...inputProps} renderPreview={renderPreview} />,
    })

    await user.click(screen.getByRole('button', {name: 'Developer info'}))

    expect(screen.getByTestId('unknown-reference-preview')).toBeInTheDocument()
    expect(screen.getByText(/"_ref": "target-doc-id"/)).toBeInTheDocument()
    expect(renderPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        value: expect.objectContaining({_ref: 'target-doc-id'}),
      }),
    )
  })

  it('keeps non-reference unknown fields as JSON and allows unsetting', async () => {
    const user = userEvent.setup()

    const {onChange} = await renderObjectInput({
      fieldDefinition: defs.basic as any,
      props: {
        documentValue: {
          _id: 'doc-2',
          _type: 'test',
          basic: {
            first: 'something',
            legacyCount: 5,
          },
        },
      },
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    expect(screen.getByText('legacyCount')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Remove field', hidden: true}))
    expect(onChange).toHaveBeenCalled()
  })
})
