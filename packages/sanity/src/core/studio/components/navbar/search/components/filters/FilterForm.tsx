import {Box, Card, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {SearchOperatorType} from '../../definitions/operators/types'
import type {ValidatedFilter} from '../../types'
import {getOperator} from '../../utils/getOperator'
import {getOperatorInitialValue} from '../../utils/getOperatorInitialValue'
import {FilterTitle} from './FilterTitle'
import {SelectOperators} from './SelectOperators'

interface FilterFormProps {
  filter: ValidatedFilter
}

export function FilterForm({filter}: FilterFormProps) {
  const {dispatch} = useSearchState()

  const operator = getOperator(filter.operatorType)

  const handleOperatorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const operatorType = event.currentTarget.value as SearchOperatorType

      const nextOperator = getOperator(operatorType)
      const initialValue = getOperatorInitialValue(operatorType)

      const inputComponentChanged = operator?.inputComponent != nextOperator?.inputComponent

      // Set initial value if new operator uses a different input component
      const value = inputComponentChanged ? initialValue : filter.value

      if (filter.type === 'custom') {
        dispatch({
          key: filter._key,
          operatorType,
          type: 'TERMS_FILTERS_CUSTOM_SET',
          value,
        })
      }

      if (filter.type === 'field') {
        dispatch({
          fieldPath: filter.fieldPath,
          key: filter._key,
          operatorType,
          type: 'TERMS_FILTERS_FIELD_SET',
          value,
        })
      }
    },
    [dispatch, filter, operator?.inputComponent]
  )

  const handleValueChange = useCallback(
    (value: any) => {
      if (filter.type === 'custom') {
        dispatch({
          key: filter._key,
          type: 'TERMS_FILTERS_CUSTOM_SET',
          value,
        })
      }

      if (filter.type === 'field') {
        dispatch({
          fieldPath: filter.fieldPath,
          key: filter._key,
          type: 'TERMS_FILTERS_FIELD_SET',
          value,
        })
      }
    },
    [dispatch, filter]
  )

  const Component = operator.inputComponent

  return (
    <Box>
      <Card borderBottom padding={3}>
        <Stack space={3}>
          {/* Title */}
          <Box marginY={1}>
            <FilterTitle filter={filter} />
          </Box>
          {/* Operator */}
          <SelectOperators
            filter={filter}
            onChange={handleOperatorChange}
            value={filter.operatorType}
          />
        </Stack>
      </Card>

      {/* Value */}
      {Component && (
        <Card padding={3}>
          <Component
            filter={filter}
            // re-render on new operators
            key={filter.operatorType}
            onChange={handleValueChange}
          />
        </Card>
      )}
    </Box>
  )
}
