/* eslint-disable complexity */
import pluralize from 'pluralize-esm'
import React from 'react'
import {FILTERS} from '../../config/filters'
import {OPERATORS} from '../../config/operators'
import type {CompoundSearchFilter, FieldSearchFilter, SearchFilter} from '../../types'

interface FilterButtonValueProps {
  filter: SearchFilter
}

export function FilterButtonValue({filter}: FilterButtonValueProps) {
  if (filter.type === 'compound') {
    return (
      <span>
        {/* Value */}
        {` ${getCompoundValue(filter)}`}
      </span>
    )
  }

  if (filter.type === 'field') {
    const hasMultipleOperators = Object.keys(FILTERS.field[filter.fieldType].form).length > 1
    return <span>{getFieldValue(filter, hasMultipleOperators)}</span>
  }

  return null
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

function getFieldValue(filter: FieldSearchFilter, hasMultipleOperators: boolean) {
  switch (filter.operatorType) {
    case 'empty':
    case 'notEmpty':
      return ` ${OPERATORS[filter.operatorType].buttonLabel}`
    default:
      break
  }

  const operator = filter?.operatorType && OPERATORS[filter.operatorType].buttonLabel
  let showOperator = true
  let value
  const fieldValue: string[] = []

  switch (filter.fieldType) {
    case 'array':
      value = filter?.value && `${filter.value} ${pluralize('item', filter.value)}`
      break
    case 'boolean':
      if (typeof filter.value !== 'undefined') {
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
        showOperator = false
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
    case 'string':
    case 'text':
      switch (filter.operatorType) {
        case 'equalTo':
          showOperator = false
          value = filter?.value && `"${filter.value}"`
          break
        case 'matches':
          showOperator = false
          value = filter?.value
          break
        case 'notEqualTo':
          value = filter?.value && `"${filter.value}"`
          break
        default:
          value = filter?.value
          break
      }
      break
    default:
      value = filter?.value
      break
  }

  if (operator && value && hasMultipleOperators && showOperator) {
    fieldValue.push(operator)
  }
  if (value) {
    fieldValue.push(value)
  }
  if (operator || value) {
    fieldValue.unshift(' ')
  }

  return fieldValue.join(' ')
}
