import {useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useWorkspace} from '../studio/workspace'
import {EMPTY_ARRAY} from '../util/empty'
import {getBundleIdFromPerspective} from '../variants/documents/getBundleIdFromPerspective'
import {useAllVariants} from '../variants/store/useAllVariants'
import {parseVariantStickyParam} from '../variants/util/variantSelection'
import {DEFAULT_VARIANT_TYPE_KEY} from '../variants/util/variantType'
import {getSelectedPerspective} from './getSelectedPerspective'
import {getSelectedReleaseId} from './getSelectedReleaseId'
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
  const {byId: variantsById} = useAllVariants()

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

  const selectedVariantId = useMemo(() => {
    // `variant:<id>` is the current param. A bare `<id>` is a previous consumer and means type `variant`.
    const selections = parseVariantStickyParam(selectedVariantName)
    return (
      selections.find((selection) => selection.type === DEFAULT_VARIANT_TYPE_KEY)?.name ??
      (selections.length === 1 ? selections[0]?.name : undefined)
    )
  }, [selectedVariantName])
  const selectedVariant = useMemo(
    () =>
      getSelectedVariant({
        selectedVariantName: selectedVariantId,
        variantsById,
      }),
    [selectedVariantId, variantsById],
  )

  const value: PerspectiveContextValue = useMemo(() => {
    // For regular releases and published, use as-is
    return {
      selectedPerspective,
      selectedPerspectiveName,
      selectedReleaseId: getSelectedReleaseId(selectedPerspectiveName, releases),
      perspectiveStack,
      excludedPerspectives,
      selectedVariantName: selectedVariantId,
      selectedVariant,
      bundle: getBundleIdFromPerspective(selectedPerspective),
    }
  }, [
    selectedPerspectiveName,
    releases,
    selectedPerspective,
    perspectiveStack,
    excludedPerspectives,
    selectedVariantId,
    selectedVariant,
  ])

  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
