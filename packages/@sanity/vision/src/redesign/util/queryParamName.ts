/** A `$name` GROQ can reference. An empty name is what a bare `$` parses as, and is not a key. */
export function isQueryParamName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}
