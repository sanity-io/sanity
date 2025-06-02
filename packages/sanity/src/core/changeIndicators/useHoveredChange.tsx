import {useChangeIndicatorsReportedValues} from './tracker'

export function useHoveredChange() {
  const reportedValues = useChangeIndicatorsReportedValues()

  const hoveredEntry = reportedValues
    .filter(([key, change]) => change.hasHover)
    .sort((a, b) => {
      // return the one with the longest path.
      return b[1].path.length - a[1].path.length
    })[0]

  if (hoveredEntry) {
    const [, change] = hoveredEntry
    return change
  }
  return undefined
}
