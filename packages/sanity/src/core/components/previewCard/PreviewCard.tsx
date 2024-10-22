import {Card, type CardProps} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps, useContext, useMemo} from 'react'
import {PreviewCardContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

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
  props: CardProps & Omit<HTMLProps<HTMLDivElement>, 'height'>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {children, selected, as, ...restProps} = props

  const value = useMemo(() => ({selected}), [selected])

  return (
    <StyledCard data-ui="PreviewCard" {...restProps} forwardedAs={as} ref={ref} selected={selected}>
      <PreviewCardContext.Provider value={value}>{children}</PreviewCardContext.Provider>
    </StyledCard>
  )
})

/**
 *  This is a workaround for a circular import issue.
 * Calling `styled(PreviewCard)` at program load time triggered a build error with the commonjs bundle because it tried
 * to access the PreviewCard variable/symbol before it was initialized.
 * The workaround is to colocate the styled component with the component itself.
 * @internal
 */
export const ReferenceInputPreviewCard = styled(PreviewCard)`
  /* this is a hack to avoid layout jumps while previews are loading
there's probably better ways of solving this */
  min-height: 36px;
`
