import {isBoolean} from 'lodash'
import pluralize from 'pluralize-esm'
import type {SearchFilter} from '../../../types'

export function getFilterValue(filterState: SearchFilter): string {
  let value
  const fieldValue: string[] = []

  switch (filterState.filterType) {
    case 'array':
      value = filterState?.value && `${filterState.value} ${pluralize('item', filterState.value)}`
      break
    case 'boolean':
      if (isBoolean(filterState.value)) {
        value = filterState.value ? 'True' : 'False'
      }
      break
    case 'date':
    case 'datetime':
      switch (filterState.operatorType) {
        case 'dateLast':
          if (filterState?.value?.value && filterState?.value?.unit) {
            value = `${filterState.value.value} ${filterState.value.unit}`
          }
          break
        case 'dateRange':
          if (filterState?.value?.min && filterState?.value?.max) {
            value = `${filterState.value.min} → ${filterState.value.max}`
          }
          break
        default:
          value = filterState?.value
      }
      break
    case 'number':
      if (filterState.operatorType === 'numberRange') {
        if (filterState?.value?.min && filterState?.value?.max) {
          value = `${filterState.value.min} – ${filterState.value.max}`
        }
      } else {
        value = filterState?.value
      }
      break
    case 'reference':
    case 'references':
      value = filterState?.value?.slice(0, 8)
      break
    default:
      value = filterState?.value
      break
  }

  if (value) {
    fieldValue.push(value)
  }

  return fieldValue.join(' ')
}
