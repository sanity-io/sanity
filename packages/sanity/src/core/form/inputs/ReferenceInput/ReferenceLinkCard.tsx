import React, {forwardRef} from 'react'
import styled from 'styled-components'
import {Card, CardProps} from '@sanity/ui'

export const StyledCard = styled(Card)`
  /* this is a hack to avoid layout jumps while previews are loading
     there's probably better ways of solving this */
  min-height: 35px;
  position: relative;

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

interface ReferenceLinkCardProps extends CardProps {
  as: any
  documentId: string
  documentType: string | undefined
}

export const ReferenceLinkCard = forwardRef(function ReferenceLinkCard(
  props: ReferenceLinkCardProps & React.HTMLProps<HTMLElement>,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const {documentType, as: asProp, ...restProps} = props
  const dataAs = documentType ? 'a' : undefined

  // If the child link is clicked without a document type, an error will be thrown.
  // This usually happens when the link is clicked before the document type has been resolved.
  // In this case, we don't want to pass the `as` prop to the Card component, as it will throw an error.
  const as = documentType ? asProp : 'div'

  return (
    <StyledCard
      {...restProps}
      data-as={dataAs}
      documentType={documentType}
      forwardedAs={as}
      ref={ref as unknown as React.ForwardedRef<HTMLDivElement>}
    />
  )
})
