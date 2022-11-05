import {Box, Card, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator, getOperatorInitialValue, OperatorType} from '../../../definitions/operators'
import type {ValidatedFilterState} from '../../../types'
import {FilterDetails} from '../common/FilterDetails'
import {OperatorsMenuButton} from './SelectOperators'

interface FilterFormProps {
  filter: ValidatedFilterState
}

export function FilterForm({filter}: FilterFormProps) {
  const {dispatch} = useSearchState()

  const operator = filter.operatorType && getOperator(filter.operatorType)

  const handleValueChange = useCallback(
    (value: any) => {
      dispatch({
        key: filter._key,
        type: 'TERMS_FILTERS_SET_VALUE',
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
          <OperatorsMenuButton filter={filter} operator={getOperator(filter.operatorType)} />
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
