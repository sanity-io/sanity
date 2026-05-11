import {type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../useBundleDocuments'
import {ReleaseReviewDocumentCard} from './ReleaseReviewDocumentCard'
import {ReleaseReviewVerdict} from './ReleaseReviewVerdict'
import {type UseGenerateReleaseReviewResult} from './useGenerateReleaseReview'

const STAGE_LABEL_KEYS = [
  'review-dialog.stage.reading',
  'review-dialog.stage.understanding',
  'review-dialog.stage.structuring',
] as const

const STAGE_INTERVAL_MS = 1800

function GeneratingStageLabel(): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const [stageIndex, setStageIndex] = useState(0)
  useEffect(() => {
    const lastIndex = STAGE_LABEL_KEYS.length - 1
    const timer = setInterval(() => {
      setStageIndex((current) => (current < lastIndex ? current + 1 : current))
    }, STAGE_INTERVAL_MS)
    return () => {
      clearInterval(timer)
    }
  }, [])
  return (
    <Text align="center" size={2} weight="semibold">
      {t(STAGE_LABEL_KEYS[stageIndex])}…
    </Text>
  )
}

function VerdictSkeleton(): React.JSX.Element {
  return (
    <Card padding={4} radius={3}>
      <Stack space={3}>
        <TextSkeleton animated radius={1} style={{width: 96}} />
        <TextSkeleton animated radius={1} style={{width: '80%'}} />
      </Stack>
    </Card>
  )
}

function DocumentCardSkeleton(): React.JSX.Element {
  return (
    <Card padding={3} radius={3} border>
      <Stack space={3}>
        <Flex align="center" gap={3}>
          <Skeleton animated radius={2} style={{width: 33, height: 33, flex: 'none'}} />
          <Stack flex={1} space={2}>
            <TextSkeleton animated radius={1} style={{width: '60%'}} />
            <TextSkeleton animated radius={1} style={{width: '40%'}} />
          </Stack>
        </Flex>
        <TextSkeleton animated radius={1} style={{width: '90%'}} />
      </Stack>
    </Card>
  )
}

interface ReleaseReviewDialogProps {
  release: ReleaseDocument
  reviewAction: UseGenerateReleaseReviewResult
  onClose: () => void
  // When provided, the dialog renders a Cancel + Run release footer so the
  // user can confirm publishing from inside the review.
  onPublish?: () => void
  isPublishing?: boolean
}

export function ReleaseReviewDialog({
  release,
  reviewAction,
  onClose,
  onPublish,
  isPublishing = false,
}: ReleaseReviewDialogProps): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const releaseName = getReleaseIdFromReleaseDocumentId(release._id)
  const {result, isGenerating, error} = reviewAction
  const {results: documentsInRelease} = useBundleDocuments(releaseName)

  const reviewByDocumentId = useMemo(
    () => new Map((result?.documents ?? []).map((entry) => [entry.documentId, entry])),
    [result?.documents],
  )

  return (
    <Dialog
      id="release-ai-review"
      header={t('action.review')}
      onClose={onClose}
      width={2}
      data-testid="release-ai-review-dialog"
      footer={
        onPublish
          ? {
              confirmButton: {
                text: t('action.publish-all-documents'),
                tone: 'positive',
                onClick: onPublish,
                loading: isPublishing,
                disabled: isPublishing,
              },
            }
          : undefined
      }
    >
      {isGenerating && !result && (
        <Stack space={4}>
          <GeneratingStageLabel />
          <VerdictSkeleton />
          <Stack space={2}>
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
          </Stack>
        </Stack>
      )}

      {error && !isGenerating && (
        <Card tone="critical" padding={3} radius={2}>
          <Text size={1}>{t('review-dialog.error', {error: error.message})}</Text>
        </Card>
      )}

      {result && (
        <Stack space={4}>
          <ReleaseReviewVerdict verdict={result.verdict} />
          <Stack space={2}>
            {documentsInRelease.map((entry) => (
              <ReleaseReviewDocumentCard
                key={entry.document._id}
                documentInRelease={entry}
                review={reviewByDocumentId.get(entry.document._id)}
                releaseName={releaseName}
              />
            ))}
          </Stack>
        </Stack>
      )}
    </Dialog>
  )
}
