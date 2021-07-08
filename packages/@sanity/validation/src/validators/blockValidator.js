import {flatten} from 'lodash'
import {validateItem} from '../validateDocument'

// eslint-disable-next-line import/prefer-default-export
export const blockValidator = async (value, options) => {
  if (value.markDefs.length === 0) {
    return []
  }

  const {type} = options
  const childrenType = type.fields.find((field) => field.name === 'children').type
  const spanType = childrenType.of.find((ofType) => ofType.name === 'span')

  // Validate every markDef (annotation) value
  const activeAnnotationTypes = spanType.annotations.filter((annotation) =>
    value.markDefs.map((def) => def._type).includes(annotation.name)
  )
  const annotationValidations = []
  value.markDefs.forEach((markDef) => {
    const annotationType = activeAnnotationTypes.find((aType) => aType.name === markDef._type)
    const validations = validateItem(markDef, annotationType, ['markDefs', {_key: markDef._key}], {
      parent: value,
      document: options.document,
    })
    annotationValidations.push(validations)
  })

  const results = await Promise.all(annotationValidations).then(flatten)
  if (results.length) {
    return results.map((res) => {
      res.item.paths = [res.path]
      return res.item
    })
  }

  return []
}
