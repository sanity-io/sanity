import {Card, type CardTone, Stack, Text} from '@sanity/ui'

import {type ReviewResult, type ReviewRisk} from './reviewResult'

const TONE_BY_RISK: Record<ReviewRisk, CardTone> = {
  low: 'positive',
  medium: 'caution',
  high: 'critical',
}

const LABEL_BY_RISK: Record<ReviewRisk, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
}

interface ReleaseReviewVerdictProps {
  verdict: ReviewResult['verdict']
}

export function ReleaseReviewVerdict({verdict}: ReleaseReviewVerdictProps): React.JSX.Element {
  return (
    <Card tone={TONE_BY_RISK[verdict.risk]} padding={4} radius={3}>
      <Stack space={3}>
        <Text size={1} weight="semibold" muted>
          {LABEL_BY_RISK[verdict.risk]}
        </Text>
        <Text size={2}>{verdict.summary}</Text>
      </Stack>
    </Card>
  )
}
