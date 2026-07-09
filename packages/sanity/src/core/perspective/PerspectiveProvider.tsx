import {useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {getReleaseIdFromReleaseDocumentId} from '../releases'
import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useWorkspace} from '../studio/workspace'
import {isSystemBundleName} from '../util/draftUtils'
import {EMPTY_ARRAY} from '../util/empty'
import {getBundleIdFromPerspective} from '../variants/documents/getBundleIdFromPerspective'
import {useAllVariants} from '../variants/store/useAllVariants'
import {getSelectedPerspective} from './getSelectedPerspective'
import {getSelectedVariant} from './getSelectedVariant'
import {type PerspectiveContextValue, type ReleaseId} from './types'

/**
 * @internal
 */
export function PerspectiveProvider({
  children,
  selectedPerspectiveName,
  selectedVariantName,
  excludedPerspectives = EMPTY_ARRAY,
}: {
  children: React.ReactNode
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  selectedVariantName?: string
  excludedPerspectives?: string[]
}) {
  const {data: releases} = useActiveReleases()
  const {byId: variantsById, loading: variantsLoading} = useAllVariants()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const selectedPerspective = useMemo(
    () => getSelectedPerspective(selectedPerspectiveName, releases),
    [selectedPerspectiveName, releases],
  )

  const perspectiveStack = useMemo(
    () =>
      getReleasesPerspectiveStack({
        releases,
        selectedPerspectiveName,
        excludedPerspectives,
        isDraftModelEnabled,
      }),
    [releases, selectedPerspectiveName, excludedPerspectives, isDraftModelEnabled],
  )

  const selectedVariant = useMemo(
    () => getSelectedVariant({selectedVariantName, variantsById}),
    [selectedVariantName, variantsById],
  )

  const value: PerspectiveContextValue = useMemo(() => {
    // For regular releases and published, use as-is
    return {
      selectedPerspective,
      selectedPerspectiveName,
      selectedReleaseId: isSystemBundleName(selectedPerspectiveName)
        ? undefined
        : releases
            .map((release) => getReleaseIdFromReleaseDocumentId(release._id))
            .find((releaseName) => releaseName === selectedPerspectiveName),
      perspectiveStack,
      excludedPerspectives,
      selectedVariantName,
      selectedVariant,
      variantsLoading,
      bundle: getBundleIdFromPerspective(selectedPerspective),
    }
  }, [
    selectedPerspectiveName,
    releases,
    selectedPerspective,
    perspectiveStack,
    excludedPerspectives,
    selectedVariantName,
    selectedVariant,
    variantsLoading,
  ])

  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
