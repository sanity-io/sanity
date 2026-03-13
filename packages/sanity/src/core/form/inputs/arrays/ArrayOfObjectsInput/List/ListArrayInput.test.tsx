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
  UploadTargetCard: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

vi.mock('./VirtualizedArrayList', () => ({
  VirtualizedArrayList: () => null,
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
  it('provides ArrayValidationContext to children', () => {
    renderListArrayInput({memberCount: 0})

    expect(screen.getByTestId('has-context')).toHaveTextContent('yes')
  })

  it('signals max reached when member count meets the max constraint', () => {
    renderListArrayInput({max: 3, memberCount: 3})

    expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
  })
})
