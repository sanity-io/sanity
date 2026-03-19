import {Card, type CardProps} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps, useContext, useMemo} from 'react'
import {PreviewCardContext} from 'sanity/_singletons'

import {styledCard, referenceInputPreviewCard} from './PreviewCard.css'

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
    <Card
      className={styledCard}
      data-ui="PreviewCard"
      {...restProps}
      forwardedAs={as}
      ref={ref}
      selected={selected}
    >
      <PreviewCardContext.Provider value={value}>{children}</PreviewCardContext.Provider>
    </Card>
  )
})

/** @internal */
export const ReferenceInputPreviewCard = forwardRef(function ReferenceInputPreviewCard(
  props: CardProps & Omit<HTMLProps<HTMLDivElement>, 'height'>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {children, selected, as, ...restProps} = props

  const value = useMemo(() => ({selected}), [selected])

  return (
    <Card
      className={referenceInputPreviewCard}
      data-ui="PreviewCard"
      {...restProps}
      forwardedAs={as}
      ref={ref}
      selected={selected}
    >
      <PreviewCardContext.Provider value={value}>{children}</PreviewCardContext.Provider>
    </Card>
  )
})
