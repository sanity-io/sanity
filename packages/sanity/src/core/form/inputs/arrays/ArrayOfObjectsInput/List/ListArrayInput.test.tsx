import {type ArraySchemaType, type FormNodeValidation, type Path} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ArrayOfObjectsInputProps} from '../../../../types/inputProps'
import {type ObjectItem} from '../../../../types/itemProps'
import {useArrayValidation} from '../../common/ArrayValidationContext'
import {ListArrayInput} from './ListArrayInput'

vi.mock('../../../../../i18n/hooks/useTranslation', () => ({
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

function createSchemaType(options: {max?: number; collapseItemsAfter?: number | false}) {
  const {max, collapseItemsAfter} = options
  return {
    name: 'testArray',
    jsonType: 'array',
    of: [{name: 'testItem', jsonType: 'object', type: {name: 'testItem', jsonType: 'object'}}],
    options: collapseItemsAfter === undefined ? undefined : {collapseItemsAfter},
    validation:
      max !== undefined ? [{_rules: [{flag: 'max' as const, constraint: max}]}] : undefined,
  } as ArraySchemaType
}

function renderListArrayInput(options: {
  collapseItemsAfter?: number | false
  focusPath?: Path
  max?: number
  memberCount: number
  openMemberKey?: string
  validation?: FormNodeValidation[]
}) {
  const members = Array.from({length: options.memberCount}, (_, idx) => ({
    key: `key-${idx}`,
    open: `key-${idx}` === options.openMemberKey,
  }))
  const props = {
    arrayFunctions: ValidationProbe,
    elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
    members,
    schemaType: createSchemaType({
      max: options.max,
      collapseItemsAfter: options.collapseItemsAfter,
    }),
    focusPath: options.focusPath ?? [],
    validation: options.validation,
  } as unknown as ArrayOfObjectsInputProps<ObjectItem>

  return render(<ListArrayInput {...props} />, {
    wrapper: ({children}: {children: ReactNode}) => (
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
    ),
  })
}

function renderedMemberKeys(): string[] {
  const calls = virtualizedArrayListMock.mock.calls
  const passedProps = calls[calls.length - 1][0] as {members: {key: string}[]}
  return passedProps.members.map((member) => member.key)
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

  describe('collapsing long arrays', () => {
    it('renders every item when collapsing would hide fewer than three of them', () => {
      renderListArrayInput({memberCount: 6})

      expect(renderedMemberKeys()).toHaveLength(6)
      expect(screen.queryByTestId('array-items-toggle')).toBeNull()
    })

    it('renders the first four items and a toggle when the array is long', () => {
      renderListArrayInput({memberCount: 10})

      expect(renderedMemberKeys()).toEqual(['key-0', 'key-1', 'key-2', 'key-3'])
      expect(screen.getByTestId('array-items-toggle')).toBeInTheDocument()
    })

    it('reports the full item count to the validation context while collapsed', () => {
      renderListArrayInput({max: 10, memberCount: 10})

      expect(screen.getByTestId('max-reached')).toHaveTextContent('true')
    })

    it('renders every item once the toggle is used, and collapses again on a second use', async () => {
      renderListArrayInput({memberCount: 10})

      await userEvent.click(screen.getByRole('button', {expanded: false}))
      expect(renderedMemberKeys()).toHaveLength(10)

      await userEvent.click(screen.getByRole('button', {expanded: true}))
      expect(renderedMemberKeys()).toHaveLength(4)
    })

    it('expands when the focus path points at a hidden item', () => {
      renderListArrayInput({memberCount: 10, focusPath: [{_key: 'key-8'}]})

      expect(renderedMemberKeys()).toHaveLength(10)
    })

    it('expands when a hidden item is open for editing', () => {
      renderListArrayInput({memberCount: 10, openMemberKey: 'key-8'})

      expect(renderedMemberKeys()).toHaveLength(10)
    })

    it('stays expanded after focus leaves a hidden item', () => {
      const {rerender} = renderListArrayInput({memberCount: 10, focusPath: [{_key: 'key-8'}]})

      expect(renderedMemberKeys()).toHaveLength(10)

      const members = Array.from({length: 10}, (_, idx) => ({key: `key-${idx}`, open: false}))
      rerender(
        <ListArrayInput
          {...({
            arrayFunctions: ValidationProbe,
            elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
            members,
            schemaType: createSchemaType({}),
            focusPath: [],
          } as unknown as ArrayOfObjectsInputProps<ObjectItem>)}
        />,
      )

      expect(renderedMemberKeys()).toHaveLength(10)
    })

    it('honours a per-field item limit', () => {
      renderListArrayInput({collapseItemsAfter: 2, memberCount: 10})

      expect(renderedMemberKeys()).toEqual(['key-0', 'key-1'])
    })

    it('never collapses when the field opts out', () => {
      renderListArrayInput({collapseItemsAfter: false, memberCount: 50})

      expect(renderedMemberKeys()).toHaveLength(50)
      expect(screen.queryByTestId('array-items-toggle')).toBeNull()
    })
  })
})
