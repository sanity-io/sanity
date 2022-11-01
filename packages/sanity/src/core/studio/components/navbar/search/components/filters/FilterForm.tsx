import {Box, Card, Text} from '@sanity/ui'
import React, {ChangeEvent, createElement, useCallback} from 'react'
import {FilterFormState, FILTERS} from '../../config/filters'
import {FILTER_INPUT_TYPE_COMPONENTS} from '../../config/inputTypes'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {KeyedSearchFilter, SearchOperatorType} from '../../types'
import {SelectOperators} from './SelectOperators'

interface FilterFormProps {
  filter: KeyedSearchFilter
  title: string
}

export function FilterForm({filter, title}: FilterFormProps) {
  const {dispatch} = useSearchState()

  let operatorTypes: SearchOperatorType[] = []
  switch (filter.type) {
    case 'compound':
      operatorTypes = FILTERS[filter.type][filter.id].form.map((v) => v.operator)
      break
    case 'field':
      operatorTypes = FILTERS[filter.type][filter.fieldType].form.map((v) => v.operator)
      break
    default:
      break
  }
  // Default to first form state if no operatorType provided
  // TODO: refactor
  const currentFormState = getFormState(filter, filter.operatorType)

  const handleOperatorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const operatorType = event.currentTarget.value as SearchOperatorType
      const nextFormState = getFormState(filter, operatorType)

      if (filter.type === 'compound') {
        dispatch({
          key: filter._key,
          operatorType,
          type: 'TERMS_FILTERS_COMPOUND_SET',
          value: nextFormState?.initialValue,
        })
      }

      if (filter.type === 'field') {
        dispatch({
          fieldPath: filter.fieldPath,
          key: filter._key,
          operatorType,
          type: 'TERMS_FILTERS_FIELD_SET',
          value: nextFormState?.initialValue,
        })
      }
    },
    [dispatch, filter]
  )

  const handleValueChange = useCallback(
    (value: any) => {
      if (filter.type === 'compound') {
        dispatch({
          key: filter._key,
          type: 'TERMS_FILTERS_COMPOUND_SET',
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

// TODO: refactor
function getFormState(
  filter: KeyedSearchFilter,
  operatorType?: SearchOperatorType
): FilterFormState | undefined {
  if (filter.type === 'compound') {
    return filter.operatorType
      ? FILTERS.compound[filter.id].form.find((formState) => formState.operator === operatorType)
      : FILTERS.compound[filter.id].form?.[0]
  }

  if (filter.type === 'field') {
    return filter.operatorType
      ? FILTERS.field[filter.fieldType].form.find(
          (formState) => formState.operator === operatorType
        )
      : FILTERS.field[filter.fieldType].form?.[0]
  }

  return undefined
}
