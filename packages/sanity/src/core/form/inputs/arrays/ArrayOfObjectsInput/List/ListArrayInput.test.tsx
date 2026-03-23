import {type ArraySchemaType} from '@sanity/types'
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

const resolveItemComponentMock = vi.fn()
vi.mock('../../../../studio/inputResolver/itemResolver', () => ({
  defaultResolveItemComponent: (schemaType: unknown) => resolveItemComponentMock(schemaType),
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

function renderListArrayInput(options: {max?: number; memberCount: number}) {
  const members = Array.from({length: options.memberCount}, (_, i) => ({key: `key-${i}`}))
  const props = {
    arrayFunctions: ValidationProbe,
    elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
    members,
    schemaType: createSchemaType(options.max),
    focusPath: [],
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
    resolveItemComponentMock.mockClear()
    resolveItemComponentMock.mockReturnValue(() => null)
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

  it('resolves item component from schemaType via defaultResolveItemComponent', () => {
    function StubItemComponent() {
      return null
    }
    resolveItemComponentMock.mockReturnValue(StubItemComponent)

    renderListArrayInput({memberCount: 1})

    const passedProps = virtualizedArrayListMock.mock.calls[0][0] as Record<string, unknown>
    const renderItem = passedProps.renderItem as (props: Record<string, unknown>) => unknown

    const itemSchemaType = {name: 'myCustomItem', jsonType: 'object'}
    const renderedElement = renderItem({schemaType: itemSchemaType}) as {
      type: unknown
      props: Record<string, unknown>
    }

    expect(resolveItemComponentMock).toHaveBeenCalledWith(itemSchemaType)
    expect(renderedElement.type).toBe(StubItemComponent)
    expect(renderedElement.props).toEqual(expect.objectContaining({schemaType: itemSchemaType}))
  })
})
