import {Skeleton} from '@sanity/ui'
import {lazy, Suspense, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {Box} from 'ui5'

import {parseVariantStickyParam} from '../../../variants/util/variantSelection'
import {navbarFallback, navbarFallbackSkeleton} from './VariantsStudioNavbarLayout.css'

const VariantsStudioNavbar = lazy(() => import('./VariantsStudioNavbar'))

/**
 * What the bar shows while the filters' chunk loads: one row of a filter pill's height, so the
 * filters replace it without moving the layout below.
 * @internal
 */
export function VariantsStudioNavbarFallback() {
  return (
    <Box border className={navbarFallback} radius="full">
      <Skeleton animated className={navbarFallbackSkeleton} />
    </Box>
  )
}

/**
 * The variants perspective filters, rendered by `StudioNavbar` when variants are enabled.
 * Imported eagerly, since the bar's filters are what load lazily, behind the `Suspense`
 * here, so the bar itself paints with the navbar.
 * @internal
 */
export function VariantsStudioNavbarLayout() {
  const router = useRouter()
  const variantSelections = useMemo(
    () =>
      parseVariantStickyParam(
        typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
      ),
    [router.stickyParams.variant],
  )
  return (
    <Suspense fallback={<VariantsStudioNavbarFallback />}>
      <VariantsStudioNavbar variantSelections={variantSelections} />
    </Suspense>
  )
}
