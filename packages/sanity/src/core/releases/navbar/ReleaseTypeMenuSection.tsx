import {Flex, Label} from '@sanity/ui'
import {type ReleaseDocument, type ReleaseType, useTranslation} from 'sanity'

import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {GlobalPerspectiveMenuLabelIndicator} from './PerspectiveLayerIndicator'

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  asap: 'release.type.asap',
  scheduled: 'release.type.scheduled',
  undecided: 'release.type.undecided',
}

export function ReleaseTypeSection({
  releaseType,
  releases,
  range,
}: {
  releaseType: ReleaseType
  releases: ReleaseDocument[]
  range: LayerRange
}): JSX.Element | null {
  const {t} = useTranslation()

  if (releases.length === 0) return null

  const {firstIndex, lastIndex, offsets} = range
  const releaseTypeOffset = offsets[releaseType]

  return (
    <>
      <GlobalPerspectiveMenuLabelIndicator
        $withinRange={firstIndex < releaseTypeOffset && lastIndex >= releaseTypeOffset}
        paddingRight={2}
        paddingTop={4}
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
            rangePosition={getRangePosition(range, releaseTypeOffset + index)}
            toggleable={releaseTypeOffset < lastIndex}
          />
        ))}
      </Flex>
    </>
  )
}
