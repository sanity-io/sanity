import {ChevronDownIcon, ChevronRightIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {AvatarStack, Box, Card, Flex} from '@sanity/ui'

import {Button} from '../../../../../ui-components'
import {RelativeTime} from '../../../../components/RelativeTime'
import {UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {Translate, useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {Chip} from '../../components/Chip'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {type DocumentValidationStatus} from '../useBundleDocuments'

export function DocumentReviewHeader({
  previewValues,
  document,
  isLoading,
  history,
  releaseId,
  validation,
  isExpanded,
  toggleIsExpanded,
}: {
  document: SanityDocument
  previewValues: PreviewValue | undefined | null
  isLoading: boolean
  releaseId: string
  validation?: DocumentValidationStatus
  isExpanded: boolean
  toggleIsExpanded: () => void
  history?: {
    createdBy: string
    lastEditedBy: string
    editors: string[]
  }
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  return (
    <Card tone={validation?.hasError ? 'critical' : 'default'} radius={3}>
      <Flex justify="space-between" align="center" paddingY={1} paddingX={2}>
        <Button
          data-testid="document-review-header-toggle"
          icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
          mode="bleed"
          onClick={toggleIsExpanded}
          tooltipProps={{
            content: isExpanded ? 'Collapse document diff' : 'Expand document diff',
            placement: 'top',
          }}
        />
        <Box style={{flex: '1'}}>
          <ReleaseDocumentPreview
            documentId={document._id}
            documentTypeName={document._type}
            releaseId={releaseId}
            previewValues={previewValues}
            isLoading={isLoading}
          />
        </Box>
        <Flex gap={2} padding={3} style={{flexShrink: 0}}>
          {history?.createdBy && (
            <Chip
              avatar={<UserAvatar size={0} user={history?.createdBy} />}
              text={
                <span>
                  <Translate
                    t={t}
                    i18nKey={'created'}
                    components={{
                      RelativeTime: () => (
                        <RelativeTime time={document._createdAt} useTemporalPhrase />
                      ),
                    }}
                  />
                </span>
              }
            />
          )}
          {history?.lastEditedBy && (
            <Chip
              avatar={<UserAvatar size={0} user={history?.lastEditedBy} />}
              text={
                <span>
                  <Translate
                    t={t}
                    i18nKey={'review.edited'}
                    components={{
                      RelativeTime: () => (
                        <RelativeTime time={document._updatedAt} useTemporalPhrase />
                      ),
                    }}
                  />
                </span>
              }
            />
          )}
          <Box padding={1}>
            <AvatarStack size={0} style={{margin: -1}}>
              {history?.editors?.map((userId) => <UserAvatar key={userId} user={userId} />)}
            </AvatarStack>
          </Box>
        </Flex>
      </Flex>
    </Card>
  )
}
