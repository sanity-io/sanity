// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem & Button not supported by ui-components
import {forwardRef, type MouseEvent, useCallback, useMemo} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useStudioPerspectiveState} from '../hooks/useStudioPerspectiveState'
import {type ReleaseDocument} from '../store/types'
import {getReleaseTone} from '../util/getReleaseTone'
import {getReleaseIdFromReleaseDocumentId} from '../util/releaseId'
import {isPublishedPerspective, isReleaseScheduledOrScheduling} from '../util/util'
import {PerspectiveMenuItem} from './PerspectiveMenuItem'

export interface LayerRange {
  firstIndex: number
  lastIndex: number
  offsets: {
    asap: number
    scheduled: number
    undecided: number
  }
}

type rangePosition = 'first' | 'within' | 'last' | undefined

export function getRangePosition(range: LayerRange, index: number): rangePosition {
  const {firstIndex, lastIndex} = range

  if (firstIndex === lastIndex) return undefined
  if (index === firstIndex) return 'first'
  if (index === lastIndex) return 'last'
  if (index > firstIndex && index < lastIndex) return 'within'

  return undefined
}

export const GlobalReleasePerspectiveMenuItem = forwardRef<
  HTMLDivElement,
  {
    release: ReleaseDocument
    rangePosition: rangePosition
  }
>((props, ref) => {
  const {release, rangePosition} = props
  const {current, setCurrent, toggle, excluded} = useStudioPerspectiveState()

  const isReleasePublishedPerspective = current && isPublishedPerspective(current)
  const isUnnamedRelease = !isReleasePublishedPerspective && !release.metadata.title

  const active = getReleaseIdFromReleaseDocumentId(release._id) === current
  const first = rangePosition === 'first'
  const within = rangePosition === 'within'
  const last = rangePosition === 'last'
  const inRange = first || within || last

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  const {t} = useTranslation()

  const displayTitle = useMemo(() => {
    if (isUnnamedRelease) {
      return t('release.placeholder-untitled-release')
    }

    return isReleasePublishedPerspective ? t('release.navbar.published') : release.metadata?.title
  }, [isReleasePublishedPerspective, isUnnamedRelease, release, t])

  const handleToggleReleaseVisibility = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation()
      toggle(releaseId)
    },
    [toggle, releaseId],
  )

  const handleOnReleaseClick = useCallback(() => setCurrent(releaseId), [releaseId, setCurrent])

  const canReleaseBeExcluded = !isReleaseScheduledOrScheduling(release) && inRange && !last

  return (
    <PerspectiveMenuItem
      canBeExcluded={canReleaseBeExcluded}
      onToggleVisibility={handleToggleReleaseVisibility}
      rangePosition={rangePosition}
      tone={getReleaseTone(release)}
      title={displayTitle}
      onClick={handleOnReleaseClick}
      active={active}
      excluded={excluded.includes(releaseId)}
      locked={isReleaseScheduledOrScheduling(release)}
    />
  )
})

GlobalReleasePerspectiveMenuItem.displayName = 'GlobalPerspectiveMenuItem'
