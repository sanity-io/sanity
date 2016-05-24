import DefaultContainer from './DefaultContainer'
import {getFieldType} from '../utils/getFieldType'
const noop = () => {}

export function createFieldValue(value, context) {

  const {schema, field, resolveContainer} = context

  if (!field) {
    throw new Error('Missing field')
  }

  const fieldType = getFieldType(schema, field)

  const ResolvedContainer = resolveContainer(field, fieldType)

  if (ResolvedContainer) {
    return ResolvedContainer.wrap(value, context)
  }

  return new DefaultContainer(value, context)
}

export function createFormBuilderState(value, {type, schema, resolveContainer}) {
  const context = {
    schema: schema,
    field: {type: type.name},
    resolveContainer: resolveContainer || noop
  }
  return createFieldValue(value, context)
}
