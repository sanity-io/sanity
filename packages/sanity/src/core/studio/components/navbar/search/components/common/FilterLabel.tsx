import {Box, Flex} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {TextWithTone} from '../../../../../../components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getOperatorDefinition} from '../../definitions/operators'
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

  const operator = getOperatorDefinition(definitions.operators, filter.operatorType)

  const ButtonValue = operator?.buttonValueComponent

  return (
    <Flex align="center" gap={1}>
      {/* Title */}
      <CustomBox $flexShrink={fullscreen ? 1 : 0}>
        <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="semibold">
          <FilterTitle filter={filter} maxLength={fullscreen ? 25 : 40} />
        </TextWithTone>
      </CustomBox>
      {/* Operator */}
      {showContent && operator?.buttonLabel && (
        <CustomBox $flexShrink={0}>
          <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="regular">
            {operator.buttonLabel}
          </TextWithTone>
        </CustomBox>
      )}
      {/* Value */}
      {showContent && ButtonValue && (
        <CustomBox $flexShrink={1}>
          <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="semibold">
            <ButtonValue value={filter?.value} />
          </TextWithTone>
        </CustomBox>
      )}
    </Flex>
  )
}
