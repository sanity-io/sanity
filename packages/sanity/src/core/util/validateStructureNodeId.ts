const DISALLOWED_PATTERN = /([^A-Za-z0-9-_.])/

// Structure Tool reserves this prefix for the panes it synthesises when an
// intent cannot be resolved to a structure node.
const RESERVED_PREFIX = '__edit__'

/**
 * The outcome of validating a Structure Tool node id. Invalid results carry a
 * `reason` and the details needed to build a message, leaving it to the caller
 * to decide whether to throw, aggregate, or reword the problem.
 *
 * @internal
 */
export type StructureNodeIdValidationResult =
  | {isValid: true}
  | {isValid: false; reason: 'invalidType'; type: string}
  | {isValid: false; reason: 'disallowedCharacter'; character: string}
  | {isValid: false; reason: 'reservedPrefix'; prefix: string}

/**
 * Validates that `id` can be used as a Structure Tool node id: a string using
 * only `[A-Za-z0-9-_.]` that does not start with the reserved `__edit__` prefix.
 *
 * @internal
 */
export function validateStructureNodeId(id: unknown): StructureNodeIdValidationResult {
  if (typeof id !== 'string') {
    return {isValid: false, reason: 'invalidType', type: typeof id}
  }

  const [disallowedCharacter] = id.match(DISALLOWED_PATTERN) || []
  if (disallowedCharacter) {
    return {isValid: false, reason: 'disallowedCharacter', character: disallowedCharacter}
  }

  if (id.startsWith(RESERVED_PREFIX)) {
    return {isValid: false, reason: 'reservedPrefix', prefix: RESERVED_PREFIX}
  }

  return {isValid: true}
}
