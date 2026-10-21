import {createDocumentHandle, useDocumentProjection} from '@sanity/sdk-react'
import {Card, Text} from '@sanity/ui'
import {
  defineArrayMember,
  defineField,
  defineType,
  type FieldProps,
  getPublishedId,
  type ItemProps,
  useFormValue,
} from 'sanity'

const FIELD_DOCUMENT_TYPE = 'sdkProjectionFieldUnwrapped'

/**
 * A custom field that projects the current document. On a new document the projection waits for a
 * document that does not exist yet, and nothing inside the field catches it.
 */
function ProjectionCountField(props: FieldProps) {
  const documentId = getPublishedId(String(useFormValue(['_id'])))
  const {data} = useDocumentProjection<{modelCount: number}>({
    ...createDocumentHandle({documentType: FIELD_DOCUMENT_TYPE, documentId}),
    projection: `{"modelCount": count(models)}`,
  })
  return (
    <>
      <Card padding={2} radius={2} tone="primary">
        <Text size={1}>Projection resolved: {data.modelCount ?? 0} models</Text>
      </Card>
      {props.renderDefault(props)}
    </>
  )
}

export const sdkProjectionFieldUnwrapped = defineType({
  name: FIELD_DOCUMENT_TYPE,
  title: 'SDK projection field: no Suspense',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'models',
      title: 'Models',
      description:
        'A custom field component calls useDocumentProjection with no Suspense boundary.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'author'}]})],
      components: {field: ProjectionCountField},
    }),
  ],
})

/**
 * A custom array item that projects the referenced author. The item suspends while the projection
 * loads, and nothing inside the item catches it.
 */
function AuthorProjectionItem(props: ItemProps) {
  const ref = (props.value as {_ref?: string} | undefined)?._ref
  if (!ref) return props.renderDefault(props)
  return <AuthorName authorId={ref}>{props.renderDefault(props)}</AuthorName>
}

function AuthorName(props: {authorId: string; children: React.ReactNode}) {
  const {data} = useDocumentProjection<{name?: string}>({
    ...createDocumentHandle({documentType: 'author', documentId: props.authorId}),
    projection: `{name}`,
  })
  return (
    <>
      <Text size={0} muted>
        Projected author: {data.name ?? 'unnamed'}
      </Text>
      {props.children}
    </>
  )
}

export const sdkProjectionItemUnwrapped = defineType({
  name: 'sdkProjectionItemUnwrapped',
  title: 'SDK projection item: no Suspense',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'authors',
      title: 'Authors',
      description: 'Each item calls useDocumentProjection with no Suspense boundary.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'author'}],
          components: {item: AuthorProjectionItem},
        }),
      ],
    }),
  ],
})
