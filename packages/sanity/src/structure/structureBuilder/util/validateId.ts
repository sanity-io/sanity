import {type StructureNodeIdValidationResult, validateStructureNodeId} from 'sanity'

import {SerializeError} from '../SerializeError'
import {type SerializePath} from '../StructureNodes'

export function validateId(
  id: string,
  parentPath: SerializePath,
  pathSegment: string | number | undefined,
): string {
  const result = validateStructureNodeId(id)

  if (!result.isValid) {
    throw new SerializeError(getErrorMessage(result), parentPath, pathSegment)
  }

  return id
}

function getErrorMessage(
  result: Exclude<StructureNodeIdValidationResult, {isValid: true}>,
): string {
  switch (result.reason) {
    case 'invalidType':
      return `Structure node id must be of type string, got ${result.type}`
    case 'disallowedCharacter':
      return `Structure node id cannot contain character "${result.character}"`
    case 'reservedPrefix':
      return `Structure node id cannot start with ${result.prefix}`
    default: {
      const unknownResult: never = result
      throw new Error(
        `Unknown structure node id validation result: ${JSON.stringify(unknownResult)}`,
      )
    }
  }
}
