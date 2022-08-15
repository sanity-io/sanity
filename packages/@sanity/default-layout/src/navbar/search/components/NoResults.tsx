import {Flex, Inline, Text, Theme} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'
import {useSearchState} from '../contexts/search'
import {TypePills} from './TypePills'

export function NoResults() {
  const {state} = useSearchState()

  const typesSelected = state.terms.types.length > 0

  return (
    <Flex align="center" aria-live="assertive" direction="column" gap={4} paddingX={4} paddingY={5}>
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

// TODO: use idiomatic sanity/ui styling - is there a better way to apply _inline_ text styles?
const Semibold = styled.span(({theme}: {theme: Theme}) => {
  return css`
    font-weight: ${theme.sanity.fonts.text.weights.semibold};
  `
})
