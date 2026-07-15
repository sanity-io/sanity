import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type ReferenceSchemaType} from '@sanity/types'
import {fireEvent, render, screen} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useRef, useState} from 'react'
import {of} from 'rxjs'
import {ArrayItemRootElementContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useSchema} from '../../../../hooks/useSchema'
import {FormValueProvider} from '../../../contexts/FormValue'
import {createPatchChannel} from '../../../patch/PatchChannel'
import {FormProvider} from '../../../studio/FormProvider'
import {type FormDocumentValue} from '../../../types'
import {ReferenceInput} from '../ReferenceInput'
import {type ReferenceInputProps} from '../types'

const EMPTY_SEARCH = () => of([])

const schema = Schema.compile({
  name: 'default',
  types: [
    {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
    {name: 'actorReference', type: 'reference', to: [{type: 'actor'}]},
  ],
})

const documentValue = {_id: 'test', _type: 'test'} as unknown as FormDocumentValue

/**
 * Mimics the array item wrapper (`Item` in `../arrays/common/list.tsx`), which
 * provides its root element so that reference inputs can ignore clicks within
 * the item — e.g. on UI rendered by custom item/input components.
 */
function ArrayItemRoot(props: {children: ReactNode}) {
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  return (
    <ArrayItemRootElementContext.Provider value={rootElementRef}>
      <div data-testid="array-item-root" ref={rootElementRef}>
        {props.children}
      </div>
    </ArrayItemRootElementContext.Provider>
  )
}

function FormHarness(props: {children: ReactNode}) {
  const workspaceSchema = useSchema()
  const documentType = workspaceSchema.get('test') as ObjectSchemaType
  const [patchChannel] = useState(() => createPatchChannel())

  return (
    <FormProvider
      __internal_patchChannel={patchChannel}
      changesOpen={false}
      collapsedFieldSets={undefined}
      collapsedPaths={undefined}
      focusPath={[]}
      focused={undefined}
      groups={[]}
      id="test"
      onChange={noop}
      onFieldGroupSelect={noop}
      onPathBlur={noop}
      onPathFocus={noop}
      onPathOpen={noop}
      onSetFieldSetCollapsed={noop}
      onSetPathCollapsed={noop}
      presence={[]}
      readOnly={false}
      schemaType={documentType}
      validation={[]}
    >
      {props.children}
    </FormProvider>
  )
}

async function renderEmptyReferenceInputInArrayItem() {
  const client = createMockSanityClient() as unknown as SanityClient
  const TestProvider = await createTestProvider({
    client,
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: [
          {
            name: 'test',
            type: 'document',
            fields: [{name: 'actorRef', type: 'reference', to: [{type: 'actor'}]}],
          },
          {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
        ],
      },
    },
  })

  const onChange = vi.fn()
  const elementProps = {
    id: 'ref-input',
    onBlur: vi.fn(),
    onFocus: vi.fn(),
    ref: {current: null},
  } as unknown as ReferenceInputProps['elementProps']

  const props = {
    changed: false,
    createOptions: [],
    editReferenceLinkComponent: () => null,
    elementProps,
    // Focus is at the search input of the empty reference, i.e. `isEditing`.
    // Clicks outside then clear the empty value, which removes the array item.
    focusPath: ['_ref'],
    focused: true,
    getReferenceInfo: () => of(null as never),
    id: 'ref-input',
    level: 1,
    liveEdit: false,
    onChange,
    onEditReference: vi.fn(),
    onPathFocus: vi.fn(),
    onSearch: EMPTY_SEARCH,
    path: ['sections', {_key: 'item-0'}],
    presence: [],
    renderPreview: () => null,
    schemaType: schema.get('actorReference') as ReferenceSchemaType,
    validation: [],
    value: undefined,
  } as unknown as ReferenceInputProps

  render(
    <TestProvider>
      <FormHarness>
        <FormValueProvider value={documentValue}>
          <ArrayItemRoot>
            <ReferenceInput {...props} />
            {/* Custom UI rendered next to the default input, as custom item/input
                components may do (e.g. a "Create new" button) */}
            <button data-testid="custom-create-button" type="button">
              Create new
            </button>
          </ArrayItemRoot>
        </FormValueProvider>
        <button data-testid="outside-button" type="button">
          Outside
        </button>
      </FormHarness>
    </TestProvider>,
  )

  return {onChange}
}

describe('ReferenceInput click outside handling', () => {
  it('does not clear the empty reference when the mousedown happens on custom UI within the same array item', async () => {
    const {onChange} = await renderEmptyReferenceInputInArrayItem()

    // oxlint-disable-next-line testing-library/prefer-user-event -- the regression happens on the mousedown phase, before any click
    fireEvent.mouseDown(screen.getByTestId('custom-create-button'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the empty reference when the mousedown happens outside the array item', async () => {
    const {onChange} = await renderEmptyReferenceInputInArrayItem()

    // oxlint-disable-next-line testing-library/prefer-user-event -- the clear is triggered by the mousedown phase, before any click
    fireEvent.mouseDown(screen.getByTestId('outside-button'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'unset', path: []}))
  })
})
