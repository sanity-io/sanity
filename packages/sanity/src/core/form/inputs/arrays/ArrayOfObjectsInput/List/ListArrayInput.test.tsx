import {type ArraySchemaType} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {type ArrayOfObjectsInputProps, type ObjectItem} from '../../../../types'
import {useArrayValidation} from '../../common/ArrayValidationContext'
import {ListArrayInput} from './ListArrayInput'

vi.mock('../../../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../files/common/uploadTarget/UploadTargetCard', () => ({
  UploadTargetCard: ({children}: {children: ReactNode}) => (
    <div data-testid="upload-target">{children}</div>
  ),
}))

vi.mock('./VirtualizedArrayList', () => ({
  VirtualizedArrayList: () => <div data-testid="virtualized-list" />,
}))

vi.mock('./useVisibilityDetection', () => ({
  useVisibilityDetection: () => ({isVisible: true, mountKey: 0}),
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

function createMockMembers(count: number) {
  return Array.from({length: count}, (_, i) => ({
    kind: 'item' as const,
    key: `key-${i}`,
    index: i,
    collapsed: false,
    collapsible: true,
    open: false,
    parentSchemaType: createMockSchemaType(),
    item: {
      _key: `key-${i}`,
    },
  }))
}

/**
 * A custom arrayFunctions component that reads from the ArrayValidationContext
 * and renders the maxReached value, allowing us to verify the provider is active.
 */
function TestArrayFunctions() {
  const validation = useArrayValidation()
  return (
    <div data-testid="array-functions">
      <span data-testid="max-reached">{validation?.maxReached ? 'true' : 'false'}</span>
      <span data-testid="has-context">{validation === null ? 'no' : 'yes'}</span>
    </div>
  )
}

function createDefaultProps(
  schemaType: ArraySchemaType,
  memberCount: number,
): ArrayOfObjectsInputProps<ObjectItem> {
  return {
    arrayFunctions: TestArrayFunctions,
    elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
    members: createMockMembers(memberCount) as unknown as ArrayOfObjectsInputProps['members'],
    onChange: vi.fn(),
    onItemMove: vi.fn(),
    onSelectFile: vi.fn(),
    onUpload: vi.fn(),
    focusPath: [],
    readOnly: false,
    onItemAppend: vi.fn(),
    onItemPrepend: vi.fn(),
    onItemRemove: vi.fn(),
    onInsert: vi.fn(),
    renderAnnotation: vi.fn(),
    renderBlock: vi.fn(),
    renderField: vi.fn(),
    renderInlineBlock: vi.fn(),
    renderInput: vi.fn(),
    renderItem: vi.fn(),
    renderPreview: vi.fn(),
    schemaType,
    value: [],
    resolveInitialValue: vi.fn(),
    resolveUploader: vi.fn(),
    renderDefault: vi.fn(),
    displayInlineChanges: false,
    id: 'test',
    path: [],
    level: 0,
    validation: [],
    presence: [],
    changed: false,
  } as unknown as ArrayOfObjectsInputProps<ObjectItem>
}

function Wrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

describe('ListArrayInput', () => {
  it('provides ArrayValidationContext to children', () => {
    const schemaType = createMockSchemaType()
    const props = createDefaultProps(schemaType, 2)

    render(<ListArrayInput {...props} />, {wrapper: Wrapper})

    expect(screen.getByTestId('has-context')).toHaveTextContent('yes')
  })

  it('provides maxReached=false when no max validation rule exists', () => {
    const schemaType = createMockSchemaType()
    const props = createDefaultProps(schemaType, 5)

    render(<ListArrayInput {...props} />, {wrapper: Wrapper})

    expect(screen.getByTestId('max-reached')).toHaveTextContent('false')
  })

  it('provides maxReached=false when member count is below max', () => {
    const schemaType = createMockSchemaType(5)
    const props = createDefaultProps(schemaType, 3)

    render(<ListArrayInput {...props} />, {wrapper: Wrapper})

    expect(screen.getByTestId('max-reached')).toHaveTextContent('false')
  })

  it('provides maxReached=true when member count equals max', () => {
    const schemaType = createMockSchemaType(3)
    const props = createDefaultProps(schemaType, 3)

    render(<ListArrayInput {...props} />, {wrapper: Wrapper})

    expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
  })

  it('provides maxReached=true when member count exceeds max', () => {
    const schemaType = createMockSchemaType(3)
    const props = createDefaultProps(schemaType, 5)

    render(<ListArrayInput {...props} />, {wrapper: Wrapper})

    expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
  })
})
