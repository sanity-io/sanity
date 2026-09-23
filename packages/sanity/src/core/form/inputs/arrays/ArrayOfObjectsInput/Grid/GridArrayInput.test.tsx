import {type ArraySchemaType, type Path} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {type ArrayOfObjectsInputProps} from '../../../../types/inputProps'
import {type ObjectItem} from '../../../../types/itemProps'
import {useArrayValidation} from '../../common/ArrayValidationContext'
import {GridArrayInput} from './GridArrayInput'

vi.mock('../../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../files/common/uploadTarget/UploadTargetCard', () => ({
  UploadTargetCard: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

vi.mock('../../../../members/array/items/ArrayOfObjectsItem', () => ({
  ArrayOfObjectsItem: () => <div data-testid="grid-member" />,
}))

function ValidationProbe() {
  const validation = useArrayValidation()
  return <span data-testid="max-reached">{validation?.maxReached ? 'true' : 'false'}</span>
}

function renderGridArrayInput(options: {
  collapseItemsAfter?: number | false
  focusPath?: Path
  max?: number
  memberCount: number
}) {
  const members = Array.from({length: options.memberCount}, (_, index) => ({
    kind: 'item' as const,
    key: `key-${index}`,
    index,
    open: false,
    item: {path: [{_key: `key-${index}`}]},
  }))

  const props = {
    arrayFunctions: ValidationProbe,
    elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
    focusPath: options.focusPath ?? [],
    members,
    onChange: vi.fn(),
    onItemAppend: vi.fn(),
    onItemMove: vi.fn(),
    onItemPrepend: vi.fn(),
    path: [],
    renderInput: vi.fn(),
    renderPreview: vi.fn(),
    schemaType: {
      name: 'testArray',
      jsonType: 'array',
      of: [{name: 'testItem', jsonType: 'object', type: {name: 'testItem', jsonType: 'object'}}],
      options: {layout: 'grid', collapseItemsAfter: options.collapseItemsAfter},
      validation:
        options.max === undefined
          ? undefined
          : [{_rules: [{flag: 'max' as const, constraint: options.max}]}],
    },
    value: [],
  } as unknown as ArrayOfObjectsInputProps<ObjectItem>

  return render(<GridArrayInput {...props} />, {
    wrapper: ({children}: {children: ReactNode}) => (
      // oxlint-disable-next-line no-deprecated -- matches the surrounding array input tests
      <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
    ),
  })
}

function renderedMemberCount(): number {
  return screen.queryAllByTestId('grid-member').length
}

describe('GridArrayInput', () => {
  describe('collapsing long arrays', () => {
    // Grids fit several items per row, so they collapse at double the configured list limit.
    it('renders every item when the array is no longer than the doubled limit', () => {
      renderGridArrayInput({memberCount: 8})

      expect(renderedMemberCount()).toBe(8)
      expect(screen.queryByTestId('array-items-toggle')).toBeNull()
    })

    it('collapses to eight items once the array exceeds the doubled limit', () => {
      renderGridArrayInput({memberCount: 12})

      expect(renderedMemberCount()).toBe(8)
      expect(screen.getByTestId('array-items-toggle')).toBeInTheDocument()
    })

    it('reports the full item count to the validation context while collapsed', () => {
      renderGridArrayInput({max: 12, memberCount: 12})

      expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
    })

    it('renders every item once the toggle is used, and collapses again on a second use', async () => {
      renderGridArrayInput({memberCount: 12})

      await userEvent.click(screen.getByRole('button', {expanded: false}))
      expect(renderedMemberCount()).toBe(12)

      await userEvent.click(screen.getByRole('button', {expanded: true}))
      expect(renderedMemberCount()).toBe(8)
    })

    it('expands when the focus path points at a hidden item', () => {
      renderGridArrayInput({focusPath: [{_key: 'key-10'}], memberCount: 12})

      expect(renderedMemberCount()).toBe(12)
    })

    // A per-field limit is taken literally, so it is not doubled the way the default is.
    it('honours a per-field item limit without doubling it', () => {
      renderGridArrayInput({collapseItemsAfter: 3, memberCount: 12})

      expect(renderedMemberCount()).toBe(3)
    })

    it('never collapses when the field opts out', () => {
      renderGridArrayInput({collapseItemsAfter: false, memberCount: 40})

      expect(renderedMemberCount()).toBe(40)
      expect(screen.queryByTestId('array-items-toggle')).toBeNull()
    })
  })
})
