import {useRouter} from 'sanity/router'

import {useBundles} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'

/**
 * @internal
 */
export interface PerspectiveValue {
  /* Return the current global bundle */
  currentGlobalBundle: Partial<BundleDocument>
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (slug: string) => void
}

/**
 * TODO: Improve distinction between global and pane perspectives.
 *
 * @internal
 */
export function usePerspective(selectedPerspective?: string): PerspectiveValue {
  const router = useRouter()
  const {data: bundles} = useBundles()
  const perspective = selectedPerspective ?? router.stickyParams.perspective

  // TODO: Should it be possible to set the perspective within a pane, rather than globally?
  const setPerspective = (slug: string | undefined) => {
    if (slug === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else {
      router.navigateStickyParam('perspective', `bundle.${slug}`)
    }
  }

  const selectedBundle =
    perspective && bundles
      ? bundles.find((bundle: Partial<BundleDocument>) => {
          return `bundle.${bundle.slug}`.toLocaleLowerCase() === perspective?.toLocaleLowerCase()
        })
      : LATEST

  // TODO: Improve naming; this may not be global.
  const currentGlobalBundle = selectedBundle || LATEST

  return {
    setPerspective,
    currentGlobalBundle,
  }
}
