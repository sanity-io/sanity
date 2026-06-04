import {type ObjectSchemaType, type UnionSchemaType} from '@sanity/types'
import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {PatchEvent, set} from '../patch'
import {type ObjectFormNode} from '../store'
import {type RenderInputCallback, type UnionInputProps} from '../types'
import {UnionInput} from './UnionInput'

vi.mock('../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('./arrays/ArrayOfObjectsInput/InsertMenuPopover', () => ({
  useInsertMenuPopover: () => ({state: {open: false}, send: vi.fn(), popover: null}),
}))

const experimentalUnionMarker = '__experimental_union'

const heroType = {
  name: 'hero',
  title: 'Hero',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const quoteType = {
  name: 'quote',
  title: 'Quote',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const unionType = Object.assign(
  {
    name: 'contentBlock',
    title: 'Content block',
    jsonType: 'object',
    unionKind: 'object',
    fields: [],
    of: [heroType],
  },
  {[experimentalUnionMarker]: true},
) as UnionSchemaType

const multiTypeUnionType = Object.assign(
  {
    name: 'contentBlock',
    title: 'Content block',
    jsonType: 'object',
    unionKind: 'object',
    fields: [],
    of: [heroType, quoteType],
  },
  {[experimentalUnionMarker]: true},
) as UnionSchemaType

function Wrapper({children}: {children: ReactNode}) {
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}

describe('UnionInput', () => {
  it('renders an add button when empty and inserts the selected object type', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<UnionInput {...createProps({onChange})} />, {wrapper: Wrapper})

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('add-single-union-button'))

    expect(onChange).toHaveBeenCalledWith(PatchEvent.from(set({_type: 'hero'})))
  })

  it('renders a select type button when empty and multiple object types are available', () => {
    render(<UnionInput {...createProps({schemaType: multiTypeUnionType})} />, {wrapper: Wrapper})

    expect(screen.getByTestId('add-multiple-union-button')).toHaveTextContent(
      'inputs.union.action.select-type',
    )
  })

  it('renders the selected member through the input renderer', () => {
    const selectedMember = createSelectedMember(heroType)
    const renderInput = vi.fn<RenderInputCallback>((props) => (
      <div data-testid={`selected-input-${props.schemaType.name}`} />
    ))

    render(
      <UnionInput
        {...createProps({
          value: {_type: 'hero'},
          selectedMember,
          renderInput,
        })}
      />,
      {wrapper: Wrapper},
    )

    expect(screen.getByTestId('selected-input-hero')).toBeInTheDocument()
    expect(renderInput).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaType: heroType,
        value: {_type: 'hero'},
      }),
    )
  })
})

function createSelectedMember(schemaType: ObjectSchemaType): ObjectFormNode {
  return {
    id: 'contentBlock',
    schemaType,
    level: 1,
    path: ['contentBlock'],
    focusPath: [],
    presence: [],
    validation: [],
    members: [],
    groups: [],
    value: {_type: schemaType.name},
    readOnly: false,
    focused: false,
    changed: false,
    hasUpstreamVersion: false,
    __unstable_computeDiff: vi.fn(),
  }
}

function createProps(
  options: {
    value?: {_type?: string}
    onChange?: UnionInputProps['onChange']
    selectedMember?: ObjectFormNode
    renderInput?: RenderInputCallback
    schemaType?: UnionSchemaType
  } = {},
): UnionInputProps {
  return {
    value: options.value,
    compareValue: undefined,
    readOnly: false,
    schemaType: options.schemaType || unionType,
    changed: false,
    __unstable_computeDiff: vi.fn(),
    hasUpstreamVersion: false,
    id: 'contentBlock',
    path: ['contentBlock'],
    focused: false,
    level: 0,
    onChange: options.onChange || vi.fn(),
    validation: [],
    presence: [],
    elementProps: {
      'id': 'contentBlock',
      'onBlur': vi.fn(),
      'onFocus': vi.fn(),
      'ref': {current: null},
      'aria-describedby': undefined,
      'style': {},
    },
    displayInlineChanges: false,
    selectedMember: options.selectedMember,
    renderInput: options.renderInput || vi.fn(),
    renderField: vi.fn(),
    renderItem: vi.fn(),
    renderPreview: vi.fn(),
    renderAnnotation: undefined,
    renderBlock: undefined,
    renderInlineBlock: undefined,
    onPathFocus: vi.fn(),
    onFieldOpen: vi.fn(),
    onFieldClose: vi.fn(),
    onFieldCollapse: vi.fn(),
    onFieldExpand: vi.fn(),
    onFieldSetCollapse: vi.fn(),
    onFieldSetExpand: vi.fn(),
    onFieldGroupSelect: vi.fn(),
  } as unknown as UnionInputProps
}
