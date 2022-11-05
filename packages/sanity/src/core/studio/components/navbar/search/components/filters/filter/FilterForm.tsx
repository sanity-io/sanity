import {Box, Card, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator, getOperatorInitialValue, OperatorType} from '../../../definitions/operators'
import type {ValidatedFilterState} from '../../../types'
import {FilterDetails} from '../common/FilterDetails'
import {SelectOperators} from './SelectOperators'

interface FilterFormProps {
  filter: ValidatedFilterState
}

export function FilterForm({filter}: FilterFormProps) {
  const {dispatch} = useSearchState()

  const operator = filter.operatorType && getOperator(filter.operatorType)

  const handleOperatorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const operatorType = event.currentTarget.value as OperatorType

      const nextOperator = getOperator(operatorType)
      const initialValue = getOperatorInitialValue(operatorType)
      const inputComponentChanged = operator?.inputComponent != nextOperator?.inputComponent

      // Set initial value if new operator uses a different input component
      const value = inputComponentChanged ? initialValue : filter.value

      dispatch({
        fieldPath: filter.fieldPath,
        key: filter._key,
        operatorType,
        type: 'TERMS_FILTERS_SET',
        value,
      })
    },
    [dispatch, filter, operator?.inputComponent]
  )

  const handleValueChange = useCallback(
    (value: any) => {
      dispatch({
        fieldPath: filter?.fieldPath,
        key: filter._key,
        type: 'TERMS_FILTERS_SET',
        value,
      })
    },
    [dispatch, filter]
  )

  const Component = operator?.inputComponent

  return (
    <Box>
      <Card borderBottom padding={3}>
        <Stack space={3}>
          {/* Title */}
          <Box marginY={1}>
            <FilterDetails filter={filter} />
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
            // re-render on new operators
            key={filter.operatorType}
            onChange={handleValueChange}
            value={filter.value}
          />
        </Card>
      )}
    </Box>
  )
}
