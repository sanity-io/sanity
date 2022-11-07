import {Box, Card, Stack} from '@sanity/ui'
import React, {ComponentType, useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {FilterDetails} from '../common/FilterDetails'
import {OperatorsMenuButton} from './OperatorsMenuButton'
import {SearchOperatorInput} from '../../../definitions/operators/operatorTypes'

interface FilterFormProps {
  filter: SearchFilter
}

export function FilterForm({filter}: FilterFormProps) {
  const {
    dispatch,
    state: {definitions},
  } = useSearchState()

  const operator = getOperator(definitions.operators, filter.operatorType)

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

  const Component: SearchOperatorInput<any> | undefined = operator?.inputComponent

  return (
    <Box>
      <Card borderBottom padding={3}>
        <Stack space={3}>
          {/* Title */}
          <Box marginY={1} paddingRight={2}>
            <FilterDetails filter={filter} />
          </Box>
          {/* Operator */}
          <OperatorsMenuButton
            filter={filter}
            operator={getOperator(definitions.operators, filter.operatorType)}
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
