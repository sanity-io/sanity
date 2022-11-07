import {SelectIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Menu, MenuButton, MenuDivider, MenuItem, Text} from '@sanity/ui'
import React, {createElement, useCallback, useId} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {getOperator, SearchOperator, SearchOperatorType} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'

interface OperatorsMenuButtonProps {
  filter: SearchFilter
  operator?: SearchOperator
}

function CustomMenuItem({
  onClick,
  operator,
  selected,
}: {
  onClick: (operatorType: SearchOperatorType) => void
  operator: SearchOperator
  selected: boolean
}) {
  const handleClick = useCallback(() => onClick(operator.type), [onClick, operator.type])

  return (
    <MenuItem
      onClick={handleClick}
      padding={3}
      pressed={selected}
      selected={selected}
      tone="default"
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Box paddingRight={2}>
          <Text size={1} weight="regular">
            {operator.label}
          </Text>
        </Box>
        {operator?.icon && (
          <Text muted size={1}>
            {createElement(operator.icon)}
          </Text>
        )}
      </Flex>
    </MenuItem>
  )
}

export function OperatorsMenuButton({filter, operator}: OperatorsMenuButtonProps) {
  const operatorItems = getFilterDefinition(filter.filterType)?.operators

  const menuButtonId = useId()

  const {dispatch} = useSearchState()

  const handleClick = useCallback(
    (operatorType: SearchOperatorType) => {
      dispatch({
        key: filter._key,
        operatorType,
        type: 'TERMS_FILTERS_SET_OPERATOR',
      })
    },
    [dispatch, filter._key]
  )

  if (!operator || !operatorItems || operatorItems.length <= 1) {
    return null
  }

  return (
    <Inline>
      <MenuButton
        button={
          <Button mode="ghost" padding={3}>
            <Flex align="center" gap={2} justify="space-between">
              <Text size={1} weight="regular">
                {operator.label}
              </Text>
              <Box marginLeft={1}>
                <Text size={1}>
                  <SelectIcon />
                </Text>
              </Box>
            </Flex>
          </Button>
        }
        id={menuButtonId || ''}
        menu={
          <Menu>
            {operatorItems.map((item, index) => {
              if (item.type === 'item') {
                const menuOperator = getOperator(item.name)
                if (!menuOperator) {
                  return null
                }
                return (
                  <CustomMenuItem
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    onClick={handleClick}
                    operator={menuOperator}
                    selected={operator.type === item.name}
                  />
                )
              }
              if (item.type === 'divider') {
                // eslint-disable-next-line react/no-array-index-key
                return <MenuDivider key={index} />
              }
              return null
            })}
          </Menu>
        }
        placement="bottom-start"
        popover={{portal: false, radius: 2}}
      />
    </Inline>
  )
}
