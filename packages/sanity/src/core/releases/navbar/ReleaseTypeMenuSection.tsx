import {Flex, Label} from '@sanity/ui'
import {useCallback} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useStudioPerspectiveState} from '../hooks/useStudioPerspectiveState'
import {type ReleaseDocument, type ReleaseType} from '../store/types'
import {
  getRangePosition,
  GlobalReleasePerspectiveMenuItem,
  type LayerRange,
} from './GlobalReleasePerspectiveMenuItem'
import {GlobalPerspectiveMenuLabelIndicator} from './PerspectiveLayerIndicator'
import {type ScrollElement} from './useScrollIndicatorVisibility'

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  asap: 'release.type.asap',
  scheduled: 'release.type.scheduled',
  undecided: 'release.type.undecided',
}

export function ReleaseTypeMenuSection({
  releaseType,
  releases,
  range,
  currentGlobalBundleMenuItemRef,
}: {
  releaseType: ReleaseType
  releases: ReleaseDocument[]
  range: LayerRange
  currentGlobalBundleMenuItemRef: React.RefObject<ScrollElement>
}): JSX.Element | null {
  const {t} = useTranslation()
  const {current} = useStudioPerspectiveState()

  const getMenuItemRef = useCallback(
    (releaseId: string) =>
      releaseId === current
        ? (currentGlobalBundleMenuItemRef as React.RefObject<HTMLDivElement>)
        : undefined,
    [current, currentGlobalBundleMenuItemRef],
  )

  if (releases.length === 0) return null

  const {firstIndex, lastIndex, offsets} = range
  const releaseTypeOffset = offsets[releaseType]

  return (
    <>
      <GlobalPerspectiveMenuLabelIndicator
        $withinRange={firstIndex < releaseTypeOffset && lastIndex >= releaseTypeOffset}
        paddingRight={2}
        paddingTop={releaseType === 'asap' ? 1 : 4}
        paddingBottom={2}
      >
        <Label muted style={{textTransform: 'uppercase'}} size={1}>
          {t(RELEASE_TYPE_LABELS[releaseType])}
        </Label>
      </GlobalPerspectiveMenuLabelIndicator>
      <Flex direction="column" gap={1}>
        {releases.map((release, index) => (
          <GlobalReleasePerspectiveMenuItem
            release={release}
            key={release._id}
            ref={getMenuItemRef(release._id)}
            rangePosition={getRangePosition(range, releaseTypeOffset + index)}
          />
        ))}
      </Flex>
    </>
  )
}
