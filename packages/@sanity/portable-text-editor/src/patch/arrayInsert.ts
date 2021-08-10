export const BEFORE = 'before'
export const AFTER = 'after'

export default function insert(array: any[], position: string, index: number, ...args: any[]) {
  if (position !== BEFORE && position !== AFTER) {
    throw new Error(`Invalid position "${position}", must be either ${BEFORE} or ${AFTER}`)
  }

  const items = flatten(...args)

  if (array.length === 0) {
    return items
  }

  const len = array.length
  const idx = Math.abs((len + index) % len) % len

  const normalizedIdx = position === 'after' ? idx + 1 : idx

  const copy = array.slice()
  copy.splice(normalizedIdx, 0, ...flatten(items))
  return copy
}

function flatten(...values: any[]) {
  return values.reduce((prev, item) => prev.concat(item), [])
}
