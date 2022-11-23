import {TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import FocusLock from 'react-focus-lock'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter, getFilterKey} from '../../../utils/filterUtils'
import {supportsTouch} from '../../../utils/supportsTouch'
import {FilterDetails} from '../common/FilterDetails'
import {OperatorsMenuButton} from './OperatorsMenuButton'

interface FilterFormProps {
  filter: SearchFilter
}

export function FilterForm({filter}: FilterFormProps) {
  const {
    dispatch,
    state: {definitions, fullscreen},
  } = useSearchState()

  const filterDefinition = getFilterDefinition(definitions.filters, filter.filterType)
  const operator = getOperator(definitions.operators, filter.operatorType)
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)
  const filterKey = getFilterKey(filter)

  const handleClose = useCallback(() => {
    dispatch({
      filterKey: getFilterKey(filter),
      type: 'TERMS_FILTERS_REMOVE',
    })
  }, [dispatch, filter])

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

  // Flex order is reversed to ensure form inputs are focusable first
  return (
    <FocusLock autoFocus={!supportsTouch}>
      <Flex direction="column-reverse">
        {/* Value */}
        {Component && (
          <Card borderTop padding={3}>
            <Component
              fieldDefinition={fieldDefinition}
              // re-render on new operators
              key={filter.operatorType}
              onChange={handleValueChange}
              value={filter.value}
            />
          </Card>
        )}

        {/* Title, description and operator */}
        <Card padding={3}>
          <Stack space={3}>
            <Flex align="flex-start" gap={3} justify="space-between">
              <Box
                paddingBottom={1}
                paddingLeft={1}
                paddingRight={2}
                paddingTop={fullscreen ? 2 : 1}
              >
                <FilterDetails filter={filter} small={!fullscreen} />
              </Box>

              {fullscreen && (
                <Button
                  fontSize={2}
                  icon={TrashIcon}
                  mode="bleed"
                  onClick={handleClose}
                  padding={2}
                  tone="critical"
                />
              )}
            </Flex>
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
    </FocusLock>
  )
}
