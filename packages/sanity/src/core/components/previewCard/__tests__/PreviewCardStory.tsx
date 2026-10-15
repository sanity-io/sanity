import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TextWithTone} from '../../textWithTone/TextWithTone'
import {PreviewCard} from '../PreviewCard'

function PreviewRow({
  label,
  selected,
  tone,
}: {
  label: string
  selected?: boolean
  tone: 'default' | 'critical' | 'caution'
}) {
  return (
    <PreviewCard padding={3} radius={2} selected={selected} shadow={1}>
      <Text size={1} weight="medium">
        {label}
      </Text>
      <TextWithTone size={1} tone={tone}>
        {tone} status
      </TextWithTone>
    </PreviewCard>
  )
}

/**
 * Chromatic sentinel for PreviewCard: selected vs idle Card paint, and the
 * selected-state override that forces nested TextWithTone to inherit color.
 * A ui5 Card/Text swap would change that mix without a type error.
 */
export function PreviewCardStory() {
  return (
    <Card padding={4} style={{maxWidth: 360}}>
      <VStack gap={3}>
        <PreviewRow label="Idle card" tone="caution" />
        <PreviewRow label="Selected card" selected tone="caution" />
        <PreviewRow label="Selected critical" selected tone="critical" />
      </VStack>
    </Card>
  )
}
