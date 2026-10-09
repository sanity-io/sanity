import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type Reference, type ReferenceSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useSchema} from '../../../../hooks/useSchema'
import {FormValueProvider} from '../../../contexts/FormValue'
import {createPatchChannel} from '../../../patch/PatchChannel'
import {
  type EditReferenceLinkComponentProps,
  ReferenceInputOptionsProvider,
} from '../../../studio/contexts/ReferenceInputOptions'
import {FormProvider} from '../../../studio/FormProvider'
import {type FormDocumentValue} from '../../../types/formDocumentValue'
import {ReferenceInput} from '../ReferenceInput'
import {type ReferenceInputProps} from '../types'

vi.mock('../../../studio/inputs/client-adapters/reference', () => ({
  getReferenceInfo: () =>
    of({
      id: 'actor-1',
      type: 'actor',
      isPublished: true,
      availability: {available: true, reason: 'READABLE'},
      preview: {
        snapshot: {title: 'Actor One'},
        original: {title: 'Actor One'},
      },
    }),
}))

const schema = Schema.compile({
  name: 'default',
  types: [
    {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
    {name: 'actorReference', type: 'reference', to: [{type: 'actor'}]},
  ],
})

const documentValue: FormDocumentValue = {_id: 'test', _type: 'test'}

const REFERENCE_PATH = ['sections', {_key: 'item-0'}, 'actorRef']
const TEMPLATE = {id: 'actor', params: {name: 'Actor One'}}
const STRENGTHEN_ON_PUBLISH_VALUE: Reference = {
  _type: 'reference',
  _ref: 'actor-1',
  _weak: true,
  _strengthenOnPublish: {type: 'actor', template: TEMPLATE},
}

const editReferenceLinkRenders = vi.fn<(props: EditReferenceLinkComponentProps) => void>()

function RecordingEditReferenceLink(props: EditReferenceLinkComponentProps) {
  const {children, documentId, documentType, parentRefPath, template} = props
  editReferenceLinkRenders({children, documentId, documentType, parentRefPath, template})
  return <a data-testid="custom-edit-reference-link">{children}</a>
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

async function renderReferencePreview(value: Reference) {
  const client = createMockSanityClientAsClient()
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

  const props: ReferenceInputProps = {
    __unstable_computeDiff: vi.fn(),
    changed: false,
    changedFromBaseVariant: false,
    createOptions: [],
    displayInlineChanges: false,
    elementProps: {
      'aria-describedby': undefined,
      'id': 'ref-input',
      'onBlur': vi.fn(),
      'onFocus': vi.fn(),
      'ref': {current: null},
      'style': {},
    },
    // No focus on `_ref`, so the input renders the preview (and its edit link) instead of the
    // autocomplete.
    focusPath: [],
    focused: false,
    getReferenceInfo: vi.fn(),
    groups: [],
    hasBaseVariant: false,
    hasUpstreamVersion: false,
    id: 'ref-input',
    level: 1,
    liveEdit: false,
    members: [],
    onChange: vi.fn(),
    onEditReference: vi.fn(),
    onFieldClose: vi.fn(),
    onFieldCollapse: vi.fn(),
    onFieldExpand: vi.fn(),
    onFieldGroupSelect: vi.fn(),
    onFieldOpen: vi.fn(),
    onFieldSetCollapse: vi.fn(),
    onFieldSetExpand: vi.fn(),
    onPathFocus: vi.fn(),
    onSearch: () => of([]),
    path: REFERENCE_PATH,
    presence: [],
    renderDefault: () => <></>,
    renderField: () => null,
    renderInput: () => null,
    renderItem: () => null,
    renderPreview: () => null,
    schemaType: schema.get('actorReference') as ReferenceSchemaType,
    validation: [],
    value,
  }

  render(
    <TestProvider>
      <FormHarness>
        <FormValueProvider value={documentValue}>
          <ReferenceInputOptionsProvider EditReferenceLinkComponent={RecordingEditReferenceLink}>
            <ReferenceInput {...props} />
          </ReferenceInputOptionsProvider>
        </FormValueProvider>
      </FormHarness>
    </TestProvider>,
  )
}

describe('EditReferenceLink', () => {
  it('forwards the reference path and strengthen-on-publish template to the configured link component', async () => {
    await renderReferencePreview(STRENGTHEN_ON_PUBLISH_VALUE)

    const link = await screen.findByTestId('custom-edit-reference-link')
    expect(link).toBeInTheDocument()

    const lastRender = editReferenceLinkRenders.mock.lastCall?.[0]
    expect(lastRender).toMatchObject({
      documentId: 'actor-1',
      documentType: 'actor',
      parentRefPath: REFERENCE_PATH,
      template: TEMPLATE,
    })
  })

  it('leaves the template undefined when the reference is not pending strengthening', async () => {
    await renderReferencePreview({_type: 'reference', _ref: 'actor-1'})

    await screen.findByTestId('custom-edit-reference-link')

    const lastRender = editReferenceLinkRenders.mock.lastCall?.[0]
    expect(lastRender).toMatchObject({
      documentId: 'actor-1',
      documentType: 'actor',
      parentRefPath: REFERENCE_PATH,
    })
    expect(lastRender?.template).toBeUndefined()
  })
})
