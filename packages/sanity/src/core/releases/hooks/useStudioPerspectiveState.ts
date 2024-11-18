/* eslint-disable no-nested-ternary */
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {useEffectEvent} from 'use-effect-event'

import {
  DRAFTS_PERSPECTIVE,
  type DraftsPerspective,
  PUBLISHED_PERSPECTIVE,
  SelectableReleasePerspective,
} from '../util/perspective'
import {type ReleaseId} from '../util/releaseId'

export interface StudioPerspectiveState {
  current: SelectableReleasePerspective | undefined
  excluded: SelectableReleasePerspective[]
  toggle: (perspective: SelectableReleasePerspective) => void
  include: (perspective: SelectableReleasePerspective) => void
  exclude: (perspective: SelectableReleasePerspective) => void
  setCurrent: (perspective: DraftsPerspective | SelectableReleasePerspective) => void
}

const EMPTY: never[] = []

const RELEASE_PARAM_PREFIX = 'release.'
function encodeReleasePerspective(releaseId: ReleaseId) {
  return RELEASE_PARAM_PREFIX + releaseId
}
function decodeReleasePerspective(param: string) {
  if (!param.startsWith(RELEASE_PARAM_PREFIX)) {
    throw new Error(`Expected release perspective parameter to start with ${RELEASE_PARAM_PREFIX}`)
  }
  return param.slice(RELEASE_PARAM_PREFIX.length)
}

function parsePerspectiveParam(param: string | undefined) {
  if (!param) {
    return undefined
  }
  return param === 'drafts'
    ? undefined
    : param === 'published'
      ? PUBLISHED_PERSPECTIVE
      : SelectableReleasePerspective(decodeReleasePerspective(param))
}

export function useStudioPerspectiveState(): StudioPerspectiveState {
  const router = useRouter()
  const setCurrent = useCallback(
    (nextRelease: DraftsPerspective | SelectableReleasePerspective) => {
      router.navigateStickyParams({
        // drafts is the default perspective so will not be written to the url
        perspective:
          nextRelease === DRAFTS_PERSPECTIVE
            ? undefined
            : nextRelease === PUBLISHED_PERSPECTIVE
              ? 'published'
              : encodeReleasePerspective(nextRelease as ReleaseId /*Why typescript why?*/),
        excludedPerspectives: undefined,
      })
    },
    [router],
  )
  const excluded = parseExcludedReleases(router.stickyParams.excludedPerspectives)
  const current = useMemo(() => {
    return parsePerspectiveParam(router.stickyParams.perspective)
  }, [router.stickyParams.perspective])

  const exclude = useEffectEvent((toExclude: SelectableReleasePerspective) => {
    if (excluded.includes(toExclude)) {
      return
    }
    router.navigateStickyParams({excludedPerspectives: [toExclude, ...excluded].join(',')})
  })

  const include = useEffectEvent((toInclude: SelectableReleasePerspective) => {
    if (!excluded.includes(toInclude)) {
      return
    }
    router.navigateStickyParams({
      excludedReleases: excluded.filter((release) => release === toInclude).join(','),
    })
  })

  const toggle = useEffectEvent((toToggle: SelectableReleasePerspective) => {
    if (excluded.includes(toToggle)) {
      include(toToggle)
    } else {
      exclude(toToggle)
    }
  })

  return useMemo(
    () => ({
      current: current,
      excluded,
      toggle,
      setCurrent,
      include,
      exclude,
    }),
    [current, exclude, excluded, include, setCurrent, toggle],
  )
}

function parseExcludedReleases(input: string | undefined) {
  if (!input) {
    return EMPTY
  }
  return input.split(',').map((id) => SelectableReleasePerspective(id))
}
