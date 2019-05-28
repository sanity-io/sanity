export function ndjsonToArray(ndjson: string | Buffer) {
  return ndjson
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map((line: string) => JSON.parse(line))
}
