import {Card, type CardProps} from '@sanity/ui'
import {forwardRef} from 'react'
import {styled} from 'styled-components'

const StyledCard = styled(Card)`
  /* this is a hack to avoid layout jumps while previews are loading
         there's probably better ways of solving this */
  min-height: 33px;
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

type ReferenceLinkCardProps = CardProps & {
  documentId: string
  documentType: string | undefined
}

export const ReferenceLinkCard = forwardRef<HTMLDivElement, ReferenceLinkCardProps>(
  function ReferenceLinkCard(props, ref) {
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

    return <StyledCard {...cardProps} {...linkProps} data-ui="ReferenceLinkCard" ref={ref} />
  },
)
