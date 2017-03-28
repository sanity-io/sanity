import PrimitiveValueContainer from './PrimitiveValueContainer'

export function createMemberValue(value, context) {

  const {type, resolveInputComponent} = context

  let ResolvedInput
  try {
    ResolvedInput = resolveInputComponent(type)
  } catch (error) {
    error.message = `Got error while resolving input component for type "${type.name}": ${error.message}.`
    throw error
  }

  const ResolvedContainer = (ResolvedInput && ResolvedInput.valueContainer) || PrimitiveValueContainer

  return ResolvedContainer.deserialize(value, context)
}

export function createFormBuilderState(value, context) {
  return createMemberValue(value, context)
}
