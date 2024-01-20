import {type SanityDocument} from '@sanity/types'
import {type ReactElement} from 'react'

import {useReferringDocuments} from '../hooks/useReferringDocuments'
import {type DocumentStore} from '../store'

/**
 * @internal
 * @deprecated - Will be removed in 4.0.0, use the `useReferringDocuments(<documentId>)` hook instead
 */
export function WithReferringDocuments({
  children,
  id,
}: {
  children: (props: {isLoading: boolean; referringDocuments: SanityDocument[]}) => ReactElement
  /**
   * @deprecated - no longer required
   */
  documentStore?: DocumentStore
  id: string
}) {
  return children(useReferringDocuments(id))
}
