import {
  defineArrayMember,
  defineField,
  defineType,
  type FieldDefinition,
  type SanityDocument,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps, type ReactNode} from 'react'
import {of} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type StudioCrossDatasetReferenceInputProps} from '../../studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
import {type StudioGlobalDocumentReferenceInputProps} from '../../studio/inputs/globalDocumentReference/StudioGlobalDocumentReferenceInput'
import {type StudioReferenceInputProps} from '../../studio/inputs/reference/StudioReferenceInput'
import {GridArrayInput} from '../arrays/ArrayOfObjectsInput/Grid/GridArrayInput'
import {ListArrayInput} from '../arrays/ArrayOfObjectsInput/List/ListArrayInput'
import {ArrayOfPrimitivesInput} from '../arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesInput'
import {CrossDatasetReferenceInput} from '../CrossDatasetReferenceInput/CrossDatasetReferenceInput'
import {DateTimeInput} from '../DateInputs/DateTimeInput'
import {GlobalDocumentReferenceInput} from '../GlobalDocumentReferenceInput/GlobalDocumentReferenceInput'
import {ObjectInput} from '../ObjectInput/ObjectInput'
import {ReferenceInput} from '../ReferenceInput/ReferenceInput'
import {ReferenceInputPreview} from '../ReferenceInput/ReferenceInputPreview'
import {SelectInput} from '../SelectInput'
import {SlugInput} from '../Slug/SlugInput'

const DOCUMENT: SanityDocument = {
  _id: 'visual-inputs',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'visual-inputs-rev',
  title: 'Visual regression fixtures',
  publishedAt: '2024-06-15T12:30:00.000Z',
  status: 'review',
  slug: {_type: 'slug', current: 'visual-regression-fixtures'},
  details: {_type: 'details', summary: 'Known field', legacySummary: 'Legacy field'},
  primitiveItems: ['alpha', 'beta'],
}

function DateTimeVisualInput(props: ComponentProps<typeof DateTimeInput>) {
  return <DateTimeInput {...props} />
}

function SelectVisualInput(props: ComponentProps<typeof SelectInput>) {
  return <SelectInput {...props} />
}

function SlugVisualInput(props: ComponentProps<typeof SlugInput>) {
  return <SlugInput {...props} />
}

function ObjectVisualInput(props: ComponentProps<typeof ObjectInput>) {
  return <ObjectInput {...props} />
}

function GridArrayVisualInput(props: ComponentProps<typeof GridArrayInput>) {
  return <GridArrayInput {...props} />
}

function ListArrayVisualInput(props: ComponentProps<typeof ListArrayInput>) {
  return <ListArrayInput {...props} />
}

function PrimitiveArrayVisualInput(props: ComponentProps<typeof ArrayOfPrimitivesInput>) {
  return <ArrayOfPrimitivesInput {...props} />
}

const STANDARD_INPUT_SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'string', name: 'title', title: 'Title'}),
      defineField({
        type: 'datetime',
        name: 'publishedAt',
        title: 'Published at',
        components: {input: DateTimeVisualInput},
      }),
      defineField({
        type: 'string',
        name: 'status',
        title: 'Status',
        options: {
          layout: 'radio',
          list: [
            {title: 'Draft', value: 'draft'},
            {title: 'In review', value: 'review'},
            {title: 'Published', value: 'published'},
          ],
        },
        components: {input: SelectVisualInput},
      }),
      defineField({
        type: 'slug',
        name: 'slug',
        title: 'Slug',
        options: {source: 'title'},
        components: {input: SlugVisualInput},
      }),
      defineField({
        type: 'object',
        name: 'details',
        title: 'Details',
        fields: [defineField({type: 'string', name: 'summary', title: 'Summary'})],
        components: {input: ObjectVisualInput},
      }),
    ],
  }),
]

const ARRAY_INPUT_SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'gridItems',
        title: 'Grid items',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'gridCard',
            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
          }),
        ],
        components: {input: GridArrayVisualInput},
      }),
      defineField({
        type: 'array',
        name: 'listItems',
        title: 'List items',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'listCard',
            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
          }),
        ],
        components: {input: ListArrayVisualInput},
      }),
      defineField({
        type: 'array',
        name: 'primitiveItems',
        title: 'Primitive items',
        of: [defineArrayMember({type: 'string'})],
        components: {input: PrimitiveArrayVisualInput},
      }),
    ],
  }),
]

