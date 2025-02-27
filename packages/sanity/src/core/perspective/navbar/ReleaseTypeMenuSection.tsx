import {Flex, Label} from '@sanity/ui'
import {useCallback} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {usePerspective} from '../../perspective/usePerspective'
import {type ReleaseDocument, type ReleaseType} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseId} from '../types'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
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
}): React.JSX.Element | null {
  const {t} = useTranslation()
  const {selectedReleaseId} = usePerspective()

  const getMenuItemRef = useCallback(
    (releaseId: ReleaseId) =>
      selectedReleaseId === releaseId
        ? (currentGlobalBundleMenuItemRef as React.RefObject<HTMLDivElement>)
        : undefined,
    [currentGlobalBundleMenuItemRef, selectedReleaseId],
  )

  if (releases.length === 0) return null

  const {lastIndex, offsets} = range
  const releaseTypeOffset = offsets[releaseType]

  return (
    <>
      <GlobalPerspectiveMenuLabelIndicator
        $withinRange={releaseTypeOffset > 0 && lastIndex >= releaseTypeOffset}
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
          <GlobalPerspectiveMenuItem
            release={release}
            key={release._id}
            ref={getMenuItemRef(getReleaseIdFromReleaseDocumentId(release._id))}
            rangePosition={getRangePosition(range, releaseTypeOffset + index)}
          />
        ))}
      </Flex>
    </>
  )
}
