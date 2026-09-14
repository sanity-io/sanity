import {type SanityClient} from '@sanity/client'
import {defineType, type ObjectSchemaType} from '@sanity/types'
import {act, render, type RenderResult, screen, waitFor, within} from '@testing-library/react'
import {type ComponentType, lazy, useMemo, useState} from 'react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {defineDocumentFieldAction} from '../../config/document/fieldActions/define'
import {type SingleWorkspace} from '../../config/types'
import {useWorkspace} from '../../studio/workspace'
import {EMPTY_ARRAY} from '../../util/empty'
import {usePublishedId} from '../contexts/DocumentIdProvider'
import {createPatchChannel} from '../patch/PatchChannel'
import {useFormState} from '../store/useFormState'
import {type FieldProps} from '../types/fieldProps'
import {type FormDocumentValue} from '../types/formDocumentValue'
import {type InputProps} from '../types/inputProps'
import {FormBuilder, type FormBuilderProps} from './FormBuilder'
import {FormProvider} from './FormProvider'
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

function noop() {
  return undefined
}

interface RenderFormBuilderOptions {
  fieldActions?: FormBuilderProps['__internal_fieldActions']
  documentValue?: FormDocumentValue | undefined
  formNodeId?: string
  config?: Partial<SingleWorkspace>
}

async function createFormBuilderTestProvider(config?: Partial<SingleWorkspace>) {
  const client = createMockSanityClient() as unknown as SanityClient
  return createTestProvider({
    client,
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {types: schemaTypes},
      ...config,
    },
  })
}

function deferredComponent<Props>() {
  let resolve!: (component: ComponentType<Props>) => void
  const loaded = new Promise<{default: ComponentType<Props>}>((resolveModule) => {
    resolve = (component) => resolveModule({default: component})
  })
  return {Lazy: lazy(() => loaded), resolve}
}

function PassThroughField(props: FieldProps) {
  return props.renderDefault(props)
}

function PassThroughInput(props: InputProps) {
  return props.renderDefault(props)
}

function FormBuilderHarness(props: RenderFormBuilderOptions) {
  const {fieldActions, documentValue, formNodeId} = props
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
    focusPath: EMPTY_ARRAY,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    fieldGroupState: undefined,
    openPath: EMPTY_ARRAY,
    presence: [],
    validation: [],
  })

  // @ts-expect-error -- pre-existing, fix later
  const formBuilderProps: FormBuilderProps = useMemo(
    () => ({
      __internal_fieldActions: fieldActions,
      __internal_patchChannel: patchChannel,
      changesOpen: false,
      changed: false,
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focused: formState?.focused,
      focusPath: formState?.focusPath || EMPTY_ARRAY,
      groups: formState?.groups || EMPTY_ARRAY,
      id: formNodeId ?? formState?.id ?? '',
      level: formState?.level || 0,
      members: formState?.members || EMPTY_ARRAY,
      onChange: noop,
      onFieldGroupSelect: noop,
      onPathBlur: noop,
      onPathFocus: noop,
      onPathOpen: noop,
      onSelectFieldGroup: noop,
      onSetFieldSetCollapsed: noop,
      onSetPathCollapsed: noop,
      path: EMPTY_ARRAY,
      presence: EMPTY_ARRAY,
      schemaType: formState?.schemaType || schemaType,
      validation: EMPTY_ARRAY,
      value: formState?.value as FormDocumentValue,
    }),
    [fieldActions, formNodeId, formState, patchChannel, schemaType],
  )

  return <FormBuilder {...formBuilderProps} />
}

async function renderFormBuilder(options: RenderFormBuilderOptions = {}) {
  const TestProvider = await createFormBuilderTestProvider(options.config)
  let view!: RenderResult
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- lazy form components suspend during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    view = render(
      <TestProvider>
        <FormBuilderHarness {...options} />
      </TestProvider>,
    )
  })

  return {
    ...view,
    rerenderFormBuilder(next: RenderFormBuilderOptions) {
      view.rerender(
        <TestProvider>
          <FormBuilderHarness {...next} />
        </TestProvider>,
      )
    },
  }
}

function InnerPublishedId() {
  const documentId = usePublishedId()
  return <span data-testid="nested-document-id">{documentId}</span>
}

function formProviderProps(schemaType: ObjectSchemaType, documentId?: string) {
  return {
    __internal_patchChannel: createPatchChannel(),
    changesOpen: false,
    collapsedFieldSets: undefined,
    collapsedPaths: undefined,
    documentId,
    focusPath: EMPTY_ARRAY,
    focused: undefined,
    groups: [],
    id: 'root',
    onChange: noop,
    onFieldGroupSelect: noop,
    onPathBlur: noop,
    onPathFocus: noop,
    onPathOpen: noop,
    onSetFieldSetCollapsed: noop,
    onSetPathCollapsed: noop,
    presence: [],
    readOnly: false,
    schemaType,
    validation: [],
  }
}

