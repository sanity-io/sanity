import {LaunchIcon, TransferIcon} from '@sanity/icons'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useWorkspace} from '../../../../studio/workspace'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../../i18n'
import {getDocumentActionType, getReleaseDocumentActionConfig} from '../releaseDocumentActions'
import {type DocumentInRelease} from '../useBundleDocuments'
import {type ReviewResult} from './reviewResult'

function renderActionBadge(
  action: ReturnType<typeof getDocumentActionType>,
  t: ReturnType<typeof useTranslation>['t'],
): React.JSX.Element | undefined {
  if (action === null) return undefined
  const config = getReleaseDocumentActionConfig(action)
  if (!config) return undefined
  return (
    <Badge radius={2} tone={config.tone}>
      {t(config.labelKey)}
    </Badge>
  )
}

interface BuildDiffViewUrlArgs {
  basePath: string
  releaseName: string
  documentType: string
  publishedId: string
  versionId: string
}

function buildDiffViewUrl(args: BuildDiffViewUrlArgs): string {
  const {basePath, releaseName, documentType, publishedId, versionId} = args
  const params = new URLSearchParams({
    'perspective': releaseName,
    'structure[diffView]': 'version',
    'structure[previousDocument]': `${documentType},${publishedId}`,
    'structure[nextDocument]': `${documentType},${versionId}`,
  })
  return `${basePath}/structure/${documentType};${versionId}?${params.toString()}`
}

interface ReleaseReviewDocumentCardProps {
  documentInRelease: DocumentInRelease
  review: ReviewResult['documents'][number] | undefined
  releaseName: string
}

export function ReleaseReviewDocumentCard({
  documentInRelease,
  review,
  releaseName,
}: ReleaseReviewDocumentCardProps): React.JSX.Element {
  const workspace = useWorkspace()
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {_id: versionId, _type: documentType} = documentInRelease.document
  const publishedId = getPublishedId(versionId)
  const action = getDocumentActionType(documentInRelease)
  const isUnpublishing = action === 'unpublished'

  const {isLoading: isPreviewLoading, value: previewValue} = useDocumentPreviewValues({
    documentId: isUnpublishing ? publishedId : versionId,
    documentType,
    perspectiveStack: isUnpublishing ? [] : [releaseName],
  })

  const openDocumentHref = isUnpublishing
    ? undefined
    : router.resolveIntentLink('edit', {id: versionId, type: documentType})

  const compareChangesHref =
    action === 'changed'
      ? buildDiffViewUrl({
          basePath: workspace.basePath ?? '',
          releaseName,
          documentType,
          publishedId,
          versionId,
        })
      : undefined

  const hasActions = Boolean(openDocumentHref || compareChangesHref)

  return (
    <Card padding={3} radius={3} border>
      <Stack space={3}>
        <SanityDefaultPreview
          {...(previewValue ?? {})}
          isPlaceholder={isPreviewLoading}
          status={renderActionBadge(action, t)}
        />
        {review?.commentary && <Text size={1}>{review.commentary}</Text>}
        {hasActions && (
          <Flex gap={2}>
            {openDocumentHref && (
              <Button
                as="a"
                href={openDocumentHref}
                icon={LaunchIcon}
                mode="bleed"
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                text="Open document"
              />
            )}
            {compareChangesHref && (
              <Button
                as="a"
                href={compareChangesHref}
                icon={TransferIcon}
                mode="bleed"
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                text="Compare changes"
              />
            )}
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
