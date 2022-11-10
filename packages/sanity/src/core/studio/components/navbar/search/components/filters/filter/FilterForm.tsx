import {Box, Card, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {getOperator} from '../../../definitions/operators'
import {SearchOperatorInput} from '../../../definitions/operators/operatorTypes'
import type {SearchFilter} from '../../../types'
import {FilterDetails} from '../common/FilterDetails'
import {OperatorsMenuButton} from './OperatorsMenuButton'

interface FilterFormProps {
  filter: SearchFilter
}

export function FilterForm({filter}: FilterFormProps) {
  const {
    dispatch,
    fieldRegistry,
    state: {definitions},
  } = useSearchState()

  const filterDefinition = getFilterDefinition(definitions.filters, filter.filterType)
  const operator = getOperator(definitions.operators, filter.operatorType)
  const resolvedField = fieldRegistry.find((f) => f._key === filter._key)

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
            options={resolvedField?.options}
            value={filter.value}
          />
        </Card>
      )}
    </Box>
  )
}
