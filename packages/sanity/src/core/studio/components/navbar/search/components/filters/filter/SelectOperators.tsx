import {Inline, Select} from '@sanity/ui'
import React, {ChangeEvent} from 'react'
import {FILTERS} from '../../../definitions/filters'
import type {MenuFieldOperatorItem, SearchOperatorType} from '../../../definitions/operators/types'
import type {SearchFilter} from '../../../types'
import {getOperator} from '../../../utils/getOperator'

interface SelectOperatorsProps {
  filter: SearchFilter
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  value?: SearchOperatorType
}

export function SelectOperators({filter, onChange, value}: SelectOperatorsProps) {
  let operatorItems: MenuFieldOperatorItem<any>[] = []
  switch (filter.type) {
    case 'custom':
      operatorItems = []
      break
    case 'field': {
      operatorItems = FILTERS[filter.type][filter.fieldType].operators
      break
    }
    default:
      break
  }

  if (operatorItems.length < 1) {
    return null
  }

  return (
    <Inline>
      <Select fontSize={1} onChange={onChange} radius={2} value={value}>
        {operatorItems.map((item, index) => {
          if (item.type === 'item') {
            const operator = getOperator(item.name)
            return (
              <option
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                value={item.name}
              >
                {operator.label}
              </option>
            )
          }
          if (item.type === 'divider') {
            return (
              <option
                disabled
                // eslint-disable-next-line react/no-array-index-key
                key={index}
              >
                -
              </option>
            )
          }
          return null
        })}
      </Select>
    </Inline>
  )
}
