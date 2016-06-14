import DefaultContainer from './DefaultContainer'
import {getFieldType} from '../utils/getFieldType'

export function createFieldValue(value, context) {

  const {schema, field, resolveInputComponent} = context

  if (!field) {
    throw new Error(`Missing field for value ${value}`)
  }

  const fieldType = getFieldType(schema, field)

  let ResolvedInput
  try {
    ResolvedInput = resolveInputComponent(field, fieldType)
  } catch (error) {
    error.message = `Got error while resolving input component for field "${field.name}" of type ${fieldType.name}: ${error.message}.`
    throw error
  }

  const ResolvedContainer = ResolvedInput && ResolvedInput.valueContainer || DefaultContainer

  return ResolvedContainer.deserialize(value, context)
}

export function createFormBuilderState(value, {type, schema, resolveInputComponent}) {
  if (!resolveInputComponent) {
    debugger
  }
  const context = {
    schema: schema,
    field: {type: type.name},
    resolveInputComponent: resolveInputComponent
  }
  return createFieldValue(value, context)
}
