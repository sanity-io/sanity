import {FilterIcon} from '@sanity/icons/Filter'
import {Card, Flex, TabList, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

import {Tab} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type ReleaseLaneKind, RELEASE_LANE_ALL, type ReleaseLaneSegment} from './releaseLane'

function getSegmentTone(kind: ReleaseLaneKind): 'positive' | 'primary' | 'default' {
  if (kind === 'published') return 'positive'
  if (kind === 'release') return 'primary'
  return 'default'
}

// Uppercase micro-label styling so "Releases" reads as a section header, not a peer of the tabs.
const LABEL_STYLE: CSSProperties = {textTransform: 'uppercase', letterSpacing: '0.04em'}

/**
 * The release lane: a filter-tab strip summarizing which bundles this variant's documents
 * participate in, each tab filtering the documents table to that bundle. Mirrors the Releases
 * tool's ReleaseDocumentFilterTabs so the two document tables share one filter idiom.
 *
 * @internal
 */
export function VariantReleaseLane({
  segments,
  totalCount,
  activeLane,
  onSelectLane,
}: {
  segments: ReleaseLaneSegment[]
  totalCount: number
  activeLane: string
  onSelectLane: (laneId: string) => void
}): React.JSX.Element | null {
  const {t} = useTranslation(variantsLocaleNamespace)
  // Bundle labels live in the core namespace (shared with the per-row bundle chips).
  const {t: tCore} = useTranslation()

  // Nothing to filter by unless the documents span more than one bundle.
  if (segments.length < 2) {
    return null
  }

  return (
    <Flex align="center" gap={2} wrap="nowrap" data-testid="variant-release-lane">
      <Text muted size={1}>
        <FilterIcon />
      </Text>
      <Text muted size={0} style={LABEL_STYLE} weight="semibold">
        {t('detail.release-lane.title')}
      </Text>
      <Card borderLeft flex="none" style={{height: 16}} />
      <TabList space={1}>
        {[
          <Tab
            key="all"
            aria-controls="variant-documents-table"
            data-testid="variant-release-lane-segment-all"
            id="variant-release-lane-segment-all"
            label={t('detail.release-lane.count', {
              label: t('detail.release-lane.all'),
              count: totalCount,
            })}
            onClick={() => onSelectLane(RELEASE_LANE_ALL)}
            selected={activeLane === RELEASE_LANE_ALL}
          />,
          ...segments.map((segment) => {
            let label: string
            if (segment.kind === 'published') {
              label = tCore('release.chip.published')
            } else if (segment.kind === 'drafts') {
              label = tCore('release.chip.draft')
            } else {
              label =
                segment.release?.metadata?.title ?? tCore('release.placeholder-untitled-release')
            }

            const isSelected = activeLane === segment.id

            return (
              <Tab
                key={segment.id}
                aria-controls="variant-documents-table"
                data-testid={`variant-release-lane-segment-${segment.id}`}
                id={`variant-release-lane-segment-${segment.id}`}
                label={t('detail.release-lane.count', {label, count: segment.count})}
                onClick={() => onSelectLane(segment.id)}
                selected={isSelected}
                tone={isSelected ? getSegmentTone(segment.kind) : 'default'}
              />
            )
          }),
        ]}
      </TabList>
    </Flex>
  )
}
