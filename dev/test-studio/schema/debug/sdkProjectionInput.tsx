import {createDocumentHandle, useDocumentProjection} from '@sanity/sdk-react'
import {Card, Text} from '@sanity/ui'
import {type ComponentType, Suspense} from 'react'
import {
  defineArrayMember,
  defineField,
  defineType,
  type ArrayOfObjectsInputProps,
  useFormValue,
} from 'sanity'

type ProjectionData = {
  models: {name?: string}[] | null
  modelCount: number
}

function sdkProjectionWarnings(documentType: string) {
  return function ModelWarnings(props: ArrayOfObjectsInputProps) {
    const documentId = String(useFormValue(['_id']))

    const handle = createDocumentHandle({documentType, documentId})

    const {data, isPending} = useDocumentProjection<ProjectionData>({
      ...handle,
      projection: `{
        "models": models[]->{name},
        "modelCount": count(models),
      }`,
    })

    if (!data || !props.value || isPending) {
      return <>{props.renderDefault(props)}</>
    }

    const missingNames = (data.models ?? []).filter((model) => !model?.name).length

    return (
      <>
        <Card padding={2} radius={2} tone={missingNames > 0 ? 'critical' : 'positive'}>
          <Text size={1}>
            Projection resolved: {data.modelCount} models, {missingNames} without a name
          </Text>
        </Card>
        {props.renderDefault(props)}
      </>
    )
  }
}

function defineSdkProjectionType(options: {
  name: string
  title: string
  description: string
  createInput: (documentType: string) => ComponentType<ArrayOfObjectsInputProps>
}) {
  return defineType({
    name: options.name,
    title: options.title,
    type: 'document',
    fields: [
      defineField({name: 'title', title: 'Title', type: 'string'}),
      defineField({
        name: 'models',
        title: 'Models',
        description: options.description,
        type: 'array',
        of: [defineArrayMember({type: 'reference', to: [{type: 'author'}]})],
        components: {input: options.createInput(options.name)},
      }),
    ],
  })
}

/**
 * The input as originally written: `useDocumentProjection` suspends until the projected document
 * exists, and nothing inside the input catches it.
 */
export const sdkProjectionUnwrapped = defineSdkProjectionType({
  name: 'sdkProjectionUnwrapped',
  title: 'SDK projection input: no Suspense',
  description: 'Calls useDocumentProjection for the current document with no Suspense boundary.',
  createInput: sdkProjectionWarnings,
})

export const sdkProjectionGuardOnly = defineSdkProjectionType({
  name: 'sdkProjectionGuardOnly',
  title: 'SDK projection input: empty-value guard, no Suspense',
  description:
    'Skips useDocumentProjection while the array is empty, but has no Suspense boundary once it runs.',
  createInput: (documentType) => {
    const ModelWarnings = sdkProjectionWarnings(documentType)
    return function GuardedModelWarnings(props: ArrayOfObjectsInputProps) {
      if (!Array.isArray(props.value) || props.value.length === 0) {
        return <>{props.renderDefault(props)}</>
      }
      return <ModelWarnings {...props} />
    }
  },
})

export const sdkProjectionWrapped = defineSdkProjectionType({
  name: 'sdkProjectionWrapped',
  title: 'SDK projection input: guard and Suspense',
  description: 'The customer fix: skips the projection while empty and wraps it in Suspense.',
  createInput: (documentType) => {
    const ModelWarnings = sdkProjectionWarnings(documentType)
    return function WrappedModelWarnings(props: ArrayOfObjectsInputProps) {
      if (!Array.isArray(props.value) || props.value.length === 0) {
        return <>{props.renderDefault(props)}</>
      }
      return (
        <Suspense fallback={props.renderDefault(props)}>
          <ModelWarnings {...props} />
        </Suspense>
      )
    }
  },
})
