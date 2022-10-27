import {Box, Card, Text} from '@sanity/ui'
import React, {ChangeEvent, createElement, useCallback} from 'react'
import {FILTERS} from '../../../config/filters'
import {FILTER_INPUT_TYPE_COMPONENTS} from '../../../config/inputTypes'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {FieldSearchFilter, SearchOperatorType} from '../../../types'
import {SelectOperators} from '../SelectOperators'

interface FilterFormProps {
  filter: FieldSearchFilter
  title: string
}

// TODO: DRY with CompoundFilterForm

export function FieldFilterForm({filter, title}: FilterFormProps) {
  const {dispatch} = useSearchState()

  const operatorTypes = FILTERS.field[filter.fieldType].form.map((v) => v.operator)
  // Default to first form state if no operatorType provided
  // TODO: refactor
  const currentFormState = filter.operatorType
    ? FILTERS.field[filter.fieldType].form.find(
        (formState) => formState.operator === filter.operatorType
      )
    : FILTERS.field[filter.fieldType].form?.[0]

  const handleOperatorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const operatorType = event.currentTarget.value as SearchOperatorType
      const nextFormState = FILTERS.field[filter.fieldType].form.find(
        (formState) => formState.operator === operatorType
      )

      dispatch({
        fieldPath: filter.fieldPath,
        operatorType,
        type: 'TERMS_FILTERS_FIELD_SET',
        value: nextFormState?.initialValue,
      })
    },
    [dispatch, filter.fieldPath, filter.fieldType]
  )

  const handleValueChange = useCallback(
    (value: any) => {
      dispatch({
        fieldPath: filter.fieldPath,
        type: 'TERMS_FILTERS_FIELD_SET',
        value,
      })
    },
    [dispatch, filter.fieldPath]
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
