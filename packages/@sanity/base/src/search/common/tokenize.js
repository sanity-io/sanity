const pattern = /([^\s,]+)/g

export function tokenize(string) {
  return string.match(pattern) || []
}
