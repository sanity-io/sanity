import {useRouter} from 'sanity/router'

import {type ReleaseType, useReleases} from '../../store/release'
import {type ReleaseDocument} from '../../store/release/types'
import {LATEST} from '../util/const'
import {getBundleIdFromReleaseId} from '../util/getBundleIdFromReleaseId'

/**
 * @internal
 */
export type CurrentPerspective = Omit<Partial<ReleaseDocument>, 'metadata'> & {
  metadata: {title: string; releaseType?: ReleaseType}
}
/**
 * @internal
 */
export interface PerspectiveValue {
  /* Return the current global release */
  currentGlobalBundle: CurrentPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (releaseId: string) => void
  /* change the perspective in the studio based on a release ID */
  setPerspectiveFromRelease: (releaseId: string) => void
}

/**
 * TODO: Improve distinction between global and pane perspectives.
 *
 * @internal
 */
export function usePerspective(selectedPerspective?: string): PerspectiveValue {
  const router = useRouter()
  const {data: releases, dispatch} = useReleases()
  const perspective = selectedPerspective ?? router.stickyParams.perspective

  // TODO: Should it be possible to set the perspective within a pane, rather than globally?
  const setPerspective = (releaseId: string | undefined) => {
    let perspectiveParam = ''

    if (releaseId === 'published') {
      perspectiveParam = 'published'
    } else if (releaseId !== 'drafts') {
      perspectiveParam = `bundle.${releaseId}`
    }

    router.navigateStickyParam('perspective', perspectiveParam)
    dispatch({type: 'PERSPECTIVE_SET', payload: perspectiveParam})
  }

  const selectedBundle =
    perspective && releases
      ? releases.find(
          (release: ReleaseDocument) =>
            `bundle.${getBundleIdFromReleaseId(release._id)}` === perspective,
        )
      : LATEST

  // TODO: Improve naming; this may not be global.
  const currentGlobalBundle =
    perspective === 'published'
      ? {
          _id: 'published',
          metadata: {
            title: 'Published',
          },
        }
      : selectedBundle || LATEST

  const setPerspectiveFromRelease = (releaseId: string) =>
    setPerspective(getBundleIdFromReleaseId(releaseId))

  return {
    setPerspective,
    setPerspectiveFromRelease,
    currentGlobalBundle: currentGlobalBundle,
  }
}
