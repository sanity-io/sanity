export function toError(caughtError: unknown): Error {
  return caughtError instanceof Error ? caughtError : new Error(String(caughtError))
}

export function buildChangesQuery(options: {excludeUnpublishes?: boolean} = {}): string {
  const filter = options.excludeUnpublishes ? ' && _system.delete != true' : ''
  return `*[sanity::partOfRelease($releaseName)${filter}]{
  _id,
  _type,
  "after": @,
  "before": *[_id == string::split(^._id, ".")[2]][0]
}`
}
