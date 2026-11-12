import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {UnknownIcon} from '@sanity/icons/Unknown'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {getPublishedId} from '@sanity/id-utils'
import {Card} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {type ComponentType, type ReactNode, useCallback, useMemo} from 'react'
import {Text, VStack, Box, Flex, Icon} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {Translate} from '../../i18n/Translate'
import {SanityDefaultPreview} from '../../preview/components/SanityDefaultPreview'
import {isPublishedId} from '../../util/draftUtils'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {
  type CrossDatasetReferences,
  type deletionMachine,
  type IncomingReference,
  type InternalReferences,
} from '../machines/deletionMachine'
import {type selectionMachine} from '../machines/selectionMachine'
import {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../types'
import {
  ChevronWrapper,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  DocumentIdFlex,
  OtherReferenceCount,
  Table,
} from './ConfirmDeleteDialog.styles'

const EMPTY_INTERNAL_REFERENCES: InternalReferences = {totalCount: 0, references: []}
const EMPTY_CROSS_DATASET_REFERENCES: CrossDatasetReferences = {totalCount: 0, references: []}

function DocumentTitle({documentTitle}: {children?: ReactNode; documentTitle?: ReactNode}) {
  return documentTitle
}

interface Props {
  documentId: string
  documentType: string
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  portalElementName: string
  components: DocumentGroupInventoryComponents
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
  const variants = useSelector(selectionRef, ({context}) => context.variants)

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
  const canConfirmDeletionExcludingPublished = useSelector(deletionRef, (snapshot) =>
    snapshot.can({type: 'delete.confirmExcludingPublished'}),
  )

  const subjectCount = variantIds.size
  const subject = t('document-group.subject.version', {count: subjectCount})

  const selectedIds = [...variantIds]
  // The published document is the Default: the only version other documents can link to.
  const includesDefault = selectedIds.some(isPublishedId)
  const otherVersionCount = selectedIds.filter((id) => !isPublishedId(id)).length
  const remainingVariantCount = includesDefault
    ? variants.filter(
        (variant) =>
          !variantIds.has(variant.id) &&
          getDocumentVersionVariantId(variant.document) !== undefined,
      ).length
    : 0
  const requiredReferenceCount = internalReferences.references.filter(
    (reference) => reference.required === true,
  ).length
  const isStrengthKnown =
    internalReferences.references.length > 0 &&
    internalReferences.references.every((reference) => typeof reference.required === 'boolean')
  const isDefaultBlocked = includesDefault && requiredReferenceCount > 0
  const offerExcludingDefault = isDefaultBlocked && canConfirmDeletionExcludingPublished

  const header = includesDefault
    ? subjectCount === 1
      ? t('document-group.delete.default-title')
      : t('document-group.delete.with-default-title', {count: subjectCount})
    : t('document-group.delete.title', {count: subjectCount, subject})

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
      header={header}
      footer={{
        cancelButton: {
          onClick: () => deletionRef.send({type: 'delete.cancel'}),
          text: t('document-group.delete.cancel-button.text'),
        },
        confirmButton: offerExcludingDefault
          ? {
              text: t('document-group.delete.confirm-excluding-published-button.text', {
                count: otherVersionCount,
              }),
              onClick: () => deletionRef.send({type: 'delete.confirmExcludingPublished'}),
            }
          : {
              text: t('document-group.delete.confirm-button.text'),
              onClick: () => deletionRef.send({type: 'delete.confirm'}),
              disabled: !canConfirmDeletion,
            },
      }}
      onClose={() => deletionRef.send({type: 'delete.cancel'})}
    >
      <VStack gap={4}>
        {error ? (
          <Card tone="critical" padding={3}>
            <Text size={1} as="div" trim={true} tone="critical">
              {t('document-group.delete.error.message')}
            </Text>
          </Card>
        ) : null}
        <VersionsPreviewList documentType={documentType} documentVersions={selectedIds} />
        {!includesDefault && (
          <Notice
            tone="neutral"
            title={t('document-group.delete.no-links.title')}
            description={t('document-group.delete.no-links.description')}
          />
        )}
        {isDefaultBlocked && (
          <Notice
            tone="critical"
            title={t('document-group.delete.blocked.title', {count: requiredReferenceCount})}
            description={t('document-group.delete.blocked.description')}
            testId="default-blocked"
          />
        )}
        {warnIncomingReferences && !isDefaultBlocked && isStrengthKnown && (
          <Card padding={3} radius={2} tone="caution" flex="none" data-testid="optional-links">
            <Text size={1} as="div" trim={true} tone="caution">
              <Translate
                i18nKey="document-group.delete.optional-links.text"
                components={{DocumentTitle}}
                componentProps={{documentTitle}}
                t={t}
                values={{count: totalCount}}
              />
            </Text>
          </Card>
        )}
        {warnIncomingReferences && (
          <>
            {!isDefaultBlocked && !isStrengthKnown && (
              <Card padding={3} radius={2} tone="caution" flex="none">
                <Flex>
                  <Icon
                    icon={WarningOutlineIcon}
                    aria-hidden="true"
                    size={1}
                    style={{margin: '-0.375rem'}}
                    tone="caution"
                  />
                  <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
                    <Text size={1} as="div" trim={true} tone="caution">
                      <Translate
                        i18nKey="document-group.delete.referring-document-count.text"
                        components={{DocumentTitle}}
                        componentProps={{documentTitle}}
                        t={t}
                        values={{count: totalCount}}
                      />
                    </Text>
                  </Box>
                </Flex>
              </Card>
            )}
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
        {includesDefault && remainingVariantCount > 0 && (
          <Notice
            tone="neutral"
            title={t('document-group.delete.variants-stay.text', {count: remainingVariantCount})}
          />
        )}
      </VStack>
    </Dialog>
  )
}

function Notice({
  tone,
  title,
  description,
  testId,
}: {
  tone: 'neutral' | 'critical'
  title: string
  description?: string
  testId?: string
}) {
  return (
    <Card padding={3} radius={2} tone={tone} flex="none" data-testid={testId}>
      <Flex>
        <Icon
          icon={tone === 'critical' ? WarningOutlineIcon : InfoOutlineIcon}
          aria-hidden="true"
          size={1}
          style={{margin: '-0.375rem'}}
          tone={tone === 'critical' ? 'critical' : undefined}
        />
        <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
          <VStack gap={3}>
            <Text
              size={1}
              as="div"
              trim={true}
              weight="medium"
              tone={tone === 'critical' ? 'critical' : undefined}
            >
              {title}
            </Text>
            {description ? (
              <Text size={1} as="div" trim={true} muted>
                {description}
              </Text>
            ) : null}
          </VStack>
        </Box>
      </Flex>
    </Card>
  )
}

/** Required references first, so the ones that block the delete lead the list. */
function sortRequiredFirst(references: IncomingReference[]): IncomingReference[] {
  return [...references].sort((a, b) => Number(b.required === true) - Number(a.required === true))
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
    (item: IncomingReference) => {
      const type = schema.get(item._type)
      if (type) {
        const preview = (
          <ReferencePreviewLink
            type={type}
            value={{_id: item._id, _type: item._type}}
            onClick={onReferenceLinkClick}
          />
        )
        if (typeof item.required !== 'boolean') return preview
        return (
          <Flex alignItems="center" gap={2}>
            <Box flexBasis="0%" flexGrow={1}>
              {preview}
            </Box>
            <Box paddingRight={2} flexShrink={0}>
              <Text
                size={0}
                weight="medium"
                as="div"
                trim={true}
                tone={item.required ? 'critical' : undefined}
                muted={!item.required}
                data-testid={`reference-tag-${item._id}`}
              >
                {t(
                  item.required
                    ? 'document-group.delete.reference-tag.required'
                    : 'document-group.delete.reference-tag.optional',
                )}
              </Text>
            </Box>
          </Flex>
        )
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
      <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
        <Text size={1} as="div" trim={true}>
          <Translate
            i18nKey="document-group.delete.referring-documents-descriptor.text"
            t={t}
            components={{DocumentTitle}}
            componentProps={{documentTitle}}
          />
        </Text>
      </Box>
      <Card radius={2} shadow={1} flex="auto" padding={1}>
        <Flex flexDirection="column">
          {internalReferences.totalCount > 0 && (
            <VStack as="ul" gap={2} data-testid="internal-references">
              {sortRequiredFirst(internalReferences.references).map((item) => (
                <Box key={item._id} as="li">
                  {renderPreviewItem(item)}
                </Box>
              ))}
              {internalReferences.totalCount > internalReferences.references.length && (
                <Box as="li" padding={3}>
                  <OtherReferenceCount {...internalReferences} />
                </Box>
              )}
            </VStack>
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
                  <Flex alignItems="center" gap={3} paddingX={3} paddingY={1}>
                    <Icon icon={DocumentsIcon} size={1} />
                    <VStack gap={2}>
                      <Text truncate={1} size={1} as="div" trim={true}>
                        {t('document-group.delete.cdr-summary.title', {
                          count: normalizedDatasetNames.length,
                          documentCount: t('document-group.delete.cdr-summary.document-count', {
                            count: crossDatasetReferences.totalCount,
                          }),
                        })}
                      </Text>
                      <Text
                        title={datasetSubtitle}
                        truncate={1}
                        size={1}
                        muted
                        as="div"
                        trim={true}
                      >
                        {datasetSubtitle}
                      </Text>
                    </VStack>
                    <ChevronWrapper>
                      <Icon icon={ChevronDownIcon} size={1} muted />
                    </ChevronWrapper>
                  </Flex>
                </Card>
              </CrossDatasetReferencesSummary>
              <Box overflow="auto" paddingTop={2}>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Text
                          muted
                          size={1}
                          style={{minWidth: '5rem'}}
                          weight="medium"
                          as="div"
                          trim={true}
                        >
                          {t('document-group.delete.cdr-table.project-id.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium" as="div" trim={true}>
                          {t('document-group.delete.cdr-table.dataset.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium" as="div" trim={true}>
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
                            <Text size={1} as="div" trim={true}>
                              {projectId}
                            </Text>
                          </td>
                          <td>
                            <Text size={1} as="div" trim={true}>
                              {datasetName || 'unavailable'}
                            </Text>
                          </td>
                          <td>
                            <DocumentIdFlex alignItems="center" gap={2} justifyContent="flex-end">
                              <Text truncate={1} size={1} as="div" trim={true}>
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
