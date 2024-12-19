/* eslint-disable camelcase */
import {type SanityClient} from '@sanity/client'
import {defineType, type Path} from '@sanity/types'
import {render} from '@testing-library/react'
import {useMemo, useState} from 'react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useWorkspace} from '../../studio'
import {EMPTY_ARRAY} from '../../util'
import {createPatchChannel} from '../patch'
import {useFormState} from '../store/useFormState'
import {type FormDocumentValue} from '../types'
import {FormBuilder, type FormBuilderProps} from './FormBuilder'
import {useTreeEditingEnabled} from './tree-editing'

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

vi.mock('./tree-editing/context/enabled/useTreeEditingEnabled')

describe('FormBuilder', () => {
  const mockedUseTreeEditingEnabled = useTreeEditingEnabled as Mock

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
    mockedUseTreeEditingEnabled.mockImplementation(() => ({enabled: false}))

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

    const titleField = await result.findByTestId('field-title')

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
    mockedUseTreeEditingEnabled.mockImplementation(() => ({enabled: true}))

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

    const titleField = await result.findByTestId('field-title')

    expect(removeClasses(titleField.outerHTML)).toMatchSnapshot()
  })
})

function removeClasses(html: string) {
  return html.replace(/\s+class=".*?"|\s+data-testid="string-input"/g, '')
}
