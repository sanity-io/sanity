import {releaseMetadataCoreFieldNames} from '../../builtinTypes/releaseMetadata'
import {error} from '../createValidationResult'

const CORE_FIELD_JSON_TYPE = 'string'

function resolveJsonType(typeName: unknown, visitorContext: any): string | undefined {
  const seen = new Set<string>()
  let current = typeName
  while (typeof current === 'string' && !seen.has(current)) {
    seen.add(current)
    const type = visitorContext.getType(current)
    if (!type) return undefined
    if (typeof type.jsonType === 'string') return type.jsonType
    current = type.type
  }
  return undefined
}

/**
 * A schema may replace `sanity.releaseMetadata`, but the release actions and
 * the releases tool still read and write its core fields as strings.
 */
export default (typeDef: any, visitorContext: any) => {
  if (typeDef.type !== 'object') {
    return {
      ...typeDef,
      _problems: [
        error(`The "${typeDef.name}" type must be an object type, but it is "${typeDef.type}".`),
      ],
    }
  }

  const fields: unknown[] = Array.isArray(typeDef.fields) ? typeDef.fields : []
  const problems = fields.flatMap((field: any) => {
    if (!field || !releaseMetadataCoreFieldNames.includes(field.name)) return []
    const jsonType = resolveJsonType(field.type, visitorContext)
    if (jsonType === undefined || jsonType === CORE_FIELD_JSON_TYPE) return []
    return [
      error(
        `The "${field.name}" field of "${typeDef.name}" must store a ${CORE_FIELD_JSON_TYPE}, but its type "${field.type}" stores ${jsonType === 'object' || jsonType === 'array' ? 'an' : 'a'} ${jsonType}.`,
      ),
    ]
  })

  return {
    ...typeDef,
    _problems: problems,
  }
}
