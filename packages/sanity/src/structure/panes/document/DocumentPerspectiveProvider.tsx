import {type ReactNode} from 'react'
import {PerspectiveProvider, type ReleaseId, usePerspective} from 'sanity'
import {useRouter} from 'sanity/router'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'

/**
 * @internal
 * Exposes cardinality one releases as selectedPerspective through PerspectiveContext
 */
export function DocumentPerspectiveProvider({children}: {children: ReactNode}) {
  const paneRouter = usePaneRouter()
  const {excludedPerspectives} = usePerspective()
  const router = useRouter()
  const selectedVariantName =
    typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined

  const {scheduledDraft, localPerspective, localVariant} = paneRouter.params as {
    scheduledDraft?: string
    localPerspective?: string
    localVariant?: string
  }
  // PROPOSED (Variants 2.0 test studio): a LOCAL perspective. A pane that carries `localPerspective` (and optionally `localVariant`,
  // `none` for the base) shows its document at that address, whatever the global perspective is, and keeps it when the global one
  // changes. Without these pane params nothing changes. Same mechanism as `scheduledDraft` above.
  if (localPerspective || localVariant) {
    return (
      <PerspectiveProvider
        selectedPerspectiveName={
          localPerspective && localPerspective !== 'drafts'
            ? (localPerspective as 'published' | ReleaseId)
            : undefined
        }
        selectedVariantName={localVariant && localVariant !== 'none' ? localVariant : undefined}
        excludedPerspectives={excludedPerspectives}
      >
        {children}
      </PerspectiveProvider>
    )
  }
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
