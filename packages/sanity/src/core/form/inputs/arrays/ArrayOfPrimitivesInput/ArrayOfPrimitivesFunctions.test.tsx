import {type ArraySchemaType} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {ArrayValidationProvider} from '../common/ArrayValidationContext'
import {ArrayOfPrimitivesFunctions} from './ArrayOfPrimitivesFunctions'

vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
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
    of: [{name: 'string', jsonType: 'string', type: {name: 'string', jsonType: 'string'}}],
    validation,
  } as ArraySchemaType
}

function createDefaultProps(schemaType: ArraySchemaType) {
  return {
    onChange: vi.fn(),
    onItemAppend: vi.fn(),
    onItemPrepend: vi.fn(),
    onValueCreate: vi.fn().mockReturnValue(''),
    readOnly: false,
    schemaType,
    value: [],
    path: [],
  }
}

function Wrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

describe('ArrayOfPrimitivesFunctions', () => {
  it('renders enabled "Add item" button when no max constraint', () => {
    const schemaType = createMockSchemaType()
    const props = createDefaultProps(schemaType)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={1}>
        <ArrayOfPrimitivesFunctions {...props} />
      </ArrayValidationProvider>,
      {wrapper: Wrapper},
    )

    const button = screen.getByTestId('add-multiple--primitive-button')
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('renders disabled "Add item" button with tooltip when max is reached', () => {
    const schemaType = createMockSchemaType(3)
    const props = createDefaultProps(schemaType)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={3}>
        <ArrayOfPrimitivesFunctions {...props} />
      </ArrayValidationProvider>,
      {wrapper: Wrapper},
    )

    const button = screen.getByTestId('add-max-reached-primitive-button')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('does not call onItemAppend when max is reached', async () => {
    const schemaType = createMockSchemaType(3)
    const props = createDefaultProps(schemaType)
    const user = userEvent.setup()

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={3}>
        <ArrayOfPrimitivesFunctions {...props} />
      </ArrayValidationProvider>,
      {wrapper: Wrapper},
    )

    const button = screen.getByTestId('add-max-reached-primitive-button')
    await user.click(button)

    expect(props.onItemAppend).toHaveBeenCalledTimes(0)
  })
})
