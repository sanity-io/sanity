import {type ReferenceInputOptions} from 'sanity'
import {useIntentLink} from 'sanity/router'
import {styled} from 'styled-components'

const Link = styled.a`
  flex: 1;
  text-decoration: none;
  color: inherit;
`

export const EditReferenceLinkComponent: ReferenceInputOptions['EditReferenceLinkComponent'] = ({
  children,
  documentId: _documentId,
  documentType,
}) => {
  const {href} = useIntentLink({
    intent: 'edit',
    params: {
      id: _documentId,
      type: documentType,
    },
  })

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  )
}
