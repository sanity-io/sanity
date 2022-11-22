import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useSchema} from '../../../../../../../hooks'
import {isNonNullable} from '../../../../../../../util'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter, getFilterKey} from '../../../utils/filterUtils'
import {getSchemaField} from '../../../utils/getSchemaField'
import {FilterDetails} from '../common/FilterDetails'
import {OperatorsMenuButton} from './OperatorsMenuButton'

interface FilterFormProps {
  filter: SearchFilter
}

export function FilterForm({filter}: FilterFormProps) {
  const {
    dispatch,
    state: {definitions, documentTypesNarrowed, fullscreen},
  } = useSearchState()

  const filterDefinition = getFilterDefinition(definitions.filters, filter.filterType)
  const operator = getOperator(definitions.operators, filter.operatorType)
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)
  const filterKey = getFilterKey(filter)
  const schema = useSchema()

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

  const Component = operator?.inputComponent

  const options = useMemo(() => {
    return fieldDefinition?.documentTypes
      .filter((d) => documentTypesNarrowed.includes(d))
      .map((type) => {
        const schemaType = schema.get(type)
        if (schemaType) {
          const field = getSchemaField(schemaType, fieldDefinition.fieldPath)
          return field?.type.options
        }
        return null
      })
      .filter(isNonNullable)
  }, [documentTypesNarrowed, fieldDefinition, schema])

  // Flex order is reversed to ensure form inputs are focusable first
  return (
    <Flex direction="column-reverse">
      {/* Value */}
      {Component && (
        <Card padding={3}>
          <Component
            // re-render on new operators
            key={filter.operatorType}
            onChange={handleValueChange}
            options={options}
            value={filter.value}
          />
        </Card>
      )}

      {/* Title, description and operator */}
      <Card borderBottom padding={3}>
        <Stack space={3}>
          <Box marginY={1} paddingRight={2}>
            <FilterDetails filter={filter} small={!fullscreen} />
          </Box>
          {filterDefinition?.description && (
            <Card border padding={3} radius={2} tone="transparent">
              <Text muted size={1}>
                {filterDefinition.description}
              </Text>
            </Card>
          )}
          <OperatorsMenuButton filter={filter} operator={operator} />
        </Stack>
      </Card>
    </Flex>
  )
}
