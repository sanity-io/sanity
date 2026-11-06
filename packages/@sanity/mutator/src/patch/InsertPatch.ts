import {type Expression} from '../jsonpath'
import {type ImmutableAccessor} from './ImmutableAccessor'

// A half-open span of array indices, `[start, end)`
interface Region {
  start: number
  end: number
}

export class InsertPatch {
  location: string
  path: string
  items: unknown[]
  id: string

  constructor(id: string, location: string, path: string, items: unknown[]) {
    this.id = id
    this.location = location
    this.path = path
    this.items = items
  }

  apply(targets: Expression[], accessor: ImmutableAccessor): ImmutableAccessor {
    let result = accessor
    if (accessor.containerType() !== 'array') {
      // Insert targets only exist for arrays
      return result
    }

    const regions = targetsToRegions(targets, accessor.length())
    if (regions.length === 0) {
      return result
    }

    switch (this.location) {
      case 'before': {
        result = result.insertItemsAt(regions[0].start, this.items)
        break
      }
      case 'after': {
        result = result.insertItemsAt(regions[regions.length - 1].end, this.items)
        break
      }
      case 'replace': {
        // Every region is replaced by the items. Work backwards so earlier regions keep their
        // positions.
        for (let i = regions.length - 1; i >= 0; i--) {
          const {start, end} = regions[i]
          const indices = Array.from({length: end - start}, (_, offset) => start + offset)
          result = result.unsetIndices(indices).insertItemsAt(start, this.items)
        }
        break
      }
      default: {
        throw new Error(`Unsupported location atm: ${this.location}`)
      }
    }
    return result
  }
}

// Sorted regions where overlapping matches are joined. Adjacent regions are kept apart, so that
// `[1, 2]` replaces two items with two copies of the items rather than one.
function targetsToRegions(targets: Expression[], length: number): Region[] {
  const regions = targets
    .map((target) => targetToRegion(target, length))
    .filter((region): region is Region => region !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const result: Region[] = []
  for (const region of regions) {
    const last = result.at(-1)
    if (last && region.start === last.start && region.end === last.end) {
      continue
    }
    if (last && region.start < last.end) {
      last.end = Math.max(last.end, region.end)
      continue
    }
    result.push({...region})
  }
  return result
}

function targetToRegion(target: Expression, length: number): Region | null {
  const {expr} = target
  if (expr.type === 'index') {
    if (length === 0) {
      // Any index into an empty array points at its only position
      return {start: 0, end: 0}
    }
    const index = expr.value < 0 ? expr.value + length : expr.value
    return index >= 0 && index < length ? {start: index, end: index + 1} : null
  }

  if (expr.type === 'range') {
    const start = clampIndex(expr.start ?? 0, length)
    const end = clampIndex(expr.end ?? length, length)
    return {start, end: Math.max(start, end)}
  }

  return null
}

function clampIndex(index: number, length: number): number {
  const absolute = index < 0 ? index + length : index
  return Math.min(Math.max(absolute, 0), length)
}
