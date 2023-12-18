import {TrashIcon} from '@sanity/icons'
import {Box, Card, ErrorBoundary, Flex, Stack, Text} from '@sanity/ui'
import React, {ErrorInfo, useCallback, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {Button} from '../../../../../../../../ui-components'
import {supportsTouch} from '../../../../../../../util'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {getOperatorDefinition} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter, getFilterKey} from '../../../utils/filterUtils'
import {FilterDetails} from '../common/FilterDetails'
import {FilterError} from './FilterError'
import {OperatorsMenuButton} from './OperatorsMenuButton'

interface FilterFormProps {
  filter: SearchFilter
}

interface ErrorParams {
  error: Error
  info: ErrorInfo
}

export function FilterForm({filter}: FilterFormProps) {
  const [errorParams, setErrorParams] = useState<ErrorParams | null>(null)
  const {
    dispatch,
    state: {definitions, fullscreen},
  } = useSearchState()

  const filterDefinition = getFilterDefinition(definitions.filters, filter.filterName)
  const operator = getOperatorDefinition(definitions.operators, filter.operatorType)
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
    [dispatch, filterKey],
  )

  const handleCatchError = useCallback((params: ErrorParams) => {
    setErrorParams(params)
  }, [])

  const Component = operator?.inputComponent

  if (errorParams) {
    return <FilterError padding={4} />
  }

  // Flex order is reversed to ensure form inputs are focusable first
  return (
    <ErrorBoundary onCatch={handleCatchError}>
      <FocusLock autoFocus={!supportsTouch} returnFocus>
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
                <Box paddingLeft={1} paddingRight={2} paddingY={1}>
                  <FilterDetails filter={filter} />
                </Box>

                {fullscreen && (
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    onClick={handleClose}
                    tone="critical"
                    tooltipProps={{content: 'Remove filter'}}
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
    </ErrorBoundary>
  )
}
