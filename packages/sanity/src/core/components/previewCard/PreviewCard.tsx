import {Card, CardProps} from '@sanity/ui'
import React, {createContext, forwardRef, useContext} from 'react'
import styled, {css} from 'styled-components'

/** @internal */
const StyledCard = styled(Card)(() => {
  return css`
    /* TextWithTone uses its own logic to set color, and we therefore need */
    /* to override this logic in order to set the correct color in different states */
    &[data-selected],
    &[data-pressed],
    &:active {
      [data-ui='TextWithTone'] {
        color: inherit;
      }
    }
  `
})

/** @internal */
export interface PreviewCardContextValue {
  selected?: boolean
}

const PreviewCardContext = createContext<PreviewCardContextValue>({selected: false})

/** @internal */
export function usePreviewCard(): PreviewCardContextValue {
  const context = useContext(PreviewCardContext)

  if (!context) {
    throw new Error('PreviewCard: missing context value')
  }

  return context
}

/** @internal */
export const PreviewCard = forwardRef(function PreviewCard(
  props: CardProps & Omit<React.HTMLProps<HTMLDivElement>, 'height'>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {children, selected, as, ...restProps} = props

  return (
    <StyledCard data-ui="PreviewCard" {...restProps} forwardedAs={as} ref={ref} selected={selected}>
      <PreviewCardContext.Provider value={{selected}}>{children}</PreviewCardContext.Provider>
    </StyledCard>
  )
})
