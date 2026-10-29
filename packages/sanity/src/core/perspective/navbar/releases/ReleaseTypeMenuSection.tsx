import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Label} from '@sanity/ui'
import {useCallback} from 'react'
import {Flex, VStack} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseId, type ReleasesNavMenuItemPropsGetter} from '../../types'
import {usePerspective} from '../../usePerspective'
import {ReleasesMenuLabelIndicator} from './ReleasesLayerIndicator'
import {getRangePosition, ReleasesMenuItem, type LayerRange} from './ReleasesMenuItem'
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
  showStackLine = true,
}: {
  releaseType: ReleaseType
  releases: ReleaseDocument[]
  range: LayerRange
  currentGlobalBundleMenuItemRef: React.RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /** The stack line joins the selected perspective to the releases under it. A filter hides it. */
  showStackLine?: boolean
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
  const labelWithinStack = showStackLine && releaseTypeOffset > 0 && lastIndex >= releaseTypeOffset

  return (
    <Card padding={1} borderBottom>
      <VStack gap={1}>
        <ReleasesMenuLabelIndicator
          $withinRange={labelWithinStack}
          paddingLeft={2}
          paddingTop={3}
          paddingBottom={1}
        >
          <Label muted style={{textTransform: 'uppercase'}} size={1}>
            {t(RELEASE_TYPE_LABELS[releaseType])}
          </Label>
        </ReleasesMenuLabelIndicator>
        <Flex flexDirection="column" gap={1}>
          {releases.map((release, index) => (
            <ReleasesMenuItem
              key={release._id}
              release={release}
              ref={getMenuItemRef(getReleaseIdFromReleaseDocumentId(release._id))}
              rangePosition={
                showStackLine ? getRangePosition(range, releaseTypeOffset + index) : undefined
              }
              menuItemProps={menuItemProps}
            />
          ))}
        </Flex>
      </VStack>
    </Card>
  )
}
