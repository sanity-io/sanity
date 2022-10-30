import {Box, Card} from '@sanity/ui'
import React, {ChangeEvent, createElement, useCallback} from 'react'
import {FILTERS} from '../../../config/filters'
import {FILTER_INPUT_TYPE_COMPONENTS} from '../../../config/inputTypes'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {CompoundSearchFilter, KeyedSearchFilter, SearchOperatorType} from '../../../types'
import {FilterTitle} from '../FilterTitle'
import {SelectOperators} from '../SelectOperators'

interface FilterFormProps {
  filter: CompoundSearchFilter
  title: string
}

// TODO: DRY with FieldFilterForm

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
      const nextFormState = FILTERS.compound[filter.id].form.find(
        (formState) => formState.operator === operatorType
      )

      dispatch({
        id: filter.id,
        operatorType,
        type: 'TERMS_FILTERS_COMPOUND_SET',
        value: nextFormState?.initialValue,
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
        <Box marginY={1} paddingRight={4}>
          {/* TODO: don't manually cast */}
          <FilterTitle filter={filter as KeyedSearchFilter} />
        </Box>
        {/* Operator */}
        {operatorTypes.length > 1 && (
          <Box marginTop={3}>
            <SelectOperators
              onChange={handleOperatorChange}
              operatorTypes={operatorTypes}
              value={filter.operatorType}
            />
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
