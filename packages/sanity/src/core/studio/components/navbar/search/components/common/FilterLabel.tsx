import {Inline, Text} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getOperator} from '../../definitions/operators'
import type {SearchFilter} from '../../types'
import {FilterTitle} from './FilterTitle'

interface FilterLabelProps {
  filter: SearchFilter
  showContent?: boolean
}

export function FilterLabel({filter, showContent = true}: FilterLabelProps) {
  const {
    state: {definitions},
  } = useSearchState()

  const operator = getOperator(definitions.operators, filter.operatorType)
  const value = operator?.buttonValue && operator.buttonValue(filter.value)

  return (
    <Inline space={1}>
      {/* Icon */}
      {/*
      <Box marginRight={1}>
        <Text size={1}>
          <FilterIcon filter={filter} />
        </Text>
      </Box>
      */}
      {/* Title */}
      <Text size={1} weight="medium">
        <FilterTitle filter={filter} />
      </Text>
      {/* Operator */}
      {showContent && operator?.buttonLabel && (
        <Text muted size={1} weight="regular">
          {operator.buttonLabel}
        </Text>
      )}
      {/* Value */}
      {showContent && (
        <Text size={1} textOverflow="ellipsis" weight="medium">
          {value}
        </Text>
      )}
    </Inline>
  )
}
