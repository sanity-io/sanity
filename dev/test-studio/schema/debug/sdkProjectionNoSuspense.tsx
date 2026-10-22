import {createDocumentHandle, useDocumentProjection} from '@sanity/sdk-react'
import {Card, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {
  type ArrayOfObjectsInputProps,
  defineArrayMember,
  defineField,
  defineType,
  type FieldProps,
  getPublishedId,
  type ItemProps,
  useFormValue,
} from 'sanity'

const DOCUMENT_TYPE = 'sdkProjectionNoSuspense'

function useCurrentDocumentProjection<T extends object>(projection: string): T {
  const documentId = getPublishedId(String(useFormValue(['_id'])))
  const {data} = useDocumentProjection<T>({
    ...createDocumentHandle({documentType: DOCUMENT_TYPE, documentId}),
    projection,
  })
  return data
}

/**
 * The customer's input: projects the current document, which on a new document waits for a
 * document that does not exist yet. Nothing inside the input catches it.
 */
function ModelNamesInput(props: ArrayOfObjectsInputProps) {
  const data = useCurrentDocumentProjection<{models: {name?: string}[] | null}>(
    `{"models": inputModels[]->{name}}`,
  )
  const missingNames = (data.models ?? []).filter((model) => !model?.name).length
  return (
    <>
      <Card padding={2} radius={2} tone={missingNames > 0 ? 'critical' : 'positive'}>
        <Text size={1}>Input projection: {missingNames} models without a name</Text>
      </Card>
      {props.renderDefault(props)}
    </>
  )
}

/** The same projection of the current document, from a custom field component. */
function ModelCountField(props: FieldProps) {
  const data = useCurrentDocumentProjection<{count: number | null}>(`{"count": count(fieldModels)}`)
  return (
    <>
      <Card padding={2} radius={2} tone="primary">
        <Text size={1}>Field projection: {data.count ?? 0} models</Text>
      </Card>
      {props.renderDefault(props)}
    </>
  )
}

/** A custom array item that projects the referenced author while it loads. */
function AuthorNameItem(props: ItemProps) {
  const ref = (props.value as {_ref?: string} | undefined)?._ref
  if (!ref) return props.renderDefault(props)
  return <AuthorName authorId={ref}>{props.renderDefault(props)}</AuthorName>
}

function AuthorName(props: {authorId: string; children: ReactNode}) {
  const {data} = useDocumentProjection<{name?: string}>({
    ...createDocumentHandle({documentType: 'author', documentId: props.authorId}),
    projection: `{name}`,
  })
  return (
    <>
      <Text size={0} muted>
        Item projection: {data.name ?? 'unnamed'}
      </Text>
      {props.children}
    </>
  )
}

const authorReference = defineArrayMember({type: 'reference', to: [{type: 'author'}]})

/**
 * One custom component per form component slot, each calling `useDocumentProjection` with no
 * Suspense boundary of its own.
 */
export const sdkProjectionNoSuspense = defineType({
  name: DOCUMENT_TYPE,
  title: 'SDK projection: no Suspense (input, field and item)',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'inputModels',
      title: 'Custom input',
      description: 'components.input projects the current document.',
      type: 'array',
      of: [authorReference],
      components: {input: ModelNamesInput},
    }),
    defineField({
      name: 'fieldModels',
      title: 'Custom field',
      description: 'components.field projects the current document.',
      type: 'array',
      of: [authorReference],
      components: {field: ModelCountField},
    }),
    defineField({
      name: 'itemAuthors',
      title: 'Custom item',
      description: 'components.item on each reference projects the referenced author.',
      type: 'array',
      of: [defineArrayMember({...authorReference, components: {item: AuthorNameItem}})],
    }),
  ],
})
