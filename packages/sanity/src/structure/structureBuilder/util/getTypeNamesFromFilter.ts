/** @internal */
export function getTypeNamesFromFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] {
  let typeNames = getTypeNamesFromEqualityFilter(filter, params)

  if (typeNames.length === 0) {
    typeNames = getTypeNamesFromInTypesFilter(filter, params)
  }

  return typeNames
}

// From _type == "movie" || _type == $otherType
function getTypeNamesFromEqualityFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] {
  const pattern =
    /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type/g
  const matches: string[] = []
  let match
  while ((match = pattern.exec(filter)) !== null) {
    matches.push(match[1] || match[2])
  }

  return matches
    .map((candidate) => {
      const typeName = candidate[0] === '$' ? params[candidate.slice(1)] : candidate
      const normalized = ((typeName as string) || '').trim().replace(/^["']|["']$/g, '')
      return normalized
    })
    .filter(Boolean)
}

// From _type in ["dog", "cat", $otherSpecies]
function getTypeNamesFromInTypesFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] {
  const pattern = /\b_type\s+in\s+\[(.*?)\]/
  const matches = filter.match(pattern)
  if (!matches) {
    return []
  }

  return matches[1]
    .split(/,\s*/)
    .map((match) => match.trim().replace(/^["']+|["']+$/g, ''))
    .map((item) => (item[0] === '$' ? params[item.slice(1)] : item))
    .filter(Boolean) as string[]
}
