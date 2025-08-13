import {type SanityClient} from '@sanity/client'
import {
  defineType,
  type FieldDefinition,
  type FormNodeValidation,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {render} from '@testing-library/react'
import {type FocusEvent, type RefObject} from 'react'
import {type MockInstance, vi} from 'vitest'

import {createPatchChannel} from '../../src/core/form/patch/PatchChannel'
import {EMPTY_ARRAY} from '../../src/core/util/empty'
import type {FieldMember} from '../../src/core/form/store/types/members'
import type {FormNodePresence} from '../../src/core/presence/types'
import {FormProvider} from '../../src/core/form/studio/FormProvider'
import {type FormState, useFormState} from '../../src/core/form/store/useFormState'
import type {PatchArg} from '../../src/core/form/patch/types'
import type {PatchEvent} from '../../src/core/form/patch/PatchEvent'
import {useSchema} from '../../src/core/hooks/useSchema'
import {DocumentFieldActionsProvider} from '../../src/core/form/studio/contexts/DocumentFieldActions'
import {createMockSanityClient} from '../mocks/mockSanityClient'
import {createTestProvider} from '../testUtils/TestProvider'
import {type TestRenderProps} from './types'

export interface TestRenderInputContext {
  client: SanityClient
  formState: FormState
}

export interface TestRenderInputProps<ElementProps> {
  focusPath: Path
  id: string
  level: number
  onBlur: (event: FocusEvent) => void
  onChange: (path: PatchArg | PatchEvent) => void
  onFocus: (event: FocusEvent) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  presence: FormNodePresence[]
  readOnly: boolean | undefined
  schemaType: SchemaType
  validation: FormNodeValidation[]
  value: unknown
  elementProps: ElementProps
}

export type TestRenderInputCallback<ElementProps> = (
  inputProps: TestRenderInputProps<ElementProps>,
  context: TestRenderInputContext,
) => React.JSX.Element

export type RenderInputResult = {
  container: Element
  focusRef: RefObject<HTMLElement>
  onBlur: MockInstance<(event: FocusEvent) => void>
  onFocus: MockInstance<(event: FocusEvent) => void>
  onChange: MockInstance<(path: PatchArg | PatchEvent) => void>
  onNativeChange: MockInstance<(event: FocusEvent) => void>
  onPathBlur: MockInstance<(path: Path) => void>
  onPathFocus: MockInstance<(path: Path) => void>
  onFieldGroupSelect: MockInstance<(field: string) => void>
  onSetFieldSetCollapsed: MockInstance<(field: string, collapsed: boolean) => void>
  result: ReturnType<typeof render>
}
export async function renderInput<ElementProps>(props: {
  fieldDefinition: FieldDefinition
  props?: TestRenderProps
  render: TestRenderInputCallback<ElementProps>
}): Promise<RenderInputResult> {
  const {render: initialRender, fieldDefinition, props: initialTestProps} = props
  const name = fieldDefinition.name

  const client = createMockSanityClient() as unknown as SanityClient
  const patchChannel = createPatchChannel()
  const TestProvider = await createTestProvider({
    client,
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: [
          defineType({
            type: 'document' as const,
            name: 'test',
            fields: [fieldDefinition],
          }),
        ],
      },
    },
  })

  const focusRef = {current: null}
  const onBlur = vi.fn()
  const onChange = vi.fn()
  const onFocus = vi.fn()
  const onDOMChange = vi.fn((...args) => onChange(...args))

  const onPathBlur = vi.fn()
  const onPathFocus = vi.fn()
  const onPathOpen = vi.fn()
  const onFieldGroupSelect = vi.fn()
  const onSetFieldSetCollapsed = vi.fn()
  const onSetPathCollapsed = vi.fn()

  function TestForm(renderProps: TestRenderProps & {render: TestRenderInputCallback<any>}) {
    const {
      documentValue,
      focusPath = EMPTY_ARRAY,
      openPath = EMPTY_ARRAY,
      presence = EMPTY_ARRAY,
      render: renderFn,
      validation = EMPTY_ARRAY,
    } = renderProps

    const schema = useSchema()
    const docType = schema.get('test') as ObjectSchemaType | undefined

    if (!docType) throw new Error(`no document type: test`)

    const formState = useFormState({
      schemaType: docType,
      comparisonValue: documentValue,
      documentValue,
      focusPath,
      collapsedPaths: undefined,
      collapsedFieldSets: undefined,
      fieldGroupState: undefined,
      presence,
      validation,
      openPath,
    })

    if (!formState) {
      throw new Error('no form state')
    }

    const fieldMember = formState.members.find((m) => m.kind === 'field' && m.name === name) as
      | FieldMember
      | undefined

    if (!fieldMember) {
      throw new Error(`no field member: ${name}`)
    }

    const {level, path, readOnly, schemaType} = fieldMember.field

    return (
      <FormProvider
        __internal_patchChannel={patchChannel}
        changesOpen={false}
        collapsedFieldSets={undefined}
        collapsedPaths={undefined}
        focusPath={formState.focusPath}
        focused={formState.focused}
        groups={formState.groups || EMPTY_ARRAY}
        id={formState.id}
        onChange={onChange}
        onPathBlur={onPathBlur}
        onPathFocus={onPathFocus}
        onPathOpen={onPathOpen}
        onFieldGroupSelect={onFieldGroupSelect}
        onSetFieldSetCollapsed={onSetFieldSetCollapsed}
        onSetPathCollapsed={onSetPathCollapsed}
        presence={presence}
        readOnly={formState.readOnly}
        schemaType={docType}
        validation={validation}
      >
        <DocumentFieldActionsProvider actions={EMPTY_ARRAY}>
          {renderFn(
            {
              focusPath: formState.focusPath,
              id: formState.id || name,
              level,
              onBlur,
              onChange,
              onFocus,
              onPathBlur,
              onPathFocus,
              path,
              readOnly,
              schemaType,
              validation: formState.validation,
              presence: formState.presence,
              value: formState.value?.[name],
              elementProps: {
                id: formState.id || name,
                onBlur,
                onFocus,
                ref: focusRef,
                onChange: onDOMChange,
              },
            },
            {client, formState},
          )}
        </DocumentFieldActionsProvider>
      </FormProvider>
    )
  }

  const result = render(
    <TestProvider>
      <div id="__test_container__">
        <TestForm {...initialTestProps} render={initialRender} />
      </div>
    </TestProvider>,
  )

  const container = result.container.querySelector('#__test_container__')!

  return {
    container,
    focusRef,
    onBlur,
    onChange,
    onNativeChange: onDOMChange,
    onFocus,
    onPathBlur,
    onPathFocus,
    onFieldGroupSelect,
    onSetFieldSetCollapsed,
    result,
  }
}
