import ObjectContainer from './ObjectContainer'
import ArrayContainer from './ArrayContainer'
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

  if (fieldType.type === 'object') {
    // create value nodes for each field in schema type
    return ObjectContainer.wrap(value, {field, schema, resolveContainer})
  }

  if (fieldType.type === 'array') {
    // create value nodes for each item in value
    return ArrayContainer.wrap(value, {field, schema, resolveContainer})
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
