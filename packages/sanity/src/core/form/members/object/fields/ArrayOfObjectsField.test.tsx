import {render} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren} from 'react'
import {FormBuilderContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type FIXME} from '../../../../FIXME'
import {createSchema} from '../../../../schema/createSchema'
import {DocumentIdProvider} from '../../../contexts/DocumentIdProvider'
import {type FormBuilderContextValue} from '../../../FormBuilderContext'
import {insert, setIfMissing, unset} from '../../../patch/patch'
import {PatchEvent} from '../../../patch/PatchEvent'
import {type FieldMember} from '../../../store/types/members'
import {type ArrayOfObjectsFormNode} from '../../../store/types/nodes'
import {DocumentFieldActionsProvider} from '../../../studio/contexts/DocumentFieldActions'
import {
  FormCallbacksProvider,
  type FormCallbacksValue,
} from '../../../studio/contexts/FormCallbacks'
import {type ArrayOfObjectsInputProps} from '../../../types/inputProps'
import {ArrayOfObjectsField} from './ArrayOfObjectsField'

const EMPTY_ARRAY: never[] = []

const schema = createSchema({
  name: 'test',
  types: [
    {
      name: 'doc',
      type: 'document',
      fields: [
        {name: 'body', type: 'array', of: [{type: 'block'}]},
        {
          name: 'items',
          type: 'array',
          of: [{type: 'object', name: 'thing', fields: [{name: 'title', type: 'string'}]}],
        },
      ],
    },
  ],
})

describe('ArrayOfObjectsField', () => {
  it('passes a block unset through for a Portable Text array even when its own value is empty', async () => {
    const {formCallbacks, onChange} = await setupTest('body')

    const event = PatchEvent.from(unset([{_key: 'a'}]))
    onChange(event)

    expect(formCallbacks.onChange).toHaveBeenCalledWith(
      PatchEvent.from(event).prepend(setIfMissing([])).prefixAll('body'),
    )
  })

  it('does not swallow patches accompanying a block unset in the same event', async () => {
    const {formCallbacks, onChange} = await setupTest('body')

    const event = PatchEvent.from([
      unset([{_key: 'a'}]),
      insert([{_key: 'b', _type: 'block'}], 'after', [{_key: 'a'}]),
    ])
    onChange(event)

    expect(formCallbacks.onChange).toHaveBeenCalledWith(
      PatchEvent.from(event).prepend(setIfMissing([])).prefixAll('body'),
    )
  })

  it('still rewrites removal of the last item to a field unset for a plain object array', async () => {
    const {formCallbacks, onChange} = await setupTest('items', [{_key: 'a', _type: 'thing'}])

    onChange(PatchEvent.from(unset([{_key: 'a'}])))

    expect(formCallbacks.onChange).toHaveBeenCalledWith(PatchEvent.from(unset(['items'])))
  })
})

async function setupTest(fieldName: 'body' | 'items', value?: {_key: string; _type: string}[]) {
  const docType = schema.get('doc') as FIXME
  const schemaType = docType.fields.find((field: {name: string}) => field.name === fieldName)?.type

  const field: Partial<ArrayOfObjectsFormNode> = {
    id: fieldName,
    schemaType,
    level: 1,
    path: [fieldName],
    presence: [],
    validation: [],
    members: [],
    focusPath: [],
    value,
    readOnly: false,
    focused: false,
    changed: false,
  }

  const member = {
    kind: 'field',
    key: fieldName,
    name: fieldName,
    index: 0,
    collapsed: false,
    collapsible: false,
    open: true,
    groups: [],
    inSelectedGroup: false,
    field,
  } as unknown as FieldMember<ArrayOfObjectsFormNode>

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
    // oxlint-disable-next-line no-deprecated -- the component reads `__internal` upload flags
    __internal: {
      image: {directUploads: false},
      file: {directUploads: false},
    },
  } as FormBuilderContextValue

  const BaseTestWrapper = await createTestProvider()

  const TestWrapper: ComponentType<PropsWithChildren> = ({children}) => (
    <BaseTestWrapper>
      <FormBuilderContext.Provider value={formBuilder}>
        <FormCallbacksProvider {...formCallbacks}>
          <DocumentIdProvider id="test">
            <DocumentFieldActionsProvider actions={EMPTY_ARRAY}>
              {children}
            </DocumentFieldActionsProvider>
          </DocumentIdProvider>
        </FormCallbacksProvider>
      </FormBuilderContext.Provider>
    </BaseTestWrapper>
  )

  let capturedOnChange: ArrayOfObjectsInputProps['onChange'] | undefined

  render(
    <ArrayOfObjectsField
      member={member}
      renderInput={(inputProps: FIXME) => {
        capturedOnChange = inputProps.onChange
        return null
      }}
      renderField={(fieldProps: FIXME) => fieldProps.children}
      renderItem={() => null}
      renderPreview={() => null}
    />,
    {wrapper: TestWrapper},
  )

  if (!capturedOnChange) {
    throw new Error('renderInput was never called')
  }

  return {formCallbacks, onChange: capturedOnChange}
}
