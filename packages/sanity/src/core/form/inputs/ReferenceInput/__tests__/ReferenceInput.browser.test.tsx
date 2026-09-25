import {
  defineField,
  defineType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
} from '@sanity/types'
import {Card, TextInput} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps, type ReactNode} from 'react'
import {of} from 'rxjs'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DefaultPreview} from '../../../../components/previews/general/DefaultPreview'
import {useSchema} from '../../../../hooks/useSchema'
import {type StudioReferenceInputProps} from '../../../studio/inputs/reference/StudioReferenceInput'
import {type RenderPreviewCallback} from '../../../types/renderCallback'
import {OptionPreview} from '../OptionPreview'
import {ReferenceFinalizeAlertStrip} from '../ReferenceFinalizeAlertStrip'
import {ReferenceInput} from '../ReferenceInput'
import {ReferenceInputPreview} from '../ReferenceInputPreview'
import {ReferenceMetadataLoadErrorAlertStrip} from '../ReferenceMetadataLoadFailure'
import {ReferenceStrengthMismatchAlertStrip} from '../ReferenceStrengthMismatchAlertStrip'

const renderPreview: RenderPreviewCallback = () => <DefaultPreview title="Untitled author" />

function EditReferenceLink(props: {children: ReactNode}) {
  return props.children
}

function authorReferenceInfo() {
  return of({
    id: 'author-1',
    type: 'author',
    isPublished: true,
    availability: {available: true, reason: 'READABLE'} as const,
    preview: {snapshot: null, original: null},
  })
}

function emptySearch() {
  return of([])
}

function ReferenceSchemaInput(props: StudioReferenceInputProps) {
  return (
    <ReferenceInput
      {...(props as ComponentProps<typeof ReferenceInput>)}
      createOptions={[]}
      editReferenceLinkComponent={EditReferenceLink}
      getReferenceInfo={authorReferenceInfo}
      onEditReference={noop}
      onSearch={emptySearch}
    />
  )
}

function ReferencePreviewSchemaInput(props: StudioReferenceInputProps) {
  return (
    <ReferenceInputPreview {...(props as ComponentProps<typeof ReferenceInputPreview>)}>
      <TextInput placeholder="Search for an author" />
    </ReferenceInputPreview>
  )
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'author',
    title: 'Author',
    fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
  }),
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'reference',
        name: 'author',
        title: 'Author',
        to: [{type: 'author'}],
        components: {input: ReferenceSchemaInput},
      }),
      defineField({
        type: 'reference',
        name: 'authorPreview',
        title: 'Author preview',
        to: [{type: 'author'}],
        components: {input: ReferencePreviewSchemaInput},
      }),
    ],
  }),
]

function ReferenceInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm />
    </TestWrapper>
  )
}

function ReferenceAlerts() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const referenceType = documentType.fields[0].type as ReferenceSchemaType

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <OptionPreview
          id="author-1"
          referenceType={referenceType}
          renderPreview={renderPreview}
          type="author"
        />
        <ReferenceFinalizeAlertStrip
          handleRemoveStrengthenOnPublish={noop}
          schemaType={referenceType}
        />
        <ReferenceStrengthMismatchAlertStrip
          actualStrength="weak"
          handleFixStrengthMismatch={noop}
        />
        <ReferenceMetadataLoadErrorAlertStrip
          errorMessage="The reference metadata could not be loaded."
          onHandleRetry={noop}
        />
      </VStack>
    </Card>
  )
}

function ReferenceAlertsHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <ReferenceAlerts />
    </TestWrapper>
  )
}

describe('reference input', () => {
  test('renders an empty reference and its preview field', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReferenceInputHarness />)

    await expect.element(page.getByText('Author', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Author preview')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders an option preview and reference alert strips', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReferenceAlertsHarness />)

    await expect.element(page.getByText('Untitled author')).toBeVisible()
    await expect
      .element(
        page
          .getByTestId('alert-reference-published')
          .getByRole('button', {name: 'Convert to strong reference'}),
      )
      .toBeVisible()
    await expect.element(page.getByTestId('alert-reference-strength-mismatch')).toBeVisible()
    await expect.element(page.getByTestId('alert-reference-info-failed')).toBeVisible()
    await settleChromaticEndState()
  })
})