describe('FormBuilder', () => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const mockedUseEnhancedObjectDialog = useEnhancedObjectDialog as Mock

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a studio form (without tree editing dialog)', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))

    await renderFormBuilder({documentValue: {_id: 'test', _type: 'test'}})

    const titleField = await screen.findByTestId('field-title')

    expect(removeClasses(titleField.outerHTML)).toMatchSnapshot()
  })

  it('should render a studio form (with tree editing dialog)', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: true}))

    await renderFormBuilder({documentValue: {_id: 'test', _type: 'test'}})

    const titleField = await screen.findByTestId('field-title')

    expect(removeClasses(titleField.outerHTML)).toMatchSnapshot()
  })

  it('passes the published document id to field-level actions instead of the form-node id', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: true}))

    const captured = {documentId: undefined as string | undefined}
    const probeFieldAction = defineDocumentFieldAction({
      name: 'probeDocumentId',
      useAction({documentId}) {
        captured.documentId = documentId
        return useMemo(
          () => ({
            type: 'action' as const,
            onAction: noop,
            title: documentId,
          }),
          [documentId],
        )
      },
    })

    await renderFormBuilder({
      fieldActions: [probeFieldAction],
      documentValue: {_id: 'drafts.doc-1', _type: 'test'},
      formNodeId: 'root',
    })

    await screen.findByTestId('field-title', {}, {timeout: 10_000})

    await waitFor(
      () => {
        expect(captured.documentId).toBe('doc-1')
        expect(screen.getByText('doc-1')).toBeInTheDocument()
      },
      {timeout: 10_000},
    )
    expect(captured.documentId).not.toBe('root')
    expect(screen.queryByText('root')).not.toBeInTheDocument()
  })

  it('lets a nested FormProvider documentId win over the ancestor', async () => {
    const TestProvider = await createFormBuilderTestProvider()

    function NestedFormProviders() {
      const {schema} = useWorkspace()
      const schemaType = schema.get('test')

      if (!schemaType || schemaType.jsonType !== 'object') {
        throw new Error('missing object schema type')
      }

      return (
        <FormProvider {...formProviderProps(schemaType, 'doc-A')}>
          <FormProvider {...formProviderProps(schemaType, 'doc-B')} id="nested">
            <InnerPublishedId />
          </FormProvider>
        </FormProvider>
      )
    }

    render(
      <TestProvider>
        <NestedFormProviders />
      </TestProvider>,
    )

    expect(screen.getByTestId('nested-document-id')).toHaveTextContent('doc-B')
  })

  it('does not remount the form when value._id becomes defined', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: true}))

    const {rerenderFormBuilder} = await renderFormBuilder({
      documentValue: undefined,
      formNodeId: 'root',
    })

    const input = await screen.findByTestId('string-input')
    input.focus()
    expect(input).toHaveFocus()

    rerenderFormBuilder({
      documentValue: {_id: 'doc-1', _type: 'test'},
      formNodeId: 'root',
    })

    const inputAfterId = await screen.findByTestId('string-input')
    expect(inputAfterId).toBe(input)
    expect(inputAfterId).toHaveFocus()
  })

  it('shows one field placeholder per field while a lazy input component loads at the root', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const input = deferredComponent<InputProps>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {form: {components: {input: input.Lazy}}},
    })

    const rootSkeleton = screen.getByTestId('form-object-input-skeleton')
    expect(within(rootSkeleton).getAllByTestId('form-field-skeleton')).toHaveLength(1)
    expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    expect(screen.queryByTestId('field-title')).not.toBeInTheDocument()

    await act(async () => {
      input.resolve(PassThroughInput)
    })

    expect(await screen.findByTestId('string-input', {}, {timeout: 10_000})).toBeInTheDocument()
    expect(screen.queryByTestId('form-object-input-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('form-field-skeleton')).not.toBeInTheDocument()
  })

  it('shows a field placeholder in the field row while a lazy field component loads', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const field = deferredComponent<FieldProps>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {form: {components: {field: field.Lazy}}},
    })

    await waitFor(
      () => expect(screen.queryByTestId('form-object-input-skeleton')).not.toBeInTheDocument(),
      {timeout: 10_000},
    )
    expect(screen.getAllByTestId('form-field-skeleton')).toHaveLength(1)
    expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    expect(screen.queryByTestId('field-title')).not.toBeInTheDocument()

    await act(async () => {
      field.resolve(PassThroughField)
    })

    expect(await screen.findByTestId('field-title', {}, {timeout: 10_000})).toHaveTextContent(
      'Title',
    )
    expect(screen.queryByTestId('form-field-skeleton')).not.toBeInTheDocument()
  })

  it('shows an input placeholder inside the field while a lazy schema input component loads', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const input = deferredComponent<InputProps>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {
        schema: {
          types: [
            defineType({
              type: 'document',
              name: 'test',
              title: 'Test',
              fields: [
                {type: 'string', name: 'title', title: 'Title', components: {input: input.Lazy}},
              ],
            }),
          ],
        },
      },
    })

    const titleField = await screen.findByTestId('field-title', {}, {timeout: 10_000})
    expect(within(titleField).getByTestId('form-input-skeleton')).toBeInTheDocument()
    expect(screen.getAllByTestId('form-input-skeleton')).toHaveLength(1)
    expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    expect(screen.queryByTestId('string-input')).not.toBeInTheDocument()

    await act(async () => {
      input.resolve(PassThroughInput)
    })

    expect(await screen.findByTestId('string-input')).toBeInTheDocument()
    expect(screen.queryByTestId('form-input-skeleton')).not.toBeInTheDocument()
  })
})

function removeClasses(html: string) {
  return html.replace(/\s+class=".*?"|\s+data-testid="string-input"/g, '')
}
