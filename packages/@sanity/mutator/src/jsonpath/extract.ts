import extractAccessors from './extractAccessors'

export default function extract(path: string, value: Object): Array<any> {
  const accessors = extractAccessors(path, value)
  return accessors.map(acc => acc.get())
}
