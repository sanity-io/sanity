const SPECIAL_CHARS = /([^!@#$%^&*(),\\/?";:{}|[\]+<>\s-])+/g
const STRIP_EDGE_CHARS = /(^[.]+)|([.]+$)/

export function tokenize(string: string): string[] {
  return (string.match(SPECIAL_CHARS) || []).map((token) => token.replace(STRIP_EDGE_CHARS, ''))
}
