import {Box, Card, Select, Text} from '@sanity/ui'
import React, {ChangeEvent, createElement, useCallback} from 'react'
import {FILTERS} from '../../../config/filters'
import {FILTER_INPUT_TYPE_COMPONENTS} from '../../../config/inputTypes'
import {OPERATORS} from '../../../config/operators'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {CompoundSearchFilter, SearchOperatorType} from '../../../types'

interface FilterFormProps {
  filter: CompoundSearchFilter
  title: string
}

export function CompoundFilterForm({filter, title}: FilterFormProps) {
  const {dispatch} = useSearchState()

  const operatorTypes = FILTERS.compound[filter.id].form.map((v) => v.operator)
  // Default to first form state if no operatorType provided
  // TODO: refactor
  const currentFormState = filter.operatorType
    ? FILTERS.compound[filter.id].form.find(
        (formState) => formState.operator === filter.operatorType
      )
    : FILTERS.compound[filter.id].form?.[0]

  const handleOperatorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const operatorType = event.currentTarget.value as SearchOperatorType
      dispatch({
        id: filter.id,
        operatorType,
        type: 'TERMS_FILTERS_COMPOUND_SET',
        value: null,
      })
    },
    [dispatch, filter]
  )

  const handleValueChange = useCallback(
    (value: any) => {
      dispatch({
        id: filter.id,
        type: 'TERMS_FILTERS_COMPOUND_SET',
        value,
      })
    },
    [dispatch, filter.id]
  )

  return (
    <Box>
      <Card borderBottom padding={3}>
        {/* Title */}
        <Box marginY={1}>
          <Text size={1} weight="medium">
            {title}
          </Text>
        </Box>
        {/* Operator */}
        {operatorTypes.length > 1 && (
          <Box marginTop={3}>
            <Select fontSize={1} onChange={handleOperatorChange} value={filter.operatorType}>
              {operatorTypes.map((operatorType) => (
                <option key={operatorType} value={operatorType}>
                  {OPERATORS[operatorType].label}
                </option>
              ))}
            </Select>
          </Box>
        )}
      </Card>
      {/* Value */}
      {currentFormState?.input && (
        <Card padding={3}>
          {createElement(FILTER_INPUT_TYPE_COMPONENTS[currentFormState.input], {
            filter,
            inputType: currentFormState.input,
            onChange: handleValueChange,
          })}
        </Card>
      )}
    </Box>
  )
}
