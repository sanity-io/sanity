import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Flex, Label, Stack} from '@sanity/ui'
import {useCallback} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {usePerspective} from '../../perspective/usePerspective'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseId, type ReleasesNavMenuItemPropsGetter} from '../types'
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
  menuItemProps,
}: {
  releaseType: ReleaseType
  releases: ReleaseDocument[]
  range: LayerRange
  currentGlobalBundleMenuItemRef: React.RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
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
    <Card padding={1} borderBottom>
      <Stack space={1}>
        <GlobalPerspectiveMenuLabelIndicator
          $withinRange={releaseTypeOffset > 0 && lastIndex >= releaseTypeOffset}
          paddingLeft={2}
          paddingTop={3}
          paddingBottom={1}
        >
          <Label muted style={{textTransform: 'uppercase'}} size={1}>
            {t(RELEASE_TYPE_LABELS[releaseType])}
          </Label>
        </GlobalPerspectiveMenuLabelIndicator>
        <Flex direction="column" gap={1}>
          {releases.map((release, index) => (
            <GlobalPerspectiveMenuItem
              key={release._id}
              release={release}
              ref={getMenuItemRef(getReleaseIdFromReleaseDocumentId(release._id))}
              rangePosition={getRangePosition(range, releaseTypeOffset + index)}
              menuItemProps={menuItemProps}
            />
          ))}
        </Flex>
      </Stack>
    </Card>
  )
}
