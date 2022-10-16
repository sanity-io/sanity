import {Flex, Inline, Text, Theme} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {TypePills} from './TypePills'

const Semibold = styled.span`
  font-weight: ${({theme}: {theme: Theme}) => theme.sanity.fonts.text.weights.semibold};
`

export function NoResults() {
  const {state} = useSearchState()

  const typesSelected = state.terms.types.length > 0

  return (
    <Flex
      align="center"
      aria-live="assertive"
      direction="column"
      flex={1}
      gap={4}
      paddingX={4}
      paddingY={5}
    >
      <Text muted>
        No results for <Semibold>{state.terms.query}</Semibold>
      </Text>
      {typesSelected && (
        <Flex align="center">
          <Inline space={2}>
            <Text muted size={1}>
              in
            </Text>
            <TypePills types={state.terms.types} />
          </Inline>
        </Flex>
      )}
    </Flex>
  )
}
