/**
 * Define a GROQ query. This is a no-op, but it helps editor integrations
 * understand that a string represents a GROQ query in order to provide syntax highlighting
 * and other features.
 *
 * Ideally the `groq` template tag would be used, but we cannot infer types from it until
 * microsoft/TypeScript#33304 is resolved. Otherwise, there is no difference between this
 * and the `groq` template tag.
 *
 * @param query - The GROQ query
 * @returns The same string as the input
 * @public
 */
export function defineQuery<const Q extends string>(query: Q): Q {
  return query
}
