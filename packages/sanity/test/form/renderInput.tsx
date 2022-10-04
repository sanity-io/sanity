import {SanityClient} from '@sanity/client'
import {
  defineType,
  FieldDefinition,
  ObjectSchemaType,
  Path,
  Schema,
  SchemaType,
} from '@sanity/types'
import {render} from '@testing-library/react'
import React, {FocusEvent} from 'react'
import {
  createPatchChannel,
  FieldMember,
  NodePresence,
  NodeValidation,
  PatchArg,
  PatchEvent,
  FormProvider,
  useFormState,
} from '../../src/form'
import {FormState} from '../../src/form/store/useFormState'
import {EMPTY_ARRAY} from '../../src/form/utils/empty'
import {useSchema} from '../../src/hooks'
import {createMockSanityClient} from '../mocks/mockSanityClient'
import {createTestProvider} from '../testUtils/TestProvider'
import {TestRenderProps} from './types'

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
  presence: NodePresence[]
  readOnly: boolean | undefined
  schemaType: SchemaType
  validation: NodeValidation[]
  value: unknown
  elementProps: ElementProps
}

export type TestRenderInputCallback<ElementProps> = (
  inputProps: TestRenderInputProps<ElementProps>,
  context: TestRenderInputContext
) => React.ReactElement

export async function renderInput(props: {
  fieldDefinition: FieldDefinition
  props?: TestRenderProps
  render: TestRenderInputCallback<any>
}) {
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
  const onBlur = jest.fn()
  const onChange = jest.fn()
  const onFocus = jest.fn()
  const onDOMChange = jest.fn((...args) => onChange(...args))

  const onPathBlur = jest.fn()
  const onPathFocus = jest.fn()
  const onPathOpen = jest.fn()
  const onFieldGroupSelect = jest.fn()
  const onSetFieldSetCollapsed = jest.fn()
  const onSetPathCollapsed = jest.fn()

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

    const formState = useFormState(docType, {
      comparisonValue: documentValue as any,
      value: documentValue as any,
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
        members={formState.members || EMPTY_ARRAY}
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
        value={undefined}
      >
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
          {client, formState}
        )}
      </FormProvider>
    )
  }

  const result = render(
    <TestProvider>
      <TestForm {...initialTestProps} render={initialRender} />
    </TestProvider>
  )

  function rerender(subsequentRender: TestRenderInputCallback<any>) {
    render(
      <TestProvider>
        <TestForm {...initialTestProps} render={subsequentRender} />
      </TestProvider>
    )
  }

  return {
    focusRef,
    onBlur,
    onChange,
    onNativeChange: onDOMChange,
    onFocus,
    onPathBlur,
    onPathFocus,
    onFieldGroupSelect,
    onSetFieldSetCollapsed,
    rerender,
    result,
  }
}
