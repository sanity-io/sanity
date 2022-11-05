import {Inline, Select} from '@sanity/ui'
import React, {ChangeEvent} from 'react'
import {getFilter} from '../../../definitions/filters'
import {getOperator, OperatorType} from '../../../definitions/operators'
import type {SearchFilterState} from '../../../types'

interface SelectOperatorsProps {
  filter: SearchFilterState
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  value?: OperatorType
}

export function SelectOperators({filter, onChange, value}: SelectOperatorsProps) {
  const operatorItems = getFilter(filter.filterType)?.operators

  if (!operatorItems || operatorItems.length < 1) {
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
                {operator?.label}
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
