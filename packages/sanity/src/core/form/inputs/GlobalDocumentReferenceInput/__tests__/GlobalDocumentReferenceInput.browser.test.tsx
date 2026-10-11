import {BookIcon} from '@sanity/icons/Book'
import {
  defineField,
  defineType,
  type GlobalDocumentReferenceSchemaType,
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

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../hooks/useSchema'
import {GlobalDocumentReferenceInput} from '../GlobalDocumentReferenceInput'
import {OptionPreview} from '../OptionPreview'
import {PreviewReferenceValue} from '../PreviewReferenceValue'
import {type GlobalDocumentReferenceInfo} from '../types'

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

function getGlobalDocumentReferenceInfo() {
  return of(SEARCH_RESULT_REFERENCE_INFO satisfies GlobalDocumentReferenceInfo)
}

function emptySearch() {
  return of([])
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'globalDocumentReference',
        name: 'globalBook',
        title: 'Global book',
        resourceType: 'dataset',
        resourceId: 'abc123.library',
        to: [BOOK_TARGET],
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

function GlobalDocumentReferenceFields() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const referenceType = documentType.fields[0].type as GlobalDocumentReferenceSchemaType

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <OptionPreview
          document={{_id: 'book-1', _type: 'book'}}
          getReferenceInfo={getGlobalDocumentReferenceInfo}
          referenceType={referenceType}
        />
        <PreviewReferenceValue
          referenceInfo={LOADED_REFERENCE_INFO}
          type={referenceType}
          value={{
            _type: 'globalDocumentReference',
            _ref: 'dataset:abc123.library:book-1',
          }}
        />
        <GlobalDocumentReferenceInput
          {...({
            changed: false,
            elementProps: {id: 'global-document-reference', onBlur: noop, onFocus: noop, ref: null},
            focusPath: [],
            focused: false,
            getReferenceInfo: getGlobalDocumentReferenceInfo,
            id: 'global-document-reference',
            level: 0,
            onChange: noop,
            onPathBlur: noop,
            onPathFocus: noop,
            onSearch: emptySearch,
            path: [],
            presence: [],
            readOnly: false,
            schemaType: referenceType,
            validation: [],
            value: undefined,
          } as unknown as ComponentProps<typeof GlobalDocumentReferenceInput>)}
        />
      </VStack>
    </Card>
  )
}

function GlobalDocumentReferenceInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <GlobalDocumentReferenceFields />
    </TestWrapper>
  )
}

describe('global document reference input', () => {
  test('renders option preview, loaded preview, and an empty input', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<GlobalDocumentReferenceInputHarness />)

    await expect.element(page.getByText('Search result fixture')).toBeVisible()
    await expect.element(page.getByText('The Left Hand of Darkness')).toBeVisible()
    await expect.element(page.getByTestId('autocomplete')).toBeVisible()
    await settleChromaticEndState()
  })
})
