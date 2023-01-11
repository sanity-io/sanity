import {SanityDocument} from '@sanity/types'
import {ReactElement} from 'react'
import {DocumentStore} from '../store'
import {useReferringDocuments} from '../hooks/useReferringDocuments'

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
