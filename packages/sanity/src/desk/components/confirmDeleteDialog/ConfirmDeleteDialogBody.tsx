import React, {useCallback} from 'react'
import {
  WarningOutlineIcon,
  DocumentsIcon,
  CopyIcon,
  UnknownIcon,
  ChevronDownIcon,
} from '@sanity/icons'
import {useToast, Text, Box, Button, Flex, Label, Card, Stack} from '@sanity/ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import {structureLocaleNamespace} from '../../i18n'
import {ReferencePreviewLink} from './ReferencePreviewLink'
import {ReferringDocuments} from './useReferringDocuments'
import {
  OtherReferenceCount,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  Table,
  ChevronWrapper,
  DocumentIdFlex,
} from './ConfirmDeleteDialogBody.styles'
import {SanityDefaultPreview, Translate, useSchema, useTranslation} from 'sanity'

type DeletionConfirmationDialogBodyProps = Required<ReferringDocuments> & {
  documentTitle: React.ReactNode
  action: 'unpublish' | 'delete'
  onReferenceLinkClick?: () => void
}

/**
 * The inner part of the `ConfirmDeleteDialog`. This is ran when both the
 * `crossDatasetReferences` and `internalReferences` are loaded.
 */
export function ConfirmDeleteDialogBody({
  crossDatasetReferences,
  internalReferences,
  documentTitle,
  totalCount,
  action,
  datasetNames,
  hasUnknownDatasetNames,
  onReferenceLinkClick,
}: DeletionConfirmationDialogBodyProps) {
  const schema = useSchema()
  const toast = useToast()
  const {t} = useTranslation(structureLocaleNamespace)

  const renderPreviewItem = useCallback(
    (item: any) => {
      const type = schema.get(item._type)
      if (type) {
        return <ReferencePreviewLink type={type} value={item} onClick={onReferenceLinkClick} />
      }

      return (
        // Padding added to match the ReferencePreviewLink styling
        <Box padding={2}>
          <SanityDefaultPreview
            icon={UnknownIcon}
            title={t('confirm-delete-dialog.preview-item.preview-unavailable.title')}
            subtitle={t('confirm-delete-dialog.preview-item.preview-unavailable.subtitle', {
              documentId: item._id,
            })}
            layout="default"
          />
        </Box>
      )
    },
    [schema, t, onReferenceLinkClick],
  )

  if (internalReferences?.totalCount === 0 && crossDatasetReferences?.totalCount === 0) {
    return (
      <Text as="p">
        <Translate
          t={t}
          i18nKey="confirm-delete-dialog.confirmation.text"
          context={action}
          components={{DocumentTitle: () => <strong>{documentTitle}</strong>}}
        />
      </Text>
    )
  }

  // We do some extra checks to handle cases where you have unavailable dataset
  // name(s) due to permissions, both alone and in combination with known datasets

  // This normalizes one or more undefined dataset names to the catch-all `unavailable`
  const normalizedDatasetNames = [
    ...datasetNames,
    ...(hasUnknownDatasetNames ? ['unavailable'] : []),
  ]

  const datasetSubtitle = t('confirm-delete-dialog.cdr-summary.subtitle', {
    count: normalizedDatasetNames.length,
    datasets: normalizedDatasetNames.join(', '),
    context: hasUnknownDatasetNames && normalizedDatasetNames.length ? 'unavailable' : '',
  })

  return (
    <Card>
      <Card padding={3} radius={2} tone="caution" marginBottom={4} flex="none">
        <Flex>
          <Text aria-hidden="true" size={1}>
            <WarningOutlineIcon />
          </Text>
          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              <Translate
                i18nKey="confirm-delete-dialog.referring-document-count.text"
                components={{DocumentTitle: () => documentTitle}}
                t={t}
                values={{count: totalCount}}
              />
            </Text>
          </Box>
        </Flex>
      </Card>

      <Box flex="none" marginBottom={4}>
        <Text>
          <Translate
            i18nKey="confirm-delete-dialog.referring-documents-descriptor.text"
            t={t}
            context={action}
            components={{DocumentTitle: () => documentTitle}}
          />
        </Text>
      </Box>

      <Card radius={2} shadow={1} marginBottom={4} flex="auto">
        <Flex direction="column">
          {internalReferences.totalCount > 0 && (
            <Stack as="ul" padding={2} space={3} data-testid="internal-references">
              {internalReferences?.references.map((item) => (
                <Box as="li" key={item._id}>
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
                <Card as="a" margin={2} radius={2} shadow={1} paddingY={1}>
                  <Flex align="center" margin={2}>
                    <Box marginLeft={3} marginRight={4}>
                      <Text size={3}>
                        <DocumentsIcon />
                      </Text>
                    </Box>
                    <Flex marginRight={4} direction="column">
                      <Box marginBottom={2}>
                        <Text>
                          {t('confirm-delete-dialog.cdr-summary.title', {
                            count: normalizedDatasetNames.length,
                            documentCount: t('confirm-delete-dialog.cdr-summary.document-count', {
                              count: crossDatasetReferences.totalCount,
                            }),
                          })}
                        </Text>
                      </Box>
                      <Box>
                        <Text title={datasetSubtitle} textOverflow="ellipsis" size={1} muted>
                          {datasetSubtitle}
                        </Text>
                      </Box>
                    </Flex>
                    <ChevronWrapper>
                      <Text muted>
                        <ChevronDownIcon />
                      </Text>
                    </ChevronWrapper>
                  </Flex>
                </Card>
              </CrossDatasetReferencesSummary>

              <Box overflow="auto" paddingBottom={2} paddingX={2}>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Label muted size={0} style={{minWidth: '5rem'}}>
                          {t('confirm-delete-dialog.cdr-table.project-id.label')}
                        </Label>
                      </th>
                      <th>
                        <Label muted size={0}>
                          {t('confirm-delete-dialog.cdr-table.dataset.label')}
                        </Label>
                      </th>
                      <th>
                        <Label muted size={0}>
                          {t('confirm-delete-dialog.cdr-table.document-id.label')}
                        </Label>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossDatasetReferences.references
                      .filter((reference): reference is Required<typeof reference> => {
                        return 'projectId' in reference
                      })
                      .map(({projectId, datasetName, documentId}, index) => (
                        // eslint-disable-next-line react/no-array-index-key
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
                                {documentId || 'unavailable'}
                              </Text>
                              {documentId && (
                                <CopyToClipboard
                                  text={documentId}
                                  // eslint-disable-next-line react/jsx-no-bind
                                  onCopy={() => {
                                    toast.push({
                                      title: t(
                                        'confirm-delete-dialog.cdr-table.id-copied-toast.title',
                                      ),
                                      status: 'success',
                                    })
                                  }}
                                >
                                  <Button
                                    title={t(
                                      'confirm-delete-dialog.cdr-table.copy-id-button.tooltip',
                                    )}
                                    mode="bleed"
                                    icon={CopyIcon}
                                    fontSize={0}
                                  />
                                </CopyToClipboard>
                              )}
                            </DocumentIdFlex>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>

                <Box padding={2}>
                  <OtherReferenceCount {...crossDatasetReferences} />
                </Box>
              </Box>
            </CrossDatasetReferencesDetails>
          )}
        </Flex>
      </Card>

      <Box flex="none">
        <Text>
          <Translate
            i18nKey="confirm-delete-dialog.referential-integrity-disclaimer.text"
            t={t}
            context={action}
            components={{DocumentTitle: () => documentTitle}}
          />
        </Text>
      </Box>
    </Card>
  )
}
