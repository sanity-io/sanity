import type {Expression} from '../jsonpath'
import type {ImmutableAccessor} from './ImmutableAccessor'

export function targetsToIndicies(targets: Expression[], accessor: ImmutableAccessor): number[] {
  const result: number[] = []
  targets.forEach((target) => {
    if (target.isIndexReference()) {
      result.push(...target.toIndicies(accessor))
    }
  })
  return result.sort()
}
