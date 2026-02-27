import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Skeleton, Text} from '@sanity/ui'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {useTranslation} from '../../../../i18n'
import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {releasesLocaleNamespace} from '../../../i18n'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {type VisibleColumn} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'

export const ScheduledDraftDocumentPreview: VisibleColumn<TableRelease>['cell'] = ({
  datum: release,
  cellProps,
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {
    firstDocument,
    firstDocumentValidation,
    loading: documentsLoading,
  } = useScheduledDraftDocument(release._id && !release.isLoading ? release._id : undefined)

  const isLoading = release.isLoading || documentsLoading || !firstDocument

  if (isLoading) {
    return (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Skeleton animated radius={2} style={{height: '32px', width: '100%'}} />
      </Flex>
    )
  }

  const validationErrorCount =
    firstDocumentValidation?.filter((validation) => validation.level === 'error').length || 0

  return (
    <Box {...cellProps} flex={1} padding={1} paddingLeft={2} paddingRight={2} sizing="border">
      <Card tone={validationErrorCount ? 'critical' : 'inherit'} radius={2}>
        <Flex align="center" gap={2}>
          <Box flex={1}>
            <ReleaseDocumentPreview
              documentId={firstDocument._id}
              documentTypeName={firstDocument._type}
              releaseId={release._id}
              releaseState={release.state}
              isCardinalityOneRelease
              documentRevision={firstDocument._rev}
              layout="default"
            />
          </Box>
          {validationErrorCount > 0 && (
            <Box paddingRight={3}>
              <Tooltip
                portal
                placement="bottom-end"
                content={
                  <Text muted size={1}>
                    <Flex align="center" gap={3} padding={1}>
                      <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                      {t('document-validation.error', {count: validationErrorCount})}
                    </Flex>
                  </Text>
                }
              >
                <Text size={1}>
                  <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                </Text>
              </Tooltip>
            </Box>
          )}
        </Flex>
      </Card>
    </Box>
  )
}
