export function targetsToIndicies(targets, accessor) {
  const result = []
  targets.forEach((target) => {
    if (target.isIndexReference()) {
      result.push(...target.toIndicies(accessor))
    }
  })
  return result.sort()
}
