import {type ArraySchemaType} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {ArrayValidationProvider} from '../common/ArrayValidationContext'
import {ArrayOfObjectsFunctions} from './ArrayOfObjectsFunctions'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: vi.fn()}),
}))

vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../studio/tree-editing/context/enabled/useEnhancedObjectDialog', () => ({
  useEnhancedObjectDialog: () => ({enabled: false}),
}))

vi.mock('./InsertMenuPopover', () => ({
  useInsertMenuPopover: () => ({state: {open: false}, send: vi.fn(), popover: null}),
}))

function createMockSchemaType(maxConstraint?: number): ArraySchemaType {
  const validation =
    maxConstraint !== undefined
      ? [
          {
            _rules: [{flag: 'max' as const, constraint: maxConstraint}],
          },
        ]
      : undefined

  return {
    name: 'testArray',
    jsonType: 'array',
    of: [{name: 'testItem', jsonType: 'object', type: {name: 'testItem', jsonType: 'object'}}],
    validation,
  } as ArraySchemaType
}

function createDefaultProps(schemaType: ArraySchemaType) {
  return {
    onChange: vi.fn(),
    onItemAppend: vi.fn(),
    onItemPrepend: vi.fn(),
    onValueCreate: vi.fn().mockReturnValue({_type: 'testItem', _key: 'test-key'}),
    readOnly: false,
    schemaType,
    value: [],
    path: [],
  }
}

function Wrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

describe('ArrayOfObjectsFunctions', () => {
  it('renders enabled "Add item" button when no max constraint', () => {
    const schemaType = createMockSchemaType()
    const props = createDefaultProps(schemaType)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={1}>
        <ArrayOfObjectsFunctions {...props} />
      </ArrayValidationProvider>,
      {wrapper: Wrapper},
    )

    const button = screen.getByTestId('add-single-object-button')
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('renders disabled "Add item" button with tooltip when max is reached', () => {
    const schemaType = createMockSchemaType(3)
    const props = createDefaultProps(schemaType)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={3}>
        <ArrayOfObjectsFunctions {...props} />
      </ArrayValidationProvider>,
      {wrapper: Wrapper},
    )

    const button = screen.getByTestId('add-max-reached-object-button')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('does not call onItemAppend when max is reached', async () => {
    const schemaType = createMockSchemaType(3)
    const props = createDefaultProps(schemaType)
    const user = userEvent.setup()

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={3}>
        <ArrayOfObjectsFunctions {...props} />
      </ArrayValidationProvider>,
      {wrapper: Wrapper},
    )

    const button = screen.getByTestId('add-max-reached-object-button')
    await user.click(button)

    expect(props.onItemAppend).toHaveBeenCalledTimes(0)
  })
})
