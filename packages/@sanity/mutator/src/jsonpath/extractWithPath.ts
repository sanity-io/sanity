import extractAccessors from './extractAccessors'

export default function extractWithPath(path: string, value: Object): Array<any> {
  const accessors = extractAccessors(path, value)
  return accessors.map(acc => ({path: acc.path, value: acc.get()}))
}
