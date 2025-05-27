import {useChangeIndicatorsReportedValues} from './tracker'

export function useHoveredChange() {
  const reportedValues = useChangeIndicatorsReportedValues()
  const hoveredEntry = reportedValues.find(([key, change]) => change.hasHover)
  if (hoveredEntry) {
    const [, change] = hoveredEntry
    return change
  }
  return undefined
}
