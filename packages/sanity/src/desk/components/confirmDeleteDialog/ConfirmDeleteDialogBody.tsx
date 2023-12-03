import React, {useCallback} from 'react'
import {
  DocumentsIcon,
  CopyIcon,
  UnknownIcon,
  ChevronDownIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {useToast, Text, Box, Flex, Card, Stack} from '@sanity/ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import {Button} from '../../../ui'
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
      <Text as="p" size={1}>
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
    <Flex direction="column" gap={4}>
      <Card padding={3} radius={2} tone="caution" flex="none">
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
      <Box flex="none">
        <Text size={1}>
          <Translate
            i18nKey="confirm-delete-dialog.referring-documents-descriptor.text"
            t={t}
            context={action}
            components={{DocumentTitle: () => documentTitle}}
          />
        </Text>
      </Box>
      <Card radius={2} shadow={1} flex="auto" padding={2}>
        <Flex direction="column">
          {internalReferences.totalCount > 0 && (
            <Stack as="ul" marginBottom={2} space={2} data-testid="internal-references">
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
                    <Stack space={2}>
                      <Text textOverflow="ellipsis" size={1}>
                        {t('confirm-delete-dialog.cdr-summary.title', {
                          count: normalizedDatasetNames.length,
                          documentCount: t('confirm-delete-dialog.cdr-summary.document-count', {
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
                          {t('confirm-delete-dialog.cdr-table.project-id.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium">
                          {t('confirm-delete-dialog.cdr-table.dataset.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium">
                          {t('confirm-delete-dialog.cdr-table.document-id.label')}
                        </Text>
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
                                    mode="bleed"
                                    icon={CopyIcon}
                                    tooltipProps={{
                                      content: t(
                                        'confirm-delete-dialog.cdr-table.copy-id-button.tooltip',
                                      ),
                                    }}
                                  />
                                </CopyToClipboard>
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
      <Box flex="none">
        <Text size={1}>
          <Translate
            i18nKey="confirm-delete-dialog.referential-integrity-disclaimer.text"
            t={t}
            context={action}
            components={{DocumentTitle: () => documentTitle}}
          />
        </Text>
      </Box>
    </Flex>
  )
}
