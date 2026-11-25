import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card, Skeleton} from '@sanity/ui'
import {Text, Box, Flex, Icon} from 'ui5'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {getDocumentVersionVariantId} from '../../../../util/getDocumentVersionVariant'
import {getVariantId} from '../../../../variants/tool/util'
import {releasesLocaleNamespace} from '../../../i18n'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {type VisibleColumn} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'
import {ScheduledDraftHistoryUnavailablePreview} from './ScheduledDraftHistoryUnavailablePreview'

export const ScheduledDraftDocumentPreview: VisibleColumn<TableRelease>['cell'] = ({
  datum: release,
  cellProps,
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {
    firstDocument,
    firstDocumentValidation,
    loading: documentsLoading,
    error: documentsError,
  } = useScheduledDraftDocument(release._id && !release.isLoading ? release._id : undefined)

  // A published or archived scheduled draft reads its document from history, which answers with no
  // revision once the dataset's history retention has removed it
  const finalDocumentId = release.finalDocumentStates?.[0]?.id
  if (
    finalDocumentId &&
    !release.isLoading &&
    (release.state === 'published' || release.state === 'archived') &&
    !documentsLoading &&
    !documentsError &&
    !firstDocument
  ) {
    return (
      <ScheduledDraftHistoryUnavailablePreview cellProps={cellProps} documentId={finalDocumentId} />
    )
  }

  const isLoading = release.isLoading || documentsLoading || !firstDocument

  if (isLoading) {
    return (
      <Flex {...cellProps} alignItems="center" paddingX={2} paddingY={3}>
        <Skeleton animated radius={2} style={{height: '32px', width: '100%'}} />
      </Flex>
    )
  }

  const validationErrorCount =
    firstDocumentValidation?.filter((validation) => validation.level === 'error').length || 0
  const variantRef = getDocumentVersionVariantId({_system: firstDocument._system})
  const variantId = variantRef ? getVariantId(variantRef) : undefined

  return (
    <Box {...cellProps} flexBasis="0%" flexGrow={1} padding={1} paddingLeft={2} paddingRight={2}>
      <Card tone={validationErrorCount ? 'critical' : 'inherit'} radius={2}>
        <Flex alignItems="center" gap={2}>
          <Box flexBasis="0%" flexGrow={1}>
            <ReleaseDocumentPreview
              documentId={firstDocument._id}
              documentTypeName={firstDocument._type}
              releaseId={release._id}
              releaseState={release.state}
              isCardinalityOneRelease
              documentRevision={firstDocument._rev}
              layout="default"
              variantId={variantId}
            />
          </Box>
          {validationErrorCount > 0 && (
            <Box paddingRight={3}>
              <Tooltip
                portal
                placement="bottom-end"
                content={
                  <Text
                    muted
                    size={1}
                    as="div"
                    trim={true}
                    tone={validationErrorCount ? 'critical' : undefined}
                  >
                    <Flex alignItems="center" gap={3} padding={1}>
                      <Icon
                        size={1}
                        style={{margin: '-0.375rem'}}
                        icon={<ToneIcon icon={ErrorOutlineIcon} tone="critical" />}
                      />
                      {t('document-validation.error', {count: validationErrorCount})}
                    </Flex>
                  </Text>
                }
              >
                <Icon
                  size={1}
                  style={{margin: '-0.375rem'}}
                  icon={<ToneIcon icon={ErrorOutlineIcon} tone="critical" />}
                />
              </Tooltip>
            </Box>
          )}
        </Flex>
      </Card>
    </Box>
  )
}
