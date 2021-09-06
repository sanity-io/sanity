import {ValidationMarker, BlockValidator} from '@sanity/types'
import {validateItem} from '../validateDocument'

export const blockValidator: BlockValidator = async (value, context) => {
  if (value.markDefs.length === 0) return []

  const {type} = context

  if (!type) {
    throw new Error(`Schema \`type\` was not provided in validation context`)
  }
  if (type.jsonType !== 'object') {
    throw new Error(
      `Expected schema type with jsonType \`object\` but found \`${type.jsonType}\` instead.`
    )
  }

  const childrenType = type.fields?.find((field) => field.name === 'children')?.type
  const spanType =
    childrenType?.jsonType === 'array'
      ? childrenType?.of.find((ofType) => ofType.name === 'span')
      : null

  // Validate every markDef (annotation) value
  // eslint-disable-next-line no-warning-comments
  // @ts-expect-error TODO (eventually): fix these types
  const activeAnnotationTypes: any[] = spanType?.annotations.filter((annotation) =>
    // eslint-disable-next-line no-warning-comments
    // @ts-expect-error TODO (eventually): fix these types
    value.markDefs.map((def) => def._type).includes(annotation.name)
  )
  const annotationValidations: Promise<ValidationMarker[]>[] = []
  value.markDefs.forEach((markDef: any) => {
    const annotationType = activeAnnotationTypes.find((aType) => aType.name === markDef._type)
    const validations = validateItem({
      document: context.document,
      value: markDef,
      type: annotationType,
      path: (context.path || []).concat(['markDefs', {_key: markDef._key}]),
      parent: value,
    })
    annotationValidations.push(validations)
  })

  const results = await Promise.all(annotationValidations)
  const flattened = results.flat()

  if (!flattened.length) return []

  return flattened.map((res) => {
    res.item.paths = [res.path]
    return res.item
  })
}
