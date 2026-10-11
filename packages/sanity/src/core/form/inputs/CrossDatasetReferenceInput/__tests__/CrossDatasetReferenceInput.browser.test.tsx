import {BookIcon} from '@sanity/icons/Book'
import {
  type CrossDatasetReferenceSchemaType,
  defineField,
  defineType,
  type ObjectSchemaType,
} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps} from 'react'
import {of} from 'rxjs'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../hooks/useSchema'
import {type StudioCrossDatasetReferenceInputProps} from '../../../studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
import {CrossDatasetReferenceInput} from '../CrossDatasetReferenceInput'
import {OptionPreview} from '../OptionPreview'
import {PreviewReferenceValue} from '../PreviewReferenceValue'
import {type CrossDatasetReferenceInfo} from '../types'

const BOOK_TARGET = {
  type: 'book',
  title: 'Book',
  icon: BookIcon,
  preview: {select: {title: 'title'}},
}

const BOOK_REFERENCE_INFO = {
  id: 'book-1',
  type: 'book',
  availability: {available: true, reason: 'READABLE'} as const,
  preview: {
    published: {title: 'The Left Hand of Darkness', subtitle: 'Ursula K. Le Guin'},
  },
}

const SEARCH_RESULT_REFERENCE_INFO = {
  ...BOOK_REFERENCE_INFO,
  preview: {published: {title: 'Search result fixture'}},
}

function getCrossDatasetReferenceInfo() {
  return of(SEARCH_RESULT_REFERENCE_INFO satisfies CrossDatasetReferenceInfo)
}

function emptySearch() {
  return of([])
}

function CrossDatasetSchemaInput(props: StudioCrossDatasetReferenceInputProps) {
  return (
    <CrossDatasetReferenceInput
      {...(props as ComponentProps<typeof CrossDatasetReferenceInput>)}
      getReferenceInfo={getCrossDatasetReferenceInfo}
      onSearch={emptySearch}
    />
  )
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'crossDatasetReference',
        name: 'relatedBook',
        title: 'Related book',
        dataset: 'library',
        to: [BOOK_TARGET],
        components: {input: CrossDatasetSchemaInput},
      }),
    ],
  }),
]

const LOADED_REFERENCE_INFO = {
  isLoading: false as const,
  result: BOOK_REFERENCE_INFO,
  error: undefined,
  retry: noop,
}

function CrossDatasetReferenceInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm />
    </TestWrapper>
  )
}

function CrossDatasetReferencePreviews() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const referenceType = documentType.fields[0].type as CrossDatasetReferenceSchemaType

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <OptionPreview
          document={{_id: 'book-1', _type: 'book'}}
          getReferenceInfo={getCrossDatasetReferenceInfo}
          referenceType={referenceType}
        />
        <PreviewReferenceValue
          referenceInfo={LOADED_REFERENCE_INFO}
          type={referenceType}
          value={{
            _type: 'crossDatasetReference',
            _ref: 'book-1',
            _dataset: 'library',
            _projectId: 'abc123',
          }}
        />
      </VStack>
    </Card>
  )
}

function CrossDatasetReferencePreviewsHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <CrossDatasetReferencePreviews />
    </TestWrapper>
  )
}

describe('cross-dataset reference input', () => {
  test('renders an empty cross-dataset reference', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CrossDatasetReferenceInputHarness />)

    await expect.element(page.getByText('Related book')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders a search result and a loaded preview', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CrossDatasetReferencePreviewsHarness />)

    await expect.element(page.getByText('Search result fixture')).toBeVisible()
    await expect.element(page.getByText('The Left Hand of Darkness')).toBeVisible()
    await settleChromaticEndState()
  })
})
