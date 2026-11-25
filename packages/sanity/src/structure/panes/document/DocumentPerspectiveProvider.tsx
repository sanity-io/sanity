import {type ReactNode} from 'react'
import {usePerspective} from 'sanity'
import {useRouter} from 'sanity/router'

import {PerspectiveProvider} from '../../../core/perspective/PerspectiveProvider'
import {useScheduledDraftParam} from './useScheduledDraftParam'

/**
 * @internal
 * Exposes cardinality one releases as selectedPerspective through PerspectiveContext.
 * A scheduled draft of another variant than the selected one is ignored: the selected variant wins.
 */
export function DocumentPerspectiveProvider({
  children,
  documentId,
}: {
  children: ReactNode
  documentId: string
}) {
  const {excludedPerspectives} = usePerspective()
  const router = useRouter()
  const selectedVariantName =
    typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined

  const scheduledDraft = useScheduledDraftParam(documentId)
  if (scheduledDraft) {
    return (
      <PerspectiveProvider
        selectedPerspectiveName={scheduledDraft}
        selectedVariantName={selectedVariantName}
        excludedPerspectives={excludedPerspectives}
      >
        {children}
      </PerspectiveProvider>
    )
  }
  return children
}
