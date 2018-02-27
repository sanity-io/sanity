import Expression from '../jsonpath/Expression'

/* eslint-disable import/prefer-default-export */

export function targetsToIndicies(targets: Array<Expression>, accessor: any) {
  const result = []
  targets.forEach(target => {
    if (target.isIndexReference()) {
      result.push(...target.toIndicies(accessor))
    }
  })
  return result.sort()
}
