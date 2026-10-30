import {type ReactNode} from 'react'
import {isVersionableDocumentType, PerspectiveProvider, usePerspective} from 'sanity'
import {useRouter} from 'sanity/router'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'

/**
 * @internal
 * Exposes cardinality one releases as selectedPerspective through PerspectiveContext.
 * Documents that cannot have versions or variants always use the default perspective.
 */
export function DocumentPerspectiveProvider({
  children,
  documentType,
}: {
  children: ReactNode
  documentType?: string
}) {
  const paneRouter = usePaneRouter()
  const {excludedPerspectives} = usePerspective()
  const router = useRouter()
  const selectedVariantName =
    typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined

  if (!isVersionableDocumentType(documentType)) {
    return (
      <PerspectiveProvider
        selectedPerspectiveName={undefined}
        excludedPerspectives={excludedPerspectives}
      >
        {children}
      </PerspectiveProvider>
    )
  }

  const {scheduledDraft} = paneRouter.params as {scheduledDraft?: string}
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
