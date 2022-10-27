import {Select} from '@sanity/ui'
import React, {ChangeEvent} from 'react'
import {OPERATORS} from '../../config/operators'
import {SearchOperatorType} from '../../types'

interface SelectOperatorsProps {
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  operatorTypes: SearchOperatorType[]
  value?: SearchOperatorType
}

export function SelectOperators({onChange, operatorTypes, value}: SelectOperatorsProps) {
  return (
    <Select fontSize={1} onChange={onChange} value={value}>
      {operatorTypes.map((operatorType) => (
        <option key={operatorType} value={operatorType}>
          {OPERATORS[operatorType].label}
        </option>
      ))}
    </Select>
  )
}
