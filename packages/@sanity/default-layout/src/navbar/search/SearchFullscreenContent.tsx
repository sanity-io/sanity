import type {CardProps} from '@sanity/ui'
import {Card, Portal} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'

const StyledCard = styled(Card)`
  flex-direction: column;
`

export const SearchFullscreenContent = forwardRef(function SearchFullscreenContent(
  props: CardProps & {children: React.ReactNode; hidden?: boolean},
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <Portal>
      <StyledCard ref={ref} display="flex" scheme="light" flex={1} {...props} />
    </Portal>
  )
})
