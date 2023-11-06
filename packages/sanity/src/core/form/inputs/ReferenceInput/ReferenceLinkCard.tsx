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
  const {as, documentId, documentType, ...cardProps} = props

  // If the child link is clicked without a document type, an error will be thrown.
  // This usually happens when the link is clicked before the document type has been resolved.
  // In this case, we don't want to pass the `as`/`forwardedAs` props to the Card component, as it will throw an error.
  const linkProps = documentId &&
    documentType && {
      // this will make @sanity/ui style it as a link
      'data-as': 'a',
      // this determines the actual tag inserted into the DOM (either a React.HTML element or a component)
      forwardedAs: as,
      documentId: documentId,
      documentType: documentType,
    }

  return (
    <StyledCard
      {...cardProps}
      {...linkProps}
      ref={ref as unknown as React.ForwardedRef<HTMLDivElement>}
    />
  )
})
