/* eslint-disable camelcase */

import {SanityClient} from '@sanity/client'
import {defineType, Path} from '@sanity/types'
import {render} from '@testing-library/react'
import React, {useMemo} from 'react'
import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {TestProvider} from '../../../test/form'
import {createSchema} from '../../schema'
import {createPatchChannel} from '../patch'
import {useFormState} from '../store/useFormState'
import {EMPTY_ARRAY} from '../utils/empty'
import {StudioFormBuilder, StudioFormBuilderProps} from './StudioFormBuilder'

const schema = createSchema({
  name: 'test',
  types: [
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
  ],
})

describe('StudioFormBuilder', () => {
  it('should render a studio form', async () => {
    const client = createMockSanityClient() as unknown as SanityClient

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
        focusPath,
        collapsedPaths: undefined,
        expandedFieldSets: undefined,
        fieldGroupState: undefined,
        openPath,
      })

      const formBuilderProps: StudioFormBuilderProps = useMemo(
        () => ({
          __internal_patchChannel: patchChannel,
          changesOpen: false,
          compareValue: formState?.compareValue,
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

      return <StudioFormBuilder {...formBuilderProps} />
    }

    const result = render(
      <TestProvider client={client} schema={schema}>
        <TestForm />
      </TestProvider>
    )

    const titleField = await result.findByTestId('field-title')

    expect(titleField.outerHTML).toMatchSnapshot()
  })
})
