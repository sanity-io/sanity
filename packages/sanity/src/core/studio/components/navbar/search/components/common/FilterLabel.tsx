import {Inline, Text} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getOperator} from '../../definitions/operators'
import type {SearchFilter} from '../../types'
import {FilterTitle} from './FilterTitle'

interface FilterLabelProps {
  filter: SearchFilter
  fontSize?: number
  showContent?: boolean
}

export function FilterLabel({filter, fontSize = 1, showContent = true}: FilterLabelProps) {
  const {
    state: {definitions},
  } = useSearchState()

  const operator = getOperator(definitions.operators, filter.operatorType)

  const ButtonValue = operator?.buttonValueComponent

  return (
    <Inline space={1}>
      {/* Title */}
      <Text size={fontSize} weight="medium">
        <FilterTitle filter={filter} />
      </Text>
      {/* Operator */}
      {showContent && operator?.buttonLabel && (
        <Text muted size={fontSize} weight="regular">
          {operator.buttonLabel}
        </Text>
      )}
      {/* Value */}
      {showContent && ButtonValue && (
        <Text size={fontSize} textOverflow="ellipsis" weight="medium">
          <ButtonValue value={filter.value} />
        </Text>
      )}
    </Inline>
  )
}
