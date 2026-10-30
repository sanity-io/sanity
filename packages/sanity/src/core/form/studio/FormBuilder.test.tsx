import {type SanityClient} from '@sanity/client'
import {defineType, type ObjectSchemaType} from '@sanity/types'
import {act, render, type RenderResult, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  use,
  useMemo,
  useRef,
  useState,
} from 'react'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {setupVirtualListEnv} from '../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {defineDocumentFieldAction} from '../../config/document/fieldActions/define'
import {type SingleWorkspace} from '../../config/types'
import {useWorkspace} from '../../studio/workspace'
import {EMPTY_ARRAY} from '../../util/empty'
import {usePublishedId} from '../contexts/DocumentIdProvider'
import {VirtualizerScrollInstanceProvider} from '../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {resetFormNodeSuspendedWarningCache} from '../members/common/FormNodeSuspense'
import {createPatchChannel} from '../patch/PatchChannel'
import {type PatchEvent} from '../patch/PatchEvent'
import {useFormState} from '../store/useFormState'
import {type FieldProps} from '../types/fieldProps'
import {type FormDocumentValue} from '../types/formDocumentValue'
import {type InputProps} from '../types/inputProps'
import {type ItemProps} from '../types/itemProps'
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
  onChange?: FormBuilderProps['onChange']
  documentValue?: FormDocumentValue | undefined
  formNodeId?: string
  config?: Partial<SingleWorkspace>
  /** Mounts the form inside {@link PaneStandIn} instead of directly under the provider. */
  pane?: boolean
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

/**
 * The pane the form mounts into, reduced to what matters: a Suspense boundary above the form and
 * an element kept in state that gates the form, the way `DocumentPanel` gates on its portal and
 * scroll elements. The form mounts here on an update, after the pane has committed. If a lazy form
 * component suspended up to this boundary, React would hide the committed pane and detach its
 * refs, the gate would drop the form, the boundary would re-show the pane, and the form would
 * remount and suspend again, until "Maximum update depth exceeded".
 */
function PaneStandIn(props: {children: ReactNode}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <Suspense fallback={<div data-testid="pane-fallback" />}>
      <div ref={setElement} data-testid="pane">
        <VirtualizerScrollInstanceProvider scrollElement={element} containerElement={containerRef}>
          <div ref={containerRef}>{element ? props.children : null}</div>
        </VirtualizerScrollInstanceProvider>
      </div>
    </Suspense>
  )
}

function FormBuilderHarness(props: RenderFormBuilderOptions) {
  const {fieldActions, documentValue, formNodeId, onChange = noop} = props
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
      onChange,
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
    [fieldActions, formNodeId, formState, onChange, patchChannel, schemaType],
  )

  return <FormBuilder {...formBuilderProps} />
}

