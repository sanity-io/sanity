import {Card, CardProps, Portal} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'

const StyledCard = styled(Card)`
  flex-direction: column;
`

export const SearchFullscreenContent = forwardRef(function SearchFullscreenContent(
  props: CardProps & {children: React.ReactNode; hidden?: boolean},
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {scheme} = useColorScheme()

  return (
    <Portal>
      <StyledCard display="flex" flex={1} ref={ref} scheme={scheme} {...props} />
    </Portal>
  )
})
