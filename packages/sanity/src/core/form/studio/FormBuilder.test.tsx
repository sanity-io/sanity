import {type SanityClient} from '@sanity/client'
import {defineType, type Path} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {useMemo, useState} from 'react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {defineDocumentFieldAction} from '../../config/document/fieldActions/define'
import {useWorkspace} from '../../studio/workspace'
import {EMPTY_ARRAY} from '../../util/empty'
import {createPatchChannel} from '../patch/PatchChannel'
import {useFormState} from '../store/useFormState'
import {type FormDocumentValue} from '../types/formDocumentValue'
import {FormBuilder, type FormBuilderProps} from './FormBuilder'
import {useEnhancedObjectDialog} from './tree-editing/context/enabled/useEnhancedObjectDialog'

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      {
        type: 'string',
        name: 'title',
        title: 'Title',
      },
    ],
  }),
]

vi.mock('./tree-editing/context/enabled/useEnhancedObjectDialog')

describe('FormBuilder', () => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const mockedUseEnhancedObjectDialog = useEnhancedObjectDialog as Mock

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a studio form (without tree editing dialog)', async () => {
    const client = createMockSanityClient() as unknown as SanityClient
    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema: {types: schemaTypes},
      },
    })
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))

    const focusPath: Path = []
    const openPath: Path = []
    const documentValue = {_id: 'test', _type: 'test'}

    const onChange = vi.fn()
    const onFieldGroupSelect = vi.fn()
    const onPathBlur = vi.fn()
    const onPathFocus = vi.fn()
    const onPathOpen = vi.fn()
    const onSelectFieldGroup = vi.fn()
    const onSetFieldSetCollapsed = vi.fn()
    const onSetPathCollapsed = vi.fn()

    function TestForm() {
      const {schema} = useWorkspace()
      const schemaType = schema.get('test')

      if (!schemaType) {
        throw new Error('missing schema type')
      }

      if (schemaType.jsonType !== 'object') {
        throw new Error('schema type is not an object')
      }

      const [patchChannel] = useState(() => createPatchChannel())

      // @ts-expect-error -- pre-existing, fix later
      const formState = useFormState({
        schemaType,
        documentValue,
        comparisonValue: documentValue,
        focusPath,
        collapsedPaths: undefined,
        collapsedFieldSets: undefined,
        fieldGroupState: undefined,
        openPath,
        presence: [],
        validation: [],
      })

      // @ts-expect-error -- pre-existing, fix later
      const formBuilderProps: FormBuilderProps = useMemo(
        () => ({
          __internal_patchChannel: patchChannel,
          changesOpen: false,
          changed: false,
          collapsedFieldSets: undefined,
          collapsedPaths: undefined,
          focused: formState?.focused,
          focusPath: formState?.focusPath || EMPTY_ARRAY,
          groups: formState?.groups || EMPTY_ARRAY,
          id: formState?.id || '',
          level: formState?.level || 0,
          members: formState?.members || EMPTY_ARRAY,
          onChange,
          onFieldGroupSelect,
          onPathBlur,
          onPathFocus,
          onPathOpen,
          onSelectFieldGroup,
          onSetFieldSetCollapsed,
          onSetPathCollapsed,
          path: EMPTY_ARRAY,
          presence: EMPTY_ARRAY,
          schemaType: formState?.schemaType || schemaType,
          validation: EMPTY_ARRAY,
          value: formState?.value as FormDocumentValue,
        }),
        [formState, patchChannel, schemaType],
      )

      return <FormBuilder {...formBuilderProps} />
    }

    const result = render(
      <TestProvider>
        <TestForm />
      </TestProvider>,
    )

    const titleField = await screen.findByTestId('field-title')

    expect(removeClasses(titleField.outerHTML)).toMatchSnapshot()
  })

  it('should render a studio form (with tree editing dialog)', async () => {
    const client = createMockSanityClient() as unknown as SanityClient
    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema: {types: schemaTypes},
      },
    })
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: true}))

    const focusPath: Path = []
    const openPath: Path = []
    const documentValue = {_id: 'test', _type: 'test'}

    const onChange = vi.fn()
    const onFieldGroupSelect = vi.fn()
    const onPathBlur = vi.fn()
    const onPathFocus = vi.fn()
    const onPathOpen = vi.fn()
    const onSelectFieldGroup = vi.fn()
    const onSetFieldSetCollapsed = vi.fn()
    const onSetPathCollapsed = vi.fn()

    function TestForm() {
      const {schema} = useWorkspace()
      const schemaType = schema.get('test')

      if (!schemaType) {
        throw new Error('missing schema type')
      }

      if (schemaType.jsonType !== 'object') {
        throw new Error('schema type is not an object')
      }

      const [patchChannel] = useState(() => createPatchChannel())

      // @ts-expect-error -- pre-existing, fix later
      const formState = useFormState({
        schemaType,
        documentValue,
        comparisonValue: documentValue,
        focusPath,
        collapsedPaths: undefined,
        collapsedFieldSets: undefined,
        fieldGroupState: undefined,
        openPath,
        presence: [],
        validation: [],
      })

      // @ts-expect-error -- pre-existing, fix later
      const formBuilderProps: FormBuilderProps = useMemo(
        () => ({
          __internal_patchChannel: patchChannel,
          changesOpen: false,
          changed: false,
          collapsedFieldSets: undefined,
          collapsedPaths: undefined,
          focused: formState?.focused,
          focusPath: formState?.focusPath || EMPTY_ARRAY,
          groups: formState?.groups || EMPTY_ARRAY,
          id: formState?.id || '',
          level: formState?.level || 0,
          members: formState?.members || EMPTY_ARRAY,
          onChange,
          onFieldGroupSelect,
          onPathBlur,
          onPathFocus,
          onPathOpen,
          onSelectFieldGroup,
          onSetFieldSetCollapsed,
          onSetPathCollapsed,
          path: EMPTY_ARRAY,
          presence: EMPTY_ARRAY,
          schemaType: formState?.schemaType || schemaType,
          validation: EMPTY_ARRAY,
          value: formState?.value as FormDocumentValue,
        }),
        [formState, patchChannel, schemaType],
      )

      return <FormBuilder {...formBuilderProps} />
    }

    const result = render(
      <TestProvider>
        <TestForm />
      </TestProvider>,
    )

    const titleField = await screen.findByTestId('field-title')

    expect(removeClasses(titleField.outerHTML)).toMatchSnapshot()
  })

  it('passes the published document id to field-level actions instead of the form-node id', async () => {
    const client = createMockSanityClient() as unknown as SanityClient
    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema: {types: schemaTypes},
      },
    })
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))

    let capturedDocumentId: string | undefined
    const probeFieldAction = defineDocumentFieldAction({
      name: 'probeDocumentId',
      useAction({documentId}) {
        capturedDocumentId = documentId
        return {
          type: 'action',
          onAction: () => undefined,
          title: documentId,
        }
      },
    })

    const focusPath: Path = []
    const openPath: Path = []
    const documentValue = {_id: 'drafts.doc-1', _type: 'test'}

    const onChange = vi.fn()
    const onFieldGroupSelect = vi.fn()
    const onPathBlur = vi.fn()
    const onPathFocus = vi.fn()
    const onPathOpen = vi.fn()
    const onSelectFieldGroup = vi.fn()
    const onSetFieldSetCollapsed = vi.fn()
    const onSetPathCollapsed = vi.fn()

    function TestForm() {
      const {schema} = useWorkspace()
      const schemaType = schema.get('test')

      if (!schemaType) {
        throw new Error('missing schema type')
      }

      if (schemaType.jsonType !== 'object') {
        throw new Error('schema type is not an object')
      }

      const [patchChannel] = useState(() => createPatchChannel())

      // @ts-expect-error -- pre-existing, fix later
      const formState = useFormState({
        schemaType,
        documentValue,
        comparisonValue: documentValue,
        focusPath,
        collapsedPaths: undefined,
        collapsedFieldSets: undefined,
        fieldGroupState: undefined,
        openPath,
        presence: [],
        validation: [],
      })

      // @ts-expect-error -- pre-existing, fix later
      const formBuilderProps: FormBuilderProps = useMemo(
        () => ({
          __internal_fieldActions: [probeFieldAction],
          __internal_patchChannel: patchChannel,
          changesOpen: false,
          changed: false,
          collapsedFieldSets: undefined,
          collapsedPaths: undefined,
          focused: formState?.focused,
          focusPath: formState?.focusPath || EMPTY_ARRAY,
          groups: formState?.groups || EMPTY_ARRAY,
          id: 'root',
          level: formState?.level || 0,
          members: formState?.members || EMPTY_ARRAY,
          onChange,
          onFieldGroupSelect,
          onPathBlur,
          onPathFocus,
          onPathOpen,
          onSelectFieldGroup,
          onSetFieldSetCollapsed,
          onSetPathCollapsed,
          path: EMPTY_ARRAY,
          presence: EMPTY_ARRAY,
          schemaType: formState?.schemaType || schemaType,
          validation: EMPTY_ARRAY,
          value: formState?.value as FormDocumentValue,
        }),
        [formState, patchChannel, schemaType],
      )

      return <FormBuilder {...formBuilderProps} />
    }

    render(
      <TestProvider>
        <TestForm />
      </TestProvider>,
    )

    await screen.findByTestId('field-title')

    await waitFor(() => {
      expect(capturedDocumentId).toBe('doc-1')
      expect(screen.getByText('doc-1')).toBeInTheDocument()
    })
    expect(capturedDocumentId).not.toBe('root')
    expect(screen.queryByText('root')).not.toBeInTheDocument()
  })
})

function removeClasses(html: string) {
  return html.replace(/\s+class=".*?"|\s+data-testid="string-input"/g, '')
}
