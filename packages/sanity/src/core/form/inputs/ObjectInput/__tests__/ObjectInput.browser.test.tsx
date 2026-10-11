import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps} from 'react'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DefaultPreview} from '../../../../components/previews/general/DefaultPreview'
import {type RenderPreviewCallback} from '../../../types/renderCallback'
import {ObjectInput} from '../ObjectInput'
import {UnknownFields} from '../UnknownFields'

const DOCUMENT: SanityDocument = {
  _id: 'object-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'object-input-rev',
  details: {_type: 'details', summary: 'Known field', legacySummary: 'Legacy field'},
}

const renderPreview: RenderPreviewCallback = () => <DefaultPreview title="Untitled author" />

function ObjectSchemaInput(props: ComponentProps<typeof ObjectInput>) {
  return <ObjectInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'object',
        name: 'details',
        title: 'Details',
        fields: [defineField({type: 'string', name: 'summary', title: 'Summary'})],
        components: {input: ObjectSchemaInput},
      }),
    ],
  }),
]

function ObjectInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

function UnknownFieldsHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 560}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            unknown object fields
          </Text>
          <UnknownFields
            fieldNames={['legacyTitle', 'legacyAuthor']}
            onChange={noop}
            renderPreview={renderPreview}
            value={{
              legacyTitle: 'Old title',
              legacyAuthor: {_type: 'reference', _ref: 'author-1'},
            }}
          />
        </VStack>
      </Card>
    </TestWrapper>
  )
}

describe('ObjectInput', () => {
  test('renders known fields and a legacy unknown field', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ObjectInputHarness />)

    await expect.element(page.getByText('Legacy field')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders unknown object fields', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnknownFieldsHarness />)

    await expect.element(page.getByText('Unknown fields found')).toBeVisible()
    await expect.element(page.getByText('Untitled author')).toBeVisible()
    await settleChromaticEndState()
  })
})
