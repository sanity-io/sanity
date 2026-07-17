import {Flex, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {Button} from '../../../../ui-components/button'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type ReleaseLaneKind, RELEASE_LANE_ALL, type ReleaseLaneSegment} from './releaseLane'

function getSegmentTone(kind: ReleaseLaneKind): 'positive' | 'primary' | 'default' {
  if (kind === 'published') return 'positive'
  if (kind === 'release') return 'primary'
  return 'default'
}

function SegmentButton({
  id,
  label,
  count,
  tone,
  selected,
  onSelect,
}: {
  id: string
  label: string
  count: number
  tone: 'positive' | 'primary' | 'default'
  selected: boolean
  onSelect: (id: string) => void
}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const handleClick = useCallback(() => onSelect(id), [id, onSelect])

  return (
    <Button
      data-testid={`variant-release-lane-segment-${id}`}
      mode={selected ? 'default' : 'bleed'}
      onClick={handleClick}
      selected={selected}
      text={t('detail.release-lane.count', {label, count})}
      tone={tone}
    />
  )
}

/**
 * The release lane: a horizontal strip summarizing which bundles this variant's documents
 * participate in, each segment clickable to filter the documents table to that bundle.
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
    <Flex align="center" gap={2} paddingBottom={3} wrap="wrap" data-testid="variant-release-lane">
      <Text muted size={1} weight="medium">
        {t('detail.release-lane.title')}
      </Text>
      <SegmentButton
        count={totalCount}
        id={RELEASE_LANE_ALL}
        label={t('detail.release-lane.all')}
        onSelect={onSelectLane}
        selected={activeLane === RELEASE_LANE_ALL}
        tone="default"
      />
      {segments.map((segment) => {
        let label: string
        if (segment.kind === 'published') {
          label = tCore('release.chip.published')
        } else if (segment.kind === 'drafts') {
          label = tCore('release.chip.draft')
        } else {
          label = segment.release?.metadata?.title ?? tCore('release.placeholder-untitled-release')
        }

        return (
          <SegmentButton
            key={segment.id}
            count={segment.count}
            id={segment.id}
            label={label}
            onSelect={onSelectLane}
            selected={activeLane === segment.id}
            tone={getSegmentTone(segment.kind)}
          />
        )
      })}
    </Flex>
  )
}
