import {Card, type CardProps} from '@sanity/ui'
import {clsx} from 'clsx'
import {
  type ComponentProps,
  type ElementType,
  type HTMLProps,
  type RefAttributes,
  useContext,
  useMemo,
} from 'react'
import {PreviewCardContext} from 'sanity/_singletons'

import {previewCard, referenceInputPreviewCard} from './PreviewCard.css'

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
export function PreviewCard(
  props: CardProps<ElementType> &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'> &
    RefAttributes<HTMLDivElement>,
) {
  const {ref, children, className, selected, as, ...restProps} = props

  const value = useMemo(() => ({selected}), [selected])

  return (
    <Card
      data-ui="PreviewCard"
      {...restProps}
      as={as}
      className={clsx(previewCard, className)}
      ref={ref}
      selected={selected}
    >
      <PreviewCardContext.Provider value={value}>{children}</PreviewCardContext.Provider>
    </Card>
  )
}

/**
 *  This is a workaround for a circular import issue.
 * Calling `styled(PreviewCard)` at program load time triggered a build error with the commonjs bundle because it tried
 * to access the PreviewCard variable/symbol before it was initialized.
 * The workaround is to colocate the styled component with the component itself.
 * @internal
 */
export function ReferenceInputPreviewCard(
  props: ComponentProps<typeof PreviewCard> & {forwardedAs?: ElementType},
) {
  const {as, className, forwardedAs, ...restProps} = props

  return (
    <PreviewCard
      {...restProps}
      as={forwardedAs ?? as}
      className={clsx(referenceInputPreviewCard, className)}
    />
  )
}
