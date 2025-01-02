import {type ObjectSchemaType} from '@sanity/types'
import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type PropsWithChildren} from 'react'
import {FormBuilderContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type FIXME} from '../../../../FIXME'
import {DocumentIdProvider} from '../../../contexts/DocumentIdProvider'
import {type FormBuilderContextValue} from '../../../FormBuilderContext'
import {PatchEvent, set} from '../../../patch'
import {type FieldMember} from '../../../store'
import {
  defaultRenderField,
  defaultRenderInput,
  FormCallbacksProvider,
  type FormCallbacksValue,
} from '../../../studio'
import {DocumentFieldActionsProvider} from '../../../studio/contexts/DocumentFieldActions'
import {PrimitiveField} from './PrimitiveField'

const EMPTY_ARRAY: never[] = []

describe('PrimitiveField', () => {
  describe('number', () => {
    it('renders empty input when given no value', () => {
      // Given
      const {member, TestWrapper} = setupTest('number', undefined)

      // When
      const {getByTestId} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // Then
      const input = getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('')
    })

    it('renders non-zero number when mounted', () => {
      // Given
      const {member, TestWrapper} = setupTest('number', 42)

      // When
      const {getByTestId} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // Then
      const input = getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('42')
    })

    it('renders 0 number when mounted', () => {
      // Given
      const {member, TestWrapper} = setupTest('number', 0)

      // When
      const {getByTestId} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // Then
      const input = getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('0')
    })

    it('calls `onChange` callback when the input changes', () => {
      // Given
      const {member, formCallbacks, TestWrapper} = setupTest('number', undefined)

      const {getByTestId} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // When
      userEvent.type(getByTestId('number-input'), '1.01')

      // Then
      expect(formCallbacks.onChange).toHaveBeenNthCalledWith(
        1,
        PatchEvent.from(set(1)).prefixAll(member.name),
      )
      expect(formCallbacks.onChange).toHaveBeenNthCalledWith(
        2,
        PatchEvent.from(set(1)).prefixAll(member.name),
      )
      expect(formCallbacks.onChange).toHaveBeenNthCalledWith(
        3,
        PatchEvent.from(set(1.01)).prefixAll(member.name),
      )
    })

    it('updates input value when field is updated with a new value', () => {
      // Given
      const {member, TestWrapper} = setupTest('number', 1)

      const {getByTestId, rerender} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // When
      member.field.value = 42

      rerender(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
      )

      // Then
      const input = getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('42')
    })

    it('keeps input value when field value is updated with a "simplified" version of the current input', () => {
      // Given
      const {member, TestWrapper} = setupTest('number', 1)

      const {getByTestId, rerender} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // When
      userEvent.type(getByTestId('number-input'), '.00')
      member.field.value = 1

      rerender(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
      )

      // Then
      const input = getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('1.00')
    })

    it('wont trigger `onChange` callbacks when number input values are out of range', () => {
      // Given
      const {formCallbacks, member, TestWrapper} = setupTest('number', undefined)

      const {getByTestId} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // When
      const input = getByTestId('number-input') as HTMLInputElement
      userEvent.paste(input!, (Number.MIN_SAFE_INTEGER - 1).toString())
      userEvent.paste(input!, (Number.MAX_SAFE_INTEGER + 1).toString())

      // Then
      expect(formCallbacks.onChange).toBeCalledTimes(0)
    })
  })
})

function setupTest(type: string, value: string | number | boolean | undefined) {
  const schemaType = {
    name: type,
    jsonType: type as FIXME,
  }

  const member: FieldMember = {
    kind: 'field',
    key: 'key',
    name: 'name',
    index: 0,
    collapsed: false,
    collapsible: false,
    open: true,
    groups: [],
    inSelectedGroup: false,
    field: {
      id: 'id',
      schemaType,
      level: 1,
      path: ['id'],
      presence: [],
      validation: [],
      value,
      readOnly: false,
      focused: false,
      changed: false,
    },
  }

  const formCallbacks: FormCallbacksValue = {
    onChange: vi.fn(),
    onPathFocus: vi.fn(),
    onPathBlur: vi.fn(),
    onPathOpen: vi.fn(),
    onSetPathCollapsed: vi.fn(),
    onSetFieldSetCollapsed: vi.fn(),
    onFieldGroupSelect: vi.fn(),
  }

  const formBuilder: FormBuilderContextValue = {
    __internal: {
      documentId: 'test',
      field: {actions: []},
    } as any,
    collapsedFieldSets: {value: undefined},
    collapsedPaths: {value: undefined},
    focusPath: [],
    groups: [],
    id: 'test',
    renderField: () => <>field</>,
    renderInput: () => <>input</>,
    renderItem: () => <>item</>,
    renderPreview: () => <>preview</>,
    schemaType: {} as ObjectSchemaType,
  }

  function TestWrapper({children}: PropsWithChildren) {
    return (
      <ThemeProvider theme={studioTheme}>
        <LayerProvider>
          <FormBuilderContext.Provider value={formBuilder}>
            <FormCallbacksProvider {...formCallbacks}>
              <DocumentIdProvider id="test">
                <DocumentFieldActionsProvider actions={EMPTY_ARRAY}>
                  {children}
                </DocumentFieldActionsProvider>
              </DocumentIdProvider>
            </FormCallbacksProvider>
          </FormBuilderContext.Provider>
        </LayerProvider>
      </ThemeProvider>
    )
  }

  return {member, formCallbacks, TestWrapper}
}
