import {Card, type CardProps} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'

import {referenceLinkCard} from './ReferenceLinkCard.css'

interface ReferenceLinkCardProps extends CardProps {
  as: any
  documentId: string
  documentType: string | undefined
}

export const ReferenceLinkCard = forwardRef(function ReferenceLinkCard(
  props: ReferenceLinkCardProps & HTMLProps<HTMLElement>,
  ref: ForwardedRef<HTMLElement>,
) {
  const {as, documentId, documentType, ...cardProps} = props

  // If the child link is clicked without a document type, an error will be thrown.
  // This usually happens when the link is clicked before the document type has been resolved.
  // In this case, we don't want to pass the `as`/`forwardedAs` props to the Card component, as it will throw an error.
  const linkProps = documentId &&
    documentType && {
      // this will make @sanity/ui style it as a link
      'data-as': 'a',
      // this determines the actual tag inserted into the DOM (either a HTML element or a component)
      'forwardedAs': as,
      'documentId': documentId,
      'documentType': documentType,
    }

  return (
    <Card
      {...cardProps}
      {...linkProps}
      data-ui="ReferenceLinkCard"
      className={referenceLinkCard}
      ref={ref as unknown as ForwardedRef<HTMLDivElement>}
    />
  )
})
