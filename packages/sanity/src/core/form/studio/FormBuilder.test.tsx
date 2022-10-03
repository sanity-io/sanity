/* eslint-disable camelcase */

import {SanityClient} from '@sanity/client'
import {defineType, Path} from '@sanity/types'
import {render} from '@testing-library/react'
import React, {useMemo} from 'react'
import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useWorkspace} from '../../studio'
import {EMPTY_ARRAY} from '../../util'
import {createPatchChannel} from '../patch'
import {useFormState} from '../store/useFormState'
import {FormBuilder, FormBuilderProps} from './FormBuilder'

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

describe('FormBuilder', () => {
  it('should render a studio form', async () => {
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

    const focusPath: Path = []
    const openPath: Path = []
    const value = {_id: 'test', _type: 'test'}

    const onChange = jest.fn()
    const onFieldGroupSelect = jest.fn()
    const onPathBlur = jest.fn()
    const onPathFocus = jest.fn()
    const onPathOpen = jest.fn()
    const onSelectFieldGroup = jest.fn()
    const onSetFieldSetCollapsed = jest.fn()
    const onSetPathCollapsed = jest.fn()

    function TestForm() {
      const {schema} = useWorkspace()
      const schemaType = schema.get('test')

      if (!schemaType) {
        throw new Error('missing schema type')
      }

      if (schemaType.jsonType !== 'object') {
        throw new Error('schema type is not an object')
      }

      const patchChannel = useMemo(() => createPatchChannel(), [])

      const formState = useFormState(schemaType, {
        value,
        comparisonValue: value,
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
          value: formState?.value,
        }),
        [formState, patchChannel, schemaType]
      )

      return <FormBuilder {...formBuilderProps} />
    }

    const result = render(
      <TestProvider>
        <TestForm />
      </TestProvider>
    )

    const titleField = await result.findByTestId('field-title')

    expect(removeClasses(titleField.outerHTML)).toMatchSnapshot()
  })
})

function removeClasses(html: string) {
  return html.replace(/\s+class=".*?"|\s+data-testid="string-input"/g, '')
}
