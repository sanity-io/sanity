import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type ReferenceSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {PerspectiveContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useSchema} from '../../../../hooks/useSchema'
import {perspectiveContextValueMock} from '../../../../perspective/__mocks__/usePerspective.mock'
import {type PerspectiveContextValue} from '../../../../perspective/types'
import {FormValueProvider} from '../../../contexts/FormValue'
import {createPatchChannel} from '../../../patch/PatchChannel'
import {type FormPatch, type FormSetPatch} from '../../../patch/types'
import {FormProvider} from '../../../studio/FormProvider'
import {type FormDocumentValue} from '../../../types/formDocumentValue'
import {ReferenceInput} from '../ReferenceInput'
import {type CreateReferenceOption, type ReferenceInputProps} from '../types'

const CREATE_ACTOR: CreateReferenceOption = {
  id: 'actor',
  title: 'Actor',
  type: 'actor',
  template: {id: 'actor', params: {}},
  permission: {granted: true, reason: 'allowed'},
}

const schema = Schema.compile({
  name: 'default',
  types: [
    {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
    {name: 'strongReference', type: 'reference', to: [{type: 'actor'}]},
    {name: 'weakReference', type: 'reference', weak: true, to: [{type: 'actor'}]},
  ],
})

const documentValue: FormDocumentValue = {_id: 'test', _type: 'test'}

function referenceSchemaType(name: 'strongReference' | 'weakReference'): ReferenceSchemaType {
  const schemaType = schema.get(name)
  if (!schemaType) {
    throw new Error(`Missing schema type: ${name}`)
  }
  return schemaType as ReferenceSchemaType
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

const DRAFTS_PERSPECTIVE: PerspectiveContextValue = {
  ...perspectiveContextValueMock,
  selectedReleaseId: undefined,
  selectedPerspectiveName: undefined,
  selectedPerspective: 'drafts',
}

const RELEASE_PERSPECTIVE: PerspectiveContextValue = {
  ...perspectiveContextValueMock,
  selectedReleaseId: 'rSummer',
  selectedPerspectiveName: 'rSummer',
  selectedPerspective: 'rSummer',
}

async function createReferenceInline(options: {
  schemaTypeName: 'strongReference' | 'weakReference'
  perspective: PerspectiveContextValue
}) {
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
  const onEditReference = vi.fn()
  const schemaType = referenceSchemaType(options.schemaTypeName)

  const props = {
    changed: false,
    createOptions: [CREATE_ACTOR],
    editReferenceLinkComponent: () => null,
    elementProps: {
      id: 'ref-input',
      onBlur: vi.fn(),
      onFocus: vi.fn(),
      ref: {current: null},
    },
    focusPath: [],
    focused: false,
    getReferenceInfo: () => of(null),
    id: 'ref-input',
    level: 1,
    liveEdit: false,
    onChange,
    onEditReference,
    onPathFocus: vi.fn(),
    onSearch: () => of([]),
    path: ['actorRef'],
    presence: [],
    renderPreview: () => null,
    schemaType,
    validation: [],
    value: undefined,
  } as unknown as ReferenceInputProps

  render(
    <TestProvider>
      <FormHarness>
        <FormValueProvider value={documentValue}>
          <PerspectiveContext.Provider value={options.perspective}>
            <ReferenceInput {...props} />
          </PerspectiveContext.Provider>
        </FormValueProvider>
      </FormHarness>
    </TestProvider>,
  )

  await userEvent.click(screen.getByRole('button', {name: 'Create'}))

  expect(onChange).toHaveBeenCalledTimes(1)
  const patches = onChange.mock.calls[0][0] as FormPatch[]

  return {onEditReference, patches, schemaType}
}

function setPatch(patches: FormPatch[], path: string[]): FormSetPatch | undefined {
  return patches.find(
    (patch): patch is FormSetPatch =>
      patch.type === 'set' &&
      patch.path.length === path.length &&
      patch.path.every((segment, index) => segment === path[index]),
  )
}

describe('creating a referenced document inline', () => {
  it('omits _weak for a strong reference inside a release so preflight still treats it as strong', async () => {
    const {onEditReference, patches, schemaType} = await createReferenceInline({
      schemaTypeName: 'strongReference',
      perspective: RELEASE_PERSPECTIVE,
    })

    expect(setPatch(patches, ['_weak'])).toBeUndefined()
    expect(setPatch(patches, ['_strengthenOnPublish'])?.value).toEqual({
      type: 'actor',
      weak: schemaType.weak,
      template: CREATE_ACTOR.template,
    })
    expect(onEditReference).toHaveBeenCalledWith(
      expect.objectContaining({type: 'actor', version: 'rSummer'}),
    )
  })

  it('writes _weak for a weak reference inside a release', async () => {
    const {onEditReference, patches} = await createReferenceInline({
      schemaTypeName: 'weakReference',
      perspective: RELEASE_PERSPECTIVE,
    })

    expect(setPatch(patches, ['_weak'])?.value).toBe(true)
    expect(setPatch(patches, ['_strengthenOnPublish'])?.value).toEqual(
      expect.objectContaining({type: 'actor', weak: true, template: CREATE_ACTOR.template}),
    )
    expect(onEditReference).toHaveBeenCalledWith(
      expect.objectContaining({type: 'actor', version: 'rSummer'}),
    )
  })

  it('writes _weak for a strong reference outside a release so it can strengthen on publish', async () => {
    const {onEditReference, patches} = await createReferenceInline({
      schemaTypeName: 'strongReference',
      perspective: DRAFTS_PERSPECTIVE,
    })

    expect(setPatch(patches, ['_weak'])?.value).toBe(true)
    expect(onEditReference).toHaveBeenCalledWith(
      expect.objectContaining({type: 'actor', version: undefined}),
    )
  })
})
