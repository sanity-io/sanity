import {Card, type CardProps} from '@sanity/ui'
import {clsx} from 'clsx'
import {type HTMLProps, type Ref, type RefAttributes} from 'react'

import {card} from './ReferenceLinkCard.css'

interface ReferenceLinkCardProps extends CardProps {
  as: any
  documentId: string
  documentType: string | undefined
}

export function ReferenceLinkCard(
  props: ReferenceLinkCardProps &
    Omit<HTMLProps<HTMLElement>, 'as' | 'ref'> &
    RefAttributes<HTMLElement>,
) {
  const {ref, as, className, documentId, documentType, ...cardProps} = props

  // If the child link is clicked without a document type, an error will be thrown.
  // This usually happens when the link is clicked before the document type has been resolved.
  // In this case, we don't want to pass the `as` prop to the Card component, as it will throw an error.
  const linkProps = documentId &&
    documentType && {
      // this will make @sanity/ui style it as a link
      'data-as': 'a',
      // this determines the actual tag inserted into the DOM (either a HTML element or a component)
      'as': as,
      'documentId': documentId,
      'documentType': documentType,
    }

  return (
    <Card
      {...cardProps}
      {...linkProps}
      className={clsx(card, className)}
      data-ui="ReferenceLinkCard"
      ref={ref as unknown as Ref<HTMLDivElement>}
    />
  )
}
