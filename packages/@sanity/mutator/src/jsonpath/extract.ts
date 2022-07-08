import {extractAccessors} from './extractAccessors'

export function extract(path: string, value: unknown): unknown[] {
  const accessors = extractAccessors(path, value)
  return accessors.map((acc) => acc.get())
}
