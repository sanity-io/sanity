import {type ArraySchemaType, type ObjectSchemaType} from '@sanity/types'
import {act, render} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren} from 'react'
import {FormBuilderContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {createSchema} from '../../../../schema/createSchema'
import {DocumentIdProvider} from '../../../contexts/DocumentIdProvider'
import {GetFormValueProvider} from '../../../contexts/GetFormValue'
import {type FormBuilderContextValue} from '../../../FormBuilderContext'
import {unset} from '../../../patch/patch'
import {PatchEvent} from '../../../patch/PatchEvent'
import {type ArrayOfObjectsItemMember} from '../../../store/types/members'
import {type ObjectArrayFormNode} from '../../../store/types/nodes'
import {DocumentFieldActionsProvider} from '../../../studio/contexts/DocumentFieldActions'
import {
  FormCallbacksProvider,
  type FormCallbacksValue,
} from '../../../studio/contexts/FormCallbacks'
import {type ObjectItemProps} from '../../../types/itemProps'
import {ArrayOfObjectsItem} from './ArrayOfObjectsItem'

const EMPTY_ARRAY: never[] = []

const schema = createSchema({
  name: 'test',
  types: [
    {
      name: 'doc',
      type: 'document',
      fields: [
        {
          name: 'items',
          type: 'array',
          of: [{type: 'object', name: 'thing', fields: [{name: 'title', type: 'string'}]}],
        },
      ],
    },
  ],
})

describe('ArrayOfObjectsItem', () => {
  it('removes an empty item when it is closed in a form that can be edited', async () => {
    const {close, onChange} = await renderEmptyItem({formReadOnly: false})

    act(() => close())

    expect(onChange).toHaveBeenCalledWith(PatchEvent.from([unset([{_key: 'a'}])]))
  })

  it('keeps an empty item when it is closed in a read-only form', async () => {
    const {close, onChange, onPathOpen} = await renderEmptyItem({formReadOnly: true})

    act(() => close())

    expect(onChange).not.toHaveBeenCalled()
    // Closing still moves back to the array
    expect(onPathOpen).toHaveBeenCalledWith(['items'])
  })
})

async function renderEmptyItem({formReadOnly}: {formReadOnly: boolean}) {
  const docType = schema.get('doc') as ObjectSchemaType
  const arrayType = docType.fields.find((field) => field.name === 'items')?.type as ArraySchemaType
  const itemType = arrayType.of[0] as ObjectSchemaType

  const item: Partial<ObjectArrayFormNode> = {
    id: 'items[_key=="a"]',
    schemaType: itemType,
    level: 2,
    path: ['items', {_key: 'a'}],
    presence: [],
    validation: [],
    members: [],
    groups: [],
    focusPath: [],
    value: {_key: 'a', _type: 'thing'},
    readOnly: formReadOnly,
    focused: false,
    changed: false,
  }

  const member = {
    kind: 'item',
    key: 'a',
    index: 0,
    collapsed: false,
    collapsible: false,
    open: true,
    parentSchemaType: arrayType,
    item,
  } as ArrayOfObjectsItemMember

  const formCallbacks: FormCallbacksValue = {
    onChange: vi.fn(),
    onPathFocus: vi.fn(),
    onPathBlur: vi.fn(),
    onPathOpen: vi.fn(),
    onSetPathCollapsed: vi.fn(),
    onSetFieldSetCollapsed: vi.fn(),
    onFieldGroupSelect: vi.fn(),
  }

  const formBuilder = {
    // oxlint-disable-next-line no-deprecated -- the item reads `__internal` upload flags
    __internal: {
      image: {directUploads: false},
      file: {directUploads: false},
    },
    readOnly: formReadOnly,
  } as FormBuilderContextValue

  const BaseTestWrapper = await createTestProvider()

  const TestWrapper: ComponentType<PropsWithChildren> = ({children}) => (
    <BaseTestWrapper>
      <FormBuilderContext.Provider value={formBuilder}>
        <FormCallbacksProvider {...formCallbacks}>
          <DocumentIdProvider id="test">
            <GetFormValueProvider value={{_id: 'test', _type: 'doc', items: [item.value]}}>
              <DocumentFieldActionsProvider actions={EMPTY_ARRAY}>
                {children}
              </DocumentFieldActionsProvider>
            </GetFormValueProvider>
          </DocumentIdProvider>
        </FormCallbacksProvider>
      </FormBuilderContext.Provider>
    </BaseTestWrapper>
  )

  let capturedOnClose: ObjectItemProps['onClose'] | undefined

  render(
    <ArrayOfObjectsItem
      member={member}
      renderItem={(itemProps) => {
        capturedOnClose = (itemProps as ObjectItemProps).onClose
        return null
      }}
      renderInput={() => null}
      renderField={() => null}
      renderPreview={() => null}
    />,
    {wrapper: TestWrapper},
  )

  if (!capturedOnClose) {
    throw new Error('renderItem was never called')
  }

  return {
    close: capturedOnClose,
    onChange: formCallbacks.onChange,
    onPathOpen: formCallbacks.onPathOpen,
  }
}
