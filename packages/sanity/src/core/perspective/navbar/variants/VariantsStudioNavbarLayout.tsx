import {Skeleton} from '@sanity/ui'
import {clsx} from 'clsx'
import {lazy, Suspense, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {Box} from 'ui5'

import {parseVariantStickyParam} from '../../../variants/util/variantSelection'
import {
  navbarFallback,
  navbarFallbackFullWidth,
  navbarFallbackSkeleton,
  navbarFallbackSkeletonFullWidth,
} from './VariantsStudioNavbarLayout.css'

const VariantsStudioNavbar = lazy(() => import('./VariantsStudioNavbar'))

/**
 * What the bar shows while the filters' chunk loads: one row of a filter pill's height, so the
 * filters replace it without moving the layout below.
 * @internal
 */
export function VariantsStudioNavbarFallback(props: {fullWidth?: boolean}) {
  const {fullWidth} = props
  return (
    <Box
      border
      className={clsx(navbarFallback, fullWidth && navbarFallbackFullWidth)}
      radius="full"
    >
      <Skeleton
        animated
        className={clsx(navbarFallbackSkeleton, fullWidth && navbarFallbackSkeletonFullWidth)}
      />
    </Box>
  )
}

/**
 * The variants perspective filters, rendered by `StudioNavbar` when variants are enabled.
 * Imported eagerly, since the bar's filters are what load lazily, behind the `Suspense`
 * here, so the bar itself paints with the navbar.
 * @internal
 */
export function VariantsStudioNavbarLayout(props: {
  /**
   * Stretches each filter to its parent's width and leaves "New audience" out of its menu, as in
   * the mobile nav drawer, where the create variant dialog does not fit.
   */
  fullWidth?: boolean
}) {
  const {fullWidth} = props
  const router = useRouter()
  const variantSelections = useMemo(
    () =>
      parseVariantStickyParam(
        typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
      ),
    [router.stickyParams.variant],
  )
  return (
    <Suspense fallback={<VariantsStudioNavbarFallback fullWidth={fullWidth} />}>
      <VariantsStudioNavbar fullWidth={fullWidth} variantSelections={variantSelections} />
    </Suspense>
  )
}
