import {type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../useBundleDocuments'
import {ReleaseReviewDocumentCard} from './ReleaseReviewDocumentCard'
import {ReleaseReviewVerdict} from './ReleaseReviewVerdict'
import {type UseGenerateReleaseReviewResult} from './useGenerateReleaseReview'

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
      // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
      header="Review changes"
      onClose={onClose}
      width={2}
      data-testid="release-ai-review-dialog"
      footer={
        onPublish
          ? {
              confirmButton: {
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                text: 'Run release',
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
        <Flex align="center" gap={3} justify="center" padding={4}>
          <Spinner muted />
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Text muted size={1}>
            Generating review…
          </Text>
        </Flex>
      )}

      {error && !isGenerating && (
        <Card tone="critical" padding={3} radius={2}>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Text size={1}>Failed to generate review: {error.message}</Text>
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
