import {Box, Flex, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getOperator} from '../../definitions/operators'
import type {SearchFilter} from '../../types'
import {FilterTitle} from './FilterTitle'

interface FilterLabelProps {
  filter: SearchFilter
  fontSize?: number
  showContent?: boolean
}

const CustomBox = styled(Box)<{$flexShrink?: number}>`
  flex-shrink: ${({$flexShrink = 0}) => $flexShrink};
`

export function FilterLabel({filter, fontSize = 1, showContent = true}: FilterLabelProps) {
  const {
    state: {definitions, fullscreen},
  } = useSearchState()

  const operator = getOperator(definitions.operators, filter.operatorType)

  const ButtonValue = operator?.buttonValueComponent

  return (
    <Flex align="center" gap={1}>
      {/* Title */}
      <CustomBox $flexShrink={fullscreen ? 1 : 0}>
        <Text size={fontSize} textOverflow="ellipsis" weight="medium">
          <FilterTitle filter={filter} maxLength={fullscreen ? 25 : 40} />
        </Text>
      </CustomBox>
      {/* Operator */}
      {showContent && operator?.buttonLabel && (
        <CustomBox $flexShrink={fullscreen ? 1 : 0}>
          <Text muted size={fontSize} textOverflow="ellipsis" weight="regular">
            {operator.buttonLabel}
          </Text>
        </CustomBox>
      )}
      {/* Value */}
      {showContent && ButtonValue && (
        <CustomBox $flexShrink={1}>
          <Text size={fontSize} textOverflow="ellipsis" weight="medium">
            <ButtonValue value={filter?.value} />
          </Text>
        </CustomBox>
      )}
    </Flex>
  )
}
