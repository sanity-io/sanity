import {Card, type CardTone, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleasesLocaleResourceKeys} from '../../../i18n/resources'
import {type ReviewResult, type ReviewRisk} from './reviewResult'

const TONE_BY_RISK: Record<ReviewRisk, CardTone> = {
  low: 'positive',
  medium: 'caution',
  high: 'critical',
}

const LABEL_KEY_BY_RISK: Record<ReviewRisk, ReleasesLocaleResourceKeys> = {
  low: 'review-dialog.verdict.risk.low',
  medium: 'review-dialog.verdict.risk.medium',
  high: 'review-dialog.verdict.risk.high',
}

interface ReleaseReviewVerdictProps {
  verdict: ReviewResult['verdict']
}

export function ReleaseReviewVerdict({verdict}: ReleaseReviewVerdictProps): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  return (
    <Card tone={TONE_BY_RISK[verdict.risk]} padding={4} radius={3}>
      <Stack space={3}>
        <Text size={1} weight="semibold" muted>
          {t(LABEL_KEY_BY_RISK[verdict.risk])}
        </Text>
        <Text size={2}>{verdict.summary}</Text>
      </Stack>
    </Card>
  )
}
