import {SerializeError} from '../SerializeError'
import {SerializePath} from '../StructureNodes'

const disallowed = /([^A-Za-z0-9-_])/

export function validateId(
  id: string,
  parentPath: SerializePath,
  pathSegment: string | number | undefined
): string {
  if (typeof id !== 'string') {
    throw new SerializeError(
      `Structure node id must be of type string, got ${typeof id}`,
      parentPath,
      pathSegment
    )
  }

  const [disallowedChar] = id.match(disallowed) || []
  if (disallowedChar) {
    throw new SerializeError(
      `Structure node id cannot contain character "${disallowedChar}"`,
      parentPath,
      pathSegment
    )
  }

  return id
}
