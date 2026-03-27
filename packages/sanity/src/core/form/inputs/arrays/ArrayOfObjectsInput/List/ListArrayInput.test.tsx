import {type ArraySchemaType, type FormNodeValidation} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ArrayOfObjectsInputProps, type ObjectItem} from '../../../../types'
import {useArrayValidation} from '../../common/ArrayValidationContext'
import {ListArrayInput} from './ListArrayInput'

vi.mock('../../../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../files/common/uploadTarget/UploadTargetCard', () => ({
  UploadTargetCard: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

const virtualizedArrayListMock = vi.fn((_props: Record<string, unknown>) => null)
vi.mock('./VirtualizedArrayList', () => ({
  VirtualizedArrayList: (props: Record<string, unknown>) => virtualizedArrayListMock(props),
}))

function MockItemComponent() {
  return null
}
vi.mock('../../../../form-components-hooks/componentHooks', () => ({
  useItemComponent: () => MockItemComponent,
}))

vi.mock('./useVisibilityDetection', () => ({
  useVisibilityDetection: () => ({isVisible: true, mountKey: 0}),
}))

function ValidationProbe() {
  const validation = useArrayValidation()
  return (
    <div>
      <span data-testid="has-context">{validation === null ? 'no' : 'yes'}</span>
      <span data-testid="max-reached">{validation?.maxReached ? 'true' : 'false'}</span>
    </div>
  )
}

function createSchemaType(max?: number): ArraySchemaType {
  return {
    name: 'testArray',
    jsonType: 'array',
    of: [{name: 'testItem', jsonType: 'object', type: {name: 'testItem', jsonType: 'object'}}],
    validation:
      max !== undefined ? [{_rules: [{flag: 'max' as const, constraint: max}]}] : undefined,
  } as ArraySchemaType
}

function renderListArrayInput(options: {
  max?: number
  memberCount: number
  validation?: FormNodeValidation[]
}) {
  const members = Array.from({length: options.memberCount}, (_, idx) => ({key: `key-${idx}`}))
  const props = {
    arrayFunctions: ValidationProbe,
    elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
    members,
    schemaType: createSchemaType(options.max),
    focusPath: [],
    validation: options.validation,
  } as unknown as ArrayOfObjectsInputProps<ObjectItem>

  return render(<ListArrayInput {...props} />, {
    wrapper: ({children}: {children: ReactNode}) => (
      <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
    ),
  })
}

describe('ListArrayInput', () => {
  beforeEach(() => {
    virtualizedArrayListMock.mockClear()
  })

  it('provides ArrayValidationContext to children', () => {
    renderListArrayInput({memberCount: 0})

    expect(screen.getByTestId('has-context')).toHaveTextContent('yes')
  })

  it('signals max reached when member count meets the max constraint', () => {
    renderListArrayInput({max: 3, memberCount: 3})

    expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
  })

  it('passes renderItem as a function to VirtualizedArrayList', () => {
    renderListArrayInput({memberCount: 1})

    expect(virtualizedArrayListMock).toHaveBeenCalledTimes(1)
    const passedProps = virtualizedArrayListMock.mock.calls[0][0] as Record<string, unknown>
    expect(passedProps).toHaveProperty('renderItem')
    expect(typeof passedProps.renderItem).toBe('function')
  })

  it('renders middleware-resolved item component for schema-aware component resolution', () => {
    renderListArrayInput({memberCount: 1})

    const passedProps = virtualizedArrayListMock.mock.calls[0][0] as Record<string, unknown>
    const renderItem = passedProps.renderItem as (props: Record<string, unknown>) => unknown
    const itemSchemaType = {name: 'myCustomItem', jsonType: 'object'}

    const element = renderItem({schemaType: itemSchemaType}) as {
      type: unknown
      props: Record<string, unknown>
    }

    expect(element.type).toBe(MockItemComponent)
    expect(element.props).toEqual(expect.objectContaining({schemaType: itemSchemaType}))
  })
  it('applies critical tone to empty state card when there are validation errors', () => {
    const errorValidation: FormNodeValidation[] = [
      {level: 'error', message: 'Array is required', path: []},
    ]
    const {container} = renderListArrayInput({
      memberCount: 0,
      validation: errorValidation,
    })

    const emptyCard = container.querySelector('[data-ui="Card"]')
    expect(emptyCard).toHaveAttribute('data-tone', 'critical')
  })

  it('does not apply critical tone to empty state card when there are no errors', () => {
    const {container} = renderListArrayInput({memberCount: 0})

    const emptyCard = container.querySelector('[data-ui="Card"]')
    expect(emptyCard).not.toHaveAttribute('data-tone', 'critical')
  })
})
