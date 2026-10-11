import {useIntentLink} from 'sanity/router'

import {type ReferenceInputOptions} from '../../../core/form/studio/contexts/ReferenceInputOptions'
import {link} from './EditReferenceLinkComponent.css'

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
    <a className={link} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}
