import {type ArraySchemaType, type Path} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {type ArrayOfPrimitivesInputProps} from '../../../types/inputProps'
import {useArrayValidation} from '../common/ArrayValidationContext'
import {ArrayOfPrimitivesInput} from './ArrayOfPrimitivesInput'

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('./arrayOfPrimitiveUploadTarget', () => ({
  UploadTargetCard: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

vi.mock('../../../../changeIndicators/ChangeIndicator', () => ({
  ChangeIndicator: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

vi.mock('../../../members/array/items/ArrayOfPrimitivesItem', () => ({
  ArrayOfPrimitivesItem: () => <div data-testid="primitive-member" />,
}))

function ValidationProbe() {
  const validation = useArrayValidation()
  return <span data-testid="max-reached">{validation?.maxReached ? 'true' : 'false'}</span>
}

function createSchemaType(options: {
  collapseItemsAfter?: number | false
  layout?: 'grid'
  max?: number
}): ArraySchemaType {
  const {collapseItemsAfter, layout, max} = options

  return {
    name: 'testArray',
    jsonType: 'array',
    of: [{name: 'string', jsonType: 'string', type: {name: 'string', jsonType: 'string'}}],
    options: {collapseItemsAfter, layout},
    validation:
      max === undefined ? undefined : [{_rules: [{flag: 'max' as const, constraint: max}]}],
  } as ArraySchemaType
}

function renderArrayOfPrimitivesInput(options: {
  collapseItemsAfter?: number | false
  focusPath?: Path
  layout?: 'grid'
  max?: number
  memberCount: number
}) {
  const members = Array.from({length: options.memberCount}, (_, index) => ({
    kind: 'item' as const,
    key: `string-${index}`,
    index,
    open: false,
    item: {path: [index], value: `value ${index}`},
  }))

  const props = {
    arrayFunctions: ValidationProbe,
    elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
    focusPath: options.focusPath ?? [],
    members,
    onChange: vi.fn(),
    onIndexFocus: vi.fn(),
    onItemAppend: vi.fn(),
    onItemPrepend: vi.fn(),
    onItemRemove: vi.fn(),
    onMoveItem: vi.fn(),
    onUpload: vi.fn(),
    path: [],
    renderInput: vi.fn(),
    resolveUploader: vi.fn(),
    schemaType: createSchemaType(options),
    value: members.map((member) => member.item.value),
  } as unknown as ArrayOfPrimitivesInputProps

  return render(<ArrayOfPrimitivesInput {...props} />, {
    wrapper: ({children}: {children: ReactNode}) => (
      // oxlint-disable-next-line no-deprecated -- matches the surrounding array input tests
      <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
    ),
  })
}

function renderedMemberCount(): number {
  return screen.queryAllByTestId('primitive-member').length
}

describe('ArrayOfPrimitivesInput', () => {
  describe('collapsing long arrays', () => {
    it('renders every item when collapsing would hide fewer than three of them', () => {
      renderArrayOfPrimitivesInput({memberCount: 6})

      expect(renderedMemberCount()).toBe(6)
      expect(screen.queryByTestId('array-items-toggle')).toBeNull()
    })

    it('renders the first four items and a toggle when the array is long', () => {
      renderArrayOfPrimitivesInput({memberCount: 10})

      expect(renderedMemberCount()).toBe(4)
      expect(screen.getByTestId('array-items-toggle')).toBeInTheDocument()
    })

    it('reports the full item count to the validation context while collapsed', () => {
      renderArrayOfPrimitivesInput({max: 10, memberCount: 10})

      expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
    })

    it('renders every item once the toggle is used, and collapses again on a second use', async () => {
      renderArrayOfPrimitivesInput({memberCount: 10})

      await userEvent.click(screen.getByRole('button', {expanded: false}))
      expect(renderedMemberCount()).toBe(10)

      await userEvent.click(screen.getByRole('button', {expanded: true}))
      expect(renderedMemberCount()).toBe(4)
    })

    // Primitive items are addressed by index rather than by `_key`, so this is the case that
    // would silently regress if the focused member were resolved the way objects resolve it.
    it('expands when the focus path points at a hidden item', () => {
      renderArrayOfPrimitivesInput({focusPath: [8], memberCount: 10})

      expect(renderedMemberCount()).toBe(10)
    })

    it('stays collapsed when the focus path points at a visible item', () => {
      renderArrayOfPrimitivesInput({focusPath: [1], memberCount: 10})

      expect(renderedMemberCount()).toBe(4)
    })

    it('doubles the limit for grid layouts', () => {
      renderArrayOfPrimitivesInput({layout: 'grid', memberCount: 20})

      expect(renderedMemberCount()).toBe(8)
    })

    it('honours a per-field item limit', () => {
      renderArrayOfPrimitivesInput({collapseItemsAfter: 2, memberCount: 10})

      expect(renderedMemberCount()).toBe(2)
    })

    it('never collapses when the field opts out', () => {
      renderArrayOfPrimitivesInput({collapseItemsAfter: false, memberCount: 50})

      expect(renderedMemberCount()).toBe(50)
      expect(screen.queryByTestId('array-items-toggle')).toBeNull()
    })
  })
})
