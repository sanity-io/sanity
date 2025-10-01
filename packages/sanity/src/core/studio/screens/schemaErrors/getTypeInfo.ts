import {type SchemaValidationProblemGroup} from '@sanity/types'

export function getTypeInfo(
  problem: SchemaValidationProblemGroup,
): {name: string; type: string} | null {
  // note: unsure if the first segment here can ever be anything else than a type
  // a possible API improvement is to add schemaType info to the problem group interface itself
  const first = problem.path[0]
  if (first.kind === 'type') {
    return {name: first.name || `<anonymous ${first.type}>`, type: first.type}
  }
  return null
}
