import {type ManifestV1Workspace} from '@sanity/manifest'
import {ConcreteRuleClass, type SchemaValidationValue, type Workspace} from 'sanity'

export function extractWorkspace(workspace: Workspace): ManifestV1Workspace {
  return {
    name: workspace.name,
    dataset: workspace.dataset,
    schema: JSON.parse(
      JSON.stringify(workspace.schema._original, (key, value) => {
        if (key === 'validation' && isSchemaValidationValue(value)) {
          return serializeValidation(value)
        }
        return value
      }),
    ),
  }
}

// TODO: Type output.
export function extractSchema(workspace: Workspace): any {
  return JSON.parse(
    JSON.stringify(workspace.schema._original, (key, value) => {
      if (key === 'validation' && isSchemaValidationValue(value)) {
        return serializeValidation(value)
      }
      return value
    }),
  )
}

// TODO: Simplify output format.
function serializeValidation(validation: SchemaValidationValue): SchemaValidationValue[] {
  const validationArray = Array.isArray(validation) ? validation : [validation]

  return validationArray
    .reduce<SchemaValidationValue[]>((output, validationValue) => {
      if (typeof validationValue === 'function') {
        const rule = new ConcreteRuleClass()
        const applied = validationValue(rule)

        // TODO: Deduplicate by flag.
        // TODO: Handle merging of validation rules for array items.
        return [...output, applied]
      }
      return output
    }, [])
    .flat()
}

function isSchemaValidationValue(
  maybeSchemaValidationValue: unknown,
): maybeSchemaValidationValue is SchemaValidationValue {
  if (Array.isArray(maybeSchemaValidationValue)) {
    return maybeSchemaValidationValue.every(isSchemaValidationValue)
  }

  // TODO: Errors with `fields() can only be called on an object type` when it encounters
  // the `fields` validation rule on a type that is not directly an `object`. This mayb be
  // because the validation rules aren't normalized.
  try {
    return (
      maybeSchemaValidationValue === false ||
      typeof maybeSchemaValidationValue === 'undefined' ||
      maybeSchemaValidationValue instanceof ConcreteRuleClass ||
      (typeof maybeSchemaValidationValue === 'function' &&
        isSchemaValidationValue(maybeSchemaValidationValue(new ConcreteRuleClass())))
    )
  } catch (error) {
    const hasMessage = 'message' in error

    if (!hasMessage || error.message !== 'fields() can only be called on an object type') {
      throw error
    }
  }

  return false
}
