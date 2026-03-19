import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ComponentType, type PropsWithChildren} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type FIXME} from '../../../../FIXME'
import {DocumentIdProvider} from '../../../contexts/DocumentIdProvider'
import {set} from '../../../patch/patch'
import {PatchEvent} from '../../../patch/PatchEvent'
import type {FieldMember} from '../../../store/types/members'
import {DocumentFieldActionsProvider} from '../../../studio/contexts/DocumentFieldActions'
import {
  FormCallbacksProvider,
  type FormCallbacksValue,
} from '../../../studio/contexts/FormCallbacks'
import {defaultRenderField, defaultRenderInput} from '../../../studio/defaults'
import {PrimitiveField} from './PrimitiveField'

const EMPTY_ARRAY: never[] = []

describe('PrimitiveField', () => {
  describe('number', () => {
    it('renders empty input when given no value', async () => {
      // Given
      const {member, TestWrapper} = await setupTest('number', undefined)

      // When
      render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // Then
      const input = screen.getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('')
    })

    it('renders non-zero number when mounted', async () => {
      // Given
      const {member, TestWrapper} = await setupTest('number', 42)

      // When
      render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // Then
      const input = screen.getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('42')
    })

    it('renders 0 number when mounted', async () => {
      // Given
      const {member, TestWrapper} = await setupTest('number', 0)

      // When
      render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // Then
      const input = screen.getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('0')
    })

    it('calls `onChange` callback when the input changes', async () => {
      // Given
      const {member, formCallbacks, TestWrapper} = await setupTest('number', undefined)

      render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )
      // When
      const input = screen.getByTestId('number-input')
      // uses fireEvent.change instead of userEvent.type due to https://github.com/testing-library/user-event/issues/1150
      // await userEvent.type(input, '1.01)
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.change(input, {target: {value: '1', valueAsNumber: 1}})
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.change(input, {target: {value: '1.0', valueAsNumber: 1}})
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.change(input, {target: {value: '1.01', valueAsNumber: 1.01}})

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

    it('updates input value when field is updated with a new value', async () => {
      // Given
      const {member, TestWrapper} = await setupTest('number', 1)

      const {rerender} = render(
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
      const input = screen.getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toEqual('42')
    })

    // @TODO move to e2e tests
    it.skip('keeps input value when field value is updated with a "simplified" version of the current input', async () => {
      // Given
      const {member, TestWrapper} = await setupTest('number', 1)

      const {rerender} = render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // When
      // await userEvent.type(screen.getByTestId('number-input'), '.00')
      // uses fireEvent.change instead of userEvent.type due to https://github.com/testing-library/user-event/issues/1150
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.change(screen.getByTestId('number-input'), {
        target: {value: '1.00', valueAsNumber: 1},
      })
      member.field.value = 1

      rerender(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
      )

      // Then
      const input = screen.getByTestId('number-input') as HTMLInputElement
      expect(input).toBeInstanceOf(HTMLInputElement)
      await waitFor(() => expect(input.value).toEqual('1.00'))
    })

    it('wont trigger `onChange` callbacks when number input values are out of range', async () => {
      // Given
      const {formCallbacks, member, TestWrapper} = await setupTest('number', undefined)

      render(
        <PrimitiveField
          member={member}
          renderInput={defaultRenderInput}
          renderField={defaultRenderField}
        />,
        {wrapper: TestWrapper},
      )

      // When
      const input = screen.getByTestId('number-input') as HTMLInputElement
      await userEvent.paste(input!, (Number.MIN_SAFE_INTEGER - 1).toString())
      await userEvent.paste(input!, (Number.MAX_SAFE_INTEGER + 1).toString())

      // Then
      expect(formCallbacks.onChange).toBeCalledTimes(0)
    })
  })
})

async function setupTest(type: string, value: string | number | boolean | undefined) {
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

  const BaseTestWrapper = await createTestProvider()

  const TestWrapper: ComponentType<PropsWithChildren> = ({children}) => (
    <BaseTestWrapper>
      <FormCallbacksProvider {...formCallbacks}>
        <DocumentIdProvider id="test">
          <DocumentFieldActionsProvider actions={EMPTY_ARRAY}>
            {children}
          </DocumentFieldActionsProvider>
        </DocumentIdProvider>
      </FormCallbacksProvider>
    </BaseTestWrapper>
  )

  return {member, formCallbacks, TestWrapper}
}
