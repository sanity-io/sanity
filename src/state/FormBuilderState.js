import DefaultContainer from './DefaultContainer'
import {getFieldType} from '../utils/getFieldType'
const noop = () => {}

export function createFieldValue(value, context) {

  const {schema, field, resolveContainer} = context

  if (!field) {
    throw new Error(`Missing field for value ${value}`)
  }

  const fieldType = getFieldType(schema, field)

  let ResolvedContainer
  try {
    ResolvedContainer = resolveContainer(field, fieldType) || DefaultContainer
  } catch (error) {
    error.message = `Got error while resolving value container for field "${field.name}" of type ${fieldType.name}: ${error.message}.`
    throw error
  }

  return ResolvedContainer.deserialize(value, context)
}

export function createFormBuilderState(value, {type, schema, resolveContainer}) {
  const context = {
    schema: schema,
    field: {type: type.name},
    resolveContainer: resolveContainer || noop
  }
  return createFieldValue(value, context)
}
