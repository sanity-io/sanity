import {isBoolean} from 'lodash'
import pluralize from 'pluralize-esm'
import type {CompoundSearchFilter, FieldSearchFilter, SearchFilter} from '../../types'

export function getFilterValue(filter: SearchFilter): string {
  let value = ''
  if (filter.type === 'compound') {
    value = getCompoundValue(filter)
  }

  if (filter.type === 'field') {
    value = getFieldValue(filter)
  }

  return value
}

function getCompoundValue(filter: CompoundSearchFilter) {
  switch (filter.id) {
    case 'hasDraft':
    case 'isPublished':
      if (typeof filter.value === 'undefined') {
        return null
      }
      return filter.value ? 'True' : 'False'
    case 'hasReference':
      return filter?.value ? filter.value.slice(0, 8) : ''
    default:
      return filter?.value
  }
}

function getFieldValue(filter: FieldSearchFilter) {
  let value
  const fieldValue: string[] = []

  switch (filter.fieldType) {
    case 'array':
      value = filter?.value && `${filter.value} ${pluralize('item', filter.value)}`
      break
    case 'boolean':
      if (isBoolean(filter.value)) {
        value = filter.value ? 'True' : 'False'
      }
      break
    case 'date':
    case 'datetime':
      if (filter.operatorType === 'dateLast') {
        if (filter?.value?.value && filter?.value?.unit) {
          value = `${filter.value.value} ${filter.value.unit}`
        }
      } else if (filter.operatorType === 'dateRange') {
        if (filter?.value?.min && filter?.value?.max) {
          value = `${filter.value.min} → ${filter.value.max}`
        }
      } else {
        value = filter?.value
      }
      break
    case 'number':
      if (filter.operatorType === 'numberRange') {
        if (filter?.value?.min && filter?.value?.max) {
          value = `${filter.value.min} – ${filter.value.max}`
        }
      } else {
        value = filter?.value
      }
      break
    case 'reference':
      value = filter?.value?.slice(0, 8)
      break
    default:
      value = filter?.value
      break
  }

  if (value) {
    fieldValue.push(value)
  }

  return fieldValue.join(' ')
}
