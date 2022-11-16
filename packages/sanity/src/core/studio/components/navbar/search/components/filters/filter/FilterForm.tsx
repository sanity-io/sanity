import {Box, Card, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {getOperator} from '../../../definitions/operators'
import {SearchOperatorInput} from '../../../definitions/operators/operatorTypes'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter, getFilterKey} from '../../../utils/filterUtils'
import {FilterDetails} from '../common/FilterDetails'
import {OperatorsMenuButton} from './OperatorsMenuButton'

interface FilterFormProps {
  filter: SearchFilter
}

export function FilterForm({filter}: FilterFormProps) {
  const {
    dispatch,
    state: {definitions},
  } = useSearchState()

  const filterDefinition = getFilterDefinition(definitions.filters, filter.filterType)
  const operator = getOperator(definitions.operators, filter.operatorType)
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)
  const filterKey = getFilterKey(filter)

  const handleValueChange = useCallback(
    (value: any) => {
      dispatch({
        filterKey: filterKey,
        type: 'TERMS_FILTERS_SET_VALUE',
        value,
      })
    },
    [dispatch, filterKey]
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

          {/* Description (optional) */}
          {filterDefinition?.description && (
            <Card border padding={3} radius={2} tone="transparent">
              <Text muted size={1}>
                {filterDefinition.description}
              </Text>
            </Card>
          )}

          {/* Operator */}
          <OperatorsMenuButton filter={filter} operator={operator} />
        </Stack>
      </Card>

      {/* Value */}
      {Component && (
        <Card padding={3}>
          <Component
            // re-render on new operators
            key={filter.operatorType}
            onChange={handleValueChange}
            options={fieldDefinition?.options}
            value={filter.value}
          />
        </Card>
      )}
    </Box>
  )
}