async function renderFormBuilder(options: RenderFormBuilderOptions = {}) {
  const TestProvider = await createFormBuilderTestProvider(options.config)
  const tree = (next: RenderFormBuilderOptions) => (
    <TestProvider>
      {next.pane ? (
        <PaneStandIn>
          <FormBuilderHarness {...next} />
        </PaneStandIn>
      ) : (
        <FormBuilderHarness {...next} />
      )}
    </TestProvider>
  )
  let view!: RenderResult
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- lazy form components suspend during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    view = render(tree(options))
  })

  return {
    ...view,
    rerenderFormBuilder(next: RenderFormBuilderOptions) {
      view.rerender(tree(next))
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

  // The default comments plugin wraps every field and input in `React.lazy` components, so
  // whichever case mounts a form first suspends on them while their chunks load. Mount one here
  // and wait for its inputs, so no case depends on running after another.
  beforeAll(async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const {unmount} = await renderFormBuilder({documentValue: {_id: 'test', _type: 'test'}})
    await screen.findAllByTestId('string-input', {}, {timeout: 10_000})
    unmount()
    warn.mockRestore()
    mockedUseEnhancedObjectDialog.mockReset()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Suspension warnings are logged once per message, and the cases share a schema
    resetFormNodeSuspendedWarningCache()
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

    const titleField = await screen.findByTestId('field-title', {}, {timeout: 10_000})

    // The field actions menu doesn't render its items until it is opened.
    await userEvent.hover(titleField)
    await userEvent.click(await within(titleField).findByTestId('field-actions-trigger'))

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

  it('suspends the form, not the pane, while a lazy input component loads', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const input = deferredComponent<InputProps>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {form: {components: {input: input.Lazy}}},
      pane: true,
    })

    // The middleware wraps the root input too, so the form's own boundary shows its loading block
    // and no member renders a skeleton; the pane above it stays committed.
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    expect(screen.getByTestId('pane')).toBeInTheDocument()
    expect(screen.queryByTestId('pane-fallback')).not.toBeInTheDocument()
    expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    expect(screen.queryByTestId('field-title')).not.toBeInTheDocument()

    await act(async () => {
      input.resolve(PassThroughInput)
    })

    expect(await screen.findByTestId('string-input', {}, {timeout: 10_000})).toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })

  it('suspends each field, not the form, while a lazy field component loads', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const field = deferredComponent<FieldProps>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {form: {components: {field: field.Lazy}}},
      pane: true,
    })

    expect(
      await screen.findByTestId('custom-field-fallback', {}, {timeout: 10_000}),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    expect(screen.getByTestId('pane')).toBeInTheDocument()
    expect(screen.queryByTestId('pane-fallback')).not.toBeInTheDocument()
    expect(screen.queryByTestId('field-title')).not.toBeInTheDocument()
    const warnings = suspenseWarnings(warn)
    expect(warnings).toHaveLength(1)
    expect(warnings[0][0]).toMatch(
      /^A form component at "title" of a "test" document .*declares no custom field or input component, so it likely comes from a plugin's form\.components/,
    )

    await act(async () => {
      field.resolve(PassThroughField)
    })

    expect(await screen.findByTestId('field-title', {}, {timeout: 10_000})).toHaveTextContent(
      'Title',
    )
    expect(screen.queryByTestId('custom-field-fallback')).not.toBeInTheDocument()
    warn.mockRestore()
  })

  it("keeps the rest of the form editable while a schema type's custom input never settles", async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const pending = new Promise<never>(noop)
    function NeverSettlingInput(props: InputProps) {
      use(pending)
      return props.renderDefault(props)
    }

    const onChange = vi.fn<(event: PatchEvent) => void>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {schema: {types: [customComponentTestType({input: NeverSettlingInput})]}},
      onChange,
      pane: true,
    })

    expect(
      await screen.findByTestId('custom-field-fallback', {}, {timeout: 10_000}),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('field-custom')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pane-fallback')).not.toBeInTheDocument()

    await expectTitleEditable(onChange)

    expectOneSuspenseWarning(
      warn,
      'The custom input component <NeverSettlingInput> at "custom" of a "test" document',
      NeverSettlingInput,
    )
    warn.mockRestore()
  })

  it("keeps the form's loading block while the document type's own custom input suspends", async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const pending = new Promise<never>(noop)
    function NeverSettlingDocumentInput(props: InputProps) {
      use(pending)
      return props.renderDefault(props)
    }

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {
        schema: {
          types: [
            defineType({
              type: 'document',
              name: 'test',
              title: 'Test',
              fields: [{type: 'string', name: 'title', title: 'Title'}],
              components: {input: NeverSettlingDocumentInput},
            }),
          ],
        },
      },
      pane: true,
    })

    expect(await screen.findByTestId('loading-block', {}, {timeout: 10_000})).toBeInTheDocument()
    expect(screen.queryByTestId('custom-field-fallback')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pane-fallback')).not.toBeInTheDocument()
    expect(suspenseWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  it('does not warn about a custom input that declares its own Suspense', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const pending = new Promise<never>(noop)
    function SuspendingPart(): null {
      use(pending)
      return null
    }
    function SelfContainedInput(props: InputProps) {
      return (
        <>
          <Suspense fallback={<div data-testid="own-fallback" />}>
            <SuspendingPart />
          </Suspense>
          {props.renderDefault(props)}
        </>
      )
    }

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {schema: {types: [customComponentTestType({input: SelfContainedInput})]}},
      pane: true,
    })

    const customField = await screen.findByTestId('field-custom', {}, {timeout: 10_000})
    expect(within(customField).getByTestId('own-fallback')).toBeInTheDocument()
    expect(within(customField).getByTestId('string-input')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-field-fallback')).not.toBeInTheDocument()
    expect(suspenseWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  it("lets a custom field's own Suspense catch its custom input suspending", async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const pending = new Promise<never>(noop)
    function NeverSettlingInput(props: InputProps) {
      use(pending)
      return props.renderDefault(props)
    }
    function FieldWithOwnBoundary(props: FieldProps) {
      return (
        <Suspense fallback={<div data-testid="field-own-fallback" />}>
          {props.renderDefault(props)}
        </Suspense>
      )
    }

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {
        schema: {
          types: [
            customComponentTestType({input: NeverSettlingInput, field: FieldWithOwnBoundary}),
          ],
        },
      },
      pane: true,
    })

    expect(
      await screen.findByTestId('field-own-fallback', {}, {timeout: 10_000}),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('custom-field-fallback')).not.toBeInTheDocument()
    expect(suspenseWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  it("keeps the rest of the form editable while a schema type's custom field never settles", async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const pending = new Promise<never>(noop)
    function NeverSettlingField(props: FieldProps) {
      use(pending)
      return props.renderDefault(props)
    }

    const onChange = vi.fn<(event: PatchEvent) => void>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {schema: {types: [customComponentTestType({field: NeverSettlingField})]}},
      onChange,
      pane: true,
    })

    expect(
      await screen.findByTestId('custom-field-fallback', {}, {timeout: 10_000}),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('field-custom')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    await expectTitleEditable(onChange)
    expectOneSuspenseWarning(
      warn,
      'The custom field component <NeverSettlingField> at "custom" of a "test" document',
      NeverSettlingField,
    )
    warn.mockRestore()
  })

  it('does not warn about a custom field that declares its own Suspense', async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const pending = new Promise<never>(noop)
    function SuspendingPart(): null {
      use(pending)
      return null
    }
    function SelfContainedField(props: FieldProps) {
      return (
        <>
          <Suspense fallback={<div data-testid="own-fallback" />}>
            <SuspendingPart />
          </Suspense>
          {props.renderDefault(props)}
        </>
      )
    }

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {schema: {types: [customComponentTestType({field: SelfContainedField})]}},
      pane: true,
    })

    const customField = await screen.findByTestId('field-custom', {}, {timeout: 10_000})
    expect(screen.getByTestId('own-fallback')).toBeInTheDocument()
    expect(within(customField).getByTestId('string-input')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-field-fallback')).not.toBeInTheDocument()
    expect(suspenseWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  describe('array items', () => {
    setupVirtualListEnv()

    const documentValue = {
      _id: 'test',
      _type: 'test',
      reviews: [{_type: 'review', _key: 'first', title: 'First review'}],
    }

    it("keeps the rest of the form editable while a schema type's custom item never settles", async () => {
      mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
      const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
      const pending = new Promise<never>(noop)
      function NeverSettlingItem(props: ItemProps) {
        use(pending)
        return props.renderDefault(props)
      }

      const onChange = vi.fn<(event: PatchEvent) => void>()

      await renderFormBuilder({
        documentValue,
        config: {schema: {types: [customComponentTestType({item: NeverSettlingItem})]}},
        onChange,
        pane: true,
      })

      const reviews = await screen.findByTestId('field-reviews', {}, {timeout: 10_000})
      expect(
        await within(reviews).findByTestId('custom-item-fallback', {}, {timeout: 10_000}),
      ).toBeInTheDocument()
      expect(within(reviews).queryByTestId('array-item-menu-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
      await expectTitleEditable(onChange)
      expectOneSuspenseWarning(
        warn,
        'The custom item component <NeverSettlingItem> at "reviews[_key=="first"]" of a "test" document',
        NeverSettlingItem,
      )
      warn.mockRestore()
    })

    it('does not warn about a custom item that declares its own Suspense', async () => {
      mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
      const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
      const pending = new Promise<never>(noop)
      function SuspendingPart(): null {
        use(pending)
        return null
      }
      function SelfContainedItem(props: ItemProps) {
        return (
          <>
            <Suspense fallback={<div data-testid="own-fallback" />}>
              <SuspendingPart />
            </Suspense>
            {props.renderDefault(props)}
          </>
        )
      }

      await renderFormBuilder({
        documentValue,
        config: {schema: {types: [customComponentTestType({item: SelfContainedItem})]}},
        pane: true,
      })

      const reviews = await screen.findByTestId('field-reviews', {}, {timeout: 10_000})
      expect(
        await within(reviews).findByTestId('array-item-menu-button', {}, {timeout: 10_000}),
      ).toBeInTheDocument()
      expect(within(reviews).getByTestId('own-fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('custom-item-fallback')).not.toBeInTheDocument()
      expect(suspenseWarnings(warn)).toHaveLength(0)
      warn.mockRestore()
    })
  })

  it("replaces a schema type's custom input fallback once the input loads", async () => {
    mockedUseEnhancedObjectDialog.mockImplementation(() => ({enabled: false}))
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop)
    const input = deferredComponent<InputProps>()

    await renderFormBuilder({
      documentValue: {_id: 'test', _type: 'test'},
      config: {schema: {types: [customComponentTestType({input: input.Lazy})]}},
      pane: true,
    })

    expect(
      await screen.findByTestId('custom-field-fallback', {}, {timeout: 10_000}),
    ).toBeInTheDocument()

    await act(async () => {
      input.resolve(PassThroughInput)
    })

    const customField = await screen.findByTestId('field-custom', {}, {timeout: 10_000})
    expect(within(customField).getByTestId('string-input')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-field-fallback')).not.toBeInTheDocument()
    warn.mockRestore()
  })
})

function customComponentTestType(components: {
  input?: ComponentType<InputProps>
  field?: ComponentType<FieldProps>
  item?: ComponentType<ItemProps>
}) {
  return defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      {type: 'string', name: 'title', title: 'Title'},
      {
        type: 'string',
        name: 'custom',
        title: 'Custom',
        components: {input: components.input, field: components.field},
      },
      {
        type: 'array',
        name: 'reviews',
        title: 'Reviews',
        of: [
          {
            type: 'object',
            name: 'review',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            components: {item: components.item},
          },
        ],
      },
    ],
  })
}

function expectOneSuspenseWarning(warn: Mock, prefix: string, component: unknown) {
  const warnings = warn.mock.calls.filter(([message]) => String(message).startsWith(prefix))
  expect(warnings).toHaveLength(1)
  expect(warnings[0][1]).toBe(component)
}

/** Editing a sibling field is what creates a new document, so it must reach the form. */
async function expectTitleEditable(onChange: Mock<(event: PatchEvent) => void>) {
  await userEvent.type(within(screen.getByTestId('field-title')).getByRole('textbox'), 'x')
  const patchedPaths = onChange.mock.calls.flatMap(([event]) =>
    event.patches.map((patch) => patch.path),
  )
  expect(patchedPaths).toContainEqual(['title'])
}

function suspenseWarnings(warn: Mock) {
  return warn.mock.calls.filter(([message]) =>
    /^(The custom |A form component )/.test(String(message)),
  )
}

function removeClasses(html: string) {
  return html.replace(/\s+class=".*?"|\s+data-testid="string-input"/g, '')
}
