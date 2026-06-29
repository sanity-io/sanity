import {
  ChevronDownIcon,
  CopyIcon,
  DocumentsIcon,
  UnknownIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {getPublishedId} from '@sanity/id-utils'
import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType, type ReactNode, useCallback, useMemo} from 'react'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {Translate} from '../../i18n/Translate'
import {SanityDefaultPreview} from '../../preview/components/SanityDefaultPreview'
import {
  type CrossDatasetReferences,
  type deletionMachine,
  type InternalReferences,
} from '../machines/deletionMachine'
import {type selectionMachine} from '../machines/selectionMachine'
import {type DocumentGroupInventoryReferencePreviewLinkProps} from '../types'
import {
  ChevronWrapper,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  DocumentIdFlex,
  OtherReferenceCount,
  Table,
} from './ConfirmDeleteDialog.styles'
import {type DocumentGroupInventoryProps} from './DocumentGroupInventory'

const EMPTY_INTERNAL_REFERENCES: InternalReferences = {totalCount: 0, references: []}
const EMPTY_CROSS_DATASET_REFERENCES: CrossDatasetReferences = {totalCount: 0, references: []}

interface Props {
  documentId: string
  documentType: string
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  portalElementName: string
  components: DocumentGroupInventoryProps['components']
}

export const ConfirmDeleteDialog: ComponentType<Props> = ({
  documentId,
  documentType,
  deletionRef,
  selectionRef,
  portalElementName,
  components,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const {DocTitle, ReferencePreviewLink, VersionsPreviewList} = components

  const variantIds = useSelector(selectionRef, ({context}) => context.selectedIds)

  const internalReferences =
    useSelector(deletionRef, ({context}) => context.internalReferences) ?? EMPTY_INTERNAL_REFERENCES

  const crossDatasetReferences =
    useSelector(deletionRef, ({context}) => context.crossDatasetReferences) ??
    EMPTY_CROSS_DATASET_REFERENCES

  const datasetNames = useSelector(deletionRef, ({context}) => context.datasetNames)

  const hasUnknownDatasetNames = useSelector(
    deletionRef,
    ({context}) => context.hasUnknownDatasetNames,
  )
  const warnIncomingReferences = useSelector(deletionRef, (snapshot) =>
    snapshot.hasTag('warnIncomingReferences'),
  )
  const isDeletionError = useSelector(deletionRef, (snapshot) =>
    snapshot.matches({active: {deletion: 'error'}}),
  )

  const deletionError = useSelector(deletionRef, ({context}) => context.error)
  const error = isDeletionError ? deletionError : undefined

  const canConfirmDeletion = useSelector(deletionRef, (snapshot) =>
    snapshot.can({type: 'delete.confirm'}),
  )

  const subjectCount = variantIds.size
  const subject = t('document-group.subject.version', {count: subjectCount})

  const totalCount = internalReferences.totalCount + crossDatasetReferences.totalCount

  const documentTitle = (
    <DocTitle
      document={useMemo(
        () => ({
          _id: documentId,
          _type: documentType,
        }),
        [documentId, documentType],
      )}
    />
  )

  return (
    <Dialog
      id="confirmVariantDeletion"
      width={1}
      portal={portalElementName}
      header={t('document-group.delete.title', {count: subjectCount, subject})}
      footer={{
        cancelButton: {
          onClick: () => deletionRef.send({type: 'delete.cancel'}),
          text: t('document-group.delete.cancel-button.text'),
        },
        confirmButton: {
          text: t('document-group.delete.confirm-button.text', {count: subjectCount}),
          onClick: () => deletionRef.send({type: 'delete.confirm'}),
          disabled: !canConfirmDeletion,
        },
      }}
      onClose={() => deletionRef.send({type: 'delete.cancel'})}
    >
      <Stack gap={4}>
        {error ? (
          <Card tone="critical" padding={3}>
            <Text size={1}>{t('document-group.delete.error.message')}</Text>
          </Card>
        ) : null}
        <VersionsPreviewList documentType={documentType} documentVersions={[...variantIds]} />
        {warnIncomingReferences && (
          <>
            <Card padding={3} radius={2} tone="caution" flex="none">
              <Flex>
                <Text aria-hidden="true" size={1}>
                  <WarningOutlineIcon />
                </Text>
                <Box flex={1} marginLeft={3}>
                  <Text size={1}>
                    <Translate
                      i18nKey="document-group.delete.referring-document-count.text"
                      components={{DocumentTitle: () => documentTitle}}
                      t={t}
                      values={{count: totalCount}}
                    />
                  </Text>
                </Box>
              </Flex>
            </Card>
            <References
              documentId={documentId}
              documentTitle={documentTitle}
              internalReferences={internalReferences}
              crossDatasetReferences={crossDatasetReferences}
              datasetNames={datasetNames}
              hasUnknownDatasetNames={hasUnknownDatasetNames}
              ReferencePreviewLink={ReferencePreviewLink}
            />
          </>
        )}
      </Stack>
    </Dialog>
  )
}

interface ReferencesProps {
  documentId: string
  documentTitle: ReactNode
  internalReferences: InternalReferences
  crossDatasetReferences: CrossDatasetReferences
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
  onReferenceLinkClick?: () => void
  ReferencePreviewLink: ComponentType<DocumentGroupInventoryReferencePreviewLinkProps>
}

const References: ComponentType<ReferencesProps> = ({
  documentId,
  documentTitle,
  internalReferences,
  crossDatasetReferences,
  datasetNames,
  hasUnknownDatasetNames,
  onReferenceLinkClick,
  ReferencePreviewLink,
}) => {
  const schema = useSchema()
  const toast = useToast()
  const {t} = useTranslation(studioLocaleNamespace)

  const renderPreviewItem = useCallback(
    (item: {_id: string; _type: string}) => {
      const type = schema.get(item._type)
      if (type) {
        return <ReferencePreviewLink type={type} value={item} onClick={onReferenceLinkClick} />
      }

      return (
        <Box padding={2}>
          <SanityDefaultPreview
            icon={UnknownIcon}
            title={t('document-group.delete.preview-item.preview-unavailable.title')}
            subtitle={t('document-group.delete.preview-item.preview-unavailable.subtitle', {
              documentId: item._id,
            })}
            layout="default"
          />
        </Box>
      )
    },
    [schema, t, onReferenceLinkClick, ReferencePreviewLink],
  )

  if (internalReferences.totalCount === 0 && crossDatasetReferences.totalCount === 0) {
    return null
  }

  // We do some extra checks to handle cases where you have unavailable dataset
  // name(s) due to permissions, both alone and in combination with known datasets.
  // This normalizes one or more undefined dataset names to the catch-all `unavailable`.
  const normalizedDatasetNames = [
    ...datasetNames,
    ...(hasUnknownDatasetNames ? ['unavailable'] : []),
  ]

  const datasetSubtitle = t('document-group.delete.cdr-summary.subtitle', {
    count: normalizedDatasetNames.length,
    datasets: normalizedDatasetNames.join(', '),
    context: hasUnknownDatasetNames && normalizedDatasetNames.length ? 'unavailable' : '',
  })

  return (
    <>
      <Box flex="none">
        <Text size={1}>
          <Translate
            i18nKey="document-group.delete.referring-documents-descriptor.text"
            t={t}
            components={{DocumentTitle: () => documentTitle}}
          />
        </Text>
      </Box>
      <Card radius={2} shadow={1} flex="auto" padding={1}>
        <Flex direction="column">
          {internalReferences.totalCount > 0 && (
            <Stack as="ul" gap={2} data-testid="internal-references">
              {internalReferences.references.map((item) => (
                <Box key={item._id} as="li">
                  {renderPreviewItem(item)}
                </Box>
              ))}
              {internalReferences.totalCount > internalReferences.references.length && (
                <Box as="li" padding={3}>
                  <OtherReferenceCount {...internalReferences} />
                </Box>
              )}
            </Stack>
          )}
          {crossDatasetReferences.totalCount > 0 && (
            <CrossDatasetReferencesDetails
              data-testid="cross-dataset-references"
              style={{
                // only add the border if needed
                borderTop:
                  internalReferences.totalCount > 0
                    ? '1px solid var(--card-shadow-outline-color)'
                    : undefined,
              }}
            >
              <CrossDatasetReferencesSummary>
                <Card
                  as="a"
                  marginTop={internalReferences.totalCount > 0 ? 2 : 0}
                  radius={2}
                  shadow={1}
                  paddingY={1}
                >
                  <Flex align="center" gap={3} paddingX={3} paddingY={1}>
                    <Text size={1}>
                      <DocumentsIcon />
                    </Text>
                    <Stack gap={2}>
                      <Text textOverflow="ellipsis" size={1}>
                        {t('document-group.delete.cdr-summary.title', {
                          count: normalizedDatasetNames.length,
                          documentCount: t('document-group.delete.cdr-summary.document-count', {
                            count: crossDatasetReferences.totalCount,
                          }),
                        })}
                      </Text>
                      <Text title={datasetSubtitle} textOverflow="ellipsis" size={1} muted>
                        {datasetSubtitle}
                      </Text>
                    </Stack>
                    <ChevronWrapper>
                      <Text muted size={1}>
                        <ChevronDownIcon />
                      </Text>
                    </ChevronWrapper>
                  </Flex>
                </Card>
              </CrossDatasetReferencesSummary>
              <Box overflow="auto" paddingTop={2}>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Text muted size={1} style={{minWidth: '5rem'}} weight="medium">
                          {t('document-group.delete.cdr-table.project-id.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium">
                          {t('document-group.delete.cdr-table.dataset.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium">
                          {t('document-group.delete.cdr-table.document-id.label')}
                        </Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossDatasetReferences.references
                      .filter((reference): reference is Required<typeof reference> => {
                        return 'projectId' in reference
                      })
                      .map(({projectId, datasetName, documentId: referenceId}, index) => (
                        <tr key={`${documentId}-${index}`}>
                          <td>
                            <Text size={1}>{projectId}</Text>
                          </td>
                          <td>
                            <Text size={1}>{datasetName || 'unavailable'}</Text>
                          </td>
                          <td>
                            <DocumentIdFlex align="center" gap={2} justify="flex-end">
                              <Text textOverflow="ellipsis" size={1}>
                                {referenceId || 'unavailable'}
                              </Text>
                              {referenceId && (
                                <Button
                                  mode="bleed"
                                  icon={CopyIcon}
                                  tooltipProps={{
                                    content: t(
                                      'document-group.delete.cdr-table.copy-id-button.tooltip',
                                    ),
                                  }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(referenceId).catch(() => {
                                      toast.push({
                                        status: 'error',
                                        title: t(
                                          'document-group.delete.cdr-table.id-copied-toast.title-failed',
                                        ),
                                      })
                                    })
                                  }}
                                />
                              )}
                            </DocumentIdFlex>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                <OtherReferenceCount {...crossDatasetReferences} />
              </Box>
            </CrossDatasetReferencesDetails>
          )}
        </Flex>
      </Card>
    </>
  )
}