function EditReferenceLink(props: {children: ReactNode}) {
  return props.children
}

function ReferenceVisualInput(props: StudioReferenceInputProps) {
  return (
    <ReferenceInput
      {...(props as ComponentProps<typeof ReferenceInput>)}
      createOptions={[]}
      editReferenceLinkComponent={EditReferenceLink}
      getReferenceInfo={() =>
        of({
          id: 'author-1',
          type: 'author',
          isPublished: true,
          availability: {available: true, reason: 'READABLE'},
          preview: {snapshot: null, original: null},
        })
      }
      onEditReference={noop}
      onSearch={() => of([])}
    />
  )
}

function ReferencePreviewVisualInput(props: StudioReferenceInputProps) {
  return (
    <ReferenceInputPreview {...(props as ComponentProps<typeof ReferenceInputPreview>)}>
      <TextInput placeholder="Search for an author" />
    </ReferenceInputPreview>
  )
}

function CrossDatasetReferenceVisualInput(props: StudioCrossDatasetReferenceInputProps) {
  return (
    <CrossDatasetReferenceInput
      {...(props as ComponentProps<typeof CrossDatasetReferenceInput>)}
      getReferenceInfo={() =>
        of({
          id: 'book-1',
          type: 'book',
          availability: {available: true, reason: 'READABLE'},
          preview: {published: {title: 'Fixture book'}},
        })
      }
      onSearch={() => of([])}
    />
  )
}

function GlobalDocumentReferenceVisualInput(props: StudioGlobalDocumentReferenceInputProps) {
  return (
    <GlobalDocumentReferenceInput
      {...(props as ComponentProps<typeof GlobalDocumentReferenceInput>)}
      getReferenceInfo={() =>
        of({
          id: 'book-1',
          type: 'book',
          availability: {available: true, reason: 'READABLE'},
          preview: {published: {title: 'Fixture book'}},
        })
      }
      onSearch={() => of([])}
    />
  )
}

const REFERENCE_INPUT_SCHEMA = [
  defineType({
    type: 'document',
    name: 'author',
    title: 'Author',
    fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
  }),
  defineType({
    type: 'document',
    name: 'book',
    title: 'Book',
    fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
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
        components: {input: ReferenceVisualInput},
      }),
      defineField({
        type: 'reference',
        name: 'authorPreview',
        title: 'Author preview',
        to: [{type: 'author'}],
        components: {input: ReferencePreviewVisualInput},
      }),
      defineField({
        type: 'crossDatasetReference',
        name: 'relatedBook',
        title: 'Related book',
        dataset: 'library',
        to: [{type: 'book'}],
        components: {input: CrossDatasetReferenceVisualInput},
      }),
      defineField({
        type: 'globalDocumentReference',
        name: 'globalBook',
        title: 'Global book',
        resourceType: 'dataset',
        resourceId: 'abc123.library',
        to: [{type: 'book'}],
        components: {input: GlobalDocumentReferenceVisualInput},
      } as unknown as FieldDefinition),
    ],
  }),
]

function FormInputHarness({
  document,
  schemaTypes,
}: {
  document?: SanityDocument
  schemaTypes: SchemaTypeDefinition[]
}) {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={document} />
    </TestWrapper>
  )
}

describe('form input visual coverage', () => {
  test('renders date, select, slug, and object input states', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FormInputHarness document={DOCUMENT} schemaTypes={STANDARD_INPUT_SCHEMA} />)

    await expect.element(page.getByText('Published at')).toBeVisible()
    await expect.element(page.getByText('In review')).toBeVisible()
    await expect.element(page.getByText('Legacy field')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders object and primitive array input states', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FormInputHarness document={DOCUMENT} schemaTypes={ARRAY_INPUT_SCHEMA} />)

    await expect.element(page.getByText('Grid items')).toBeVisible()
    await expect.element(page.getByText('List items')).toBeVisible()
    await expect.element(page.getByText('alpha')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders local, cross-dataset, and global reference inputs', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FormInputHarness schemaTypes={REFERENCE_INPUT_SCHEMA} />)

    await expect.element(page.getByText('Author')).toBeVisible()
    await expect.element(page.getByText('Related book')).toBeVisible()
    await expect.element(page.getByText('Global book')).toBeVisible()
    await settleChromaticEndState()
  })
})
