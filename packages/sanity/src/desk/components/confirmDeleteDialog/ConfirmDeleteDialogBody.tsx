import React, {useCallback} from 'react'
import {
  WarningOutlineIcon,
  DocumentsIcon,
  ClipboardIcon,
  UnknownIcon,
  ChevronDownIcon,
} from '@sanity/icons'
import {useToast, Text, Box, Button, Flex, Label, Card, Stack} from '@sanity/ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import {ReferencePreviewLink} from './ReferencePreviewLink'
import {ReferringDocuments} from './useReferringDocuments'
import {
  OtherReferenceCount,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  TableContainer,
  Table,
  ChevronWrapper,
  DocumentIdFlex,
} from './ConfirmDeleteDialogBody.styles'
import {SanityDefaultPreview, useSchema} from 'sanity'

type DeletionConfirmationDialogBodyProps = Required<ReferringDocuments> & {
  documentTitle: React.ReactNode
  action: string
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
            title="Preview Unavailable"
            subtitle={`ID: ${item._id}`}
            layout="default"
          />
        </Box>
      )
    },
    [schema, onReferenceLinkClick]
  )

  if (internalReferences?.totalCount === 0 && crossDatasetReferences?.totalCount === 0) {
    return (
      <Text as="p">
        Are you sure you want to {action} <strong>“{documentTitle}”</strong>?
      </Text>
    )
  }

  const documentCount =
    crossDatasetReferences.totalCount === 1
      ? '1 document'
      : `${crossDatasetReferences.totalCount.toLocaleString()} documents`

  // We do some extra checks to handle cases where you have unavailable dataset
  // name(s) due to permissions, both alone and in combination with known datasets

  // This normalizes one or more undefined dataset names to the catch-all `unavailable`
  const normalizedDatasetNames = [
    ...datasetNames,
    ...(hasUnknownDatasetNames ? ['unavailable'] : []),
  ]
  const datasetsCount =
    normalizedDatasetNames.length === 1
      ? 'another dataset'
      : `${normalizedDatasetNames.length} datasets`

  let datasetNameList = `Dataset${
    normalizedDatasetNames.length === 1 ? '' : 's'
  }: ${normalizedDatasetNames.join(', ')}`

  // We only have one dataset, and it is unavailable due to permissions
  if (hasUnknownDatasetNames && normalizedDatasetNames.length === 1) {
    datasetNameList = 'Unavailable dataset'
  }

  return (
    <Card>
      <Card padding={3} radius={2} tone="caution" marginBottom={4} flex="none">
        <Flex>
          <Text aria-hidden="true" size={1}>
            <WarningOutlineIcon />
          </Text>
          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              {totalCount === 1 ? (
                <>1 document refers to “{documentTitle}”</>
              ) : (
                <>
                  {totalCount.toLocaleString()} documents refer to “{documentTitle}”
                </>
              )}
            </Text>
          </Box>
        </Flex>
      </Card>

      <Box flex="none" marginBottom={4}>
        <Text>
          You may not be able to {action} “{documentTitle}” because the following documents refer to
          it:
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
                          {documentCount} in {datasetsCount}
                        </Text>
                      </Box>
                      <Box>
                        <Text title={datasetNameList} textOverflow="ellipsis" size={1} muted>
                          {datasetNameList}
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

              <TableContainer>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Label muted size={0}>
                          Project ID
                        </Label>
                      </th>
                      <th>
                        <Label muted size={0}>
                          Dataset
                        </Label>
                      </th>
                      <th>
                        <Label muted size={0}>
                          Document ID
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
                                    // TODO: this isn't visible with the dialog open
                                    toast.push({
                                      title: 'Copied document ID to clipboard!',
                                      status: 'success',
                                    })
                                  }}
                                >
                                  <Button
                                    title="Copy ID to clipboard"
                                    mode="bleed"
                                    icon={ClipboardIcon}
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
              </TableContainer>
            </CrossDatasetReferencesDetails>
          )}
        </Flex>
      </Card>

      <Box flex="none">
        <Text>
          If you {action} this document, documents that refer to it will no longer be able to access
          it.
        </Text>
      </Box>
    </Card>
  )
}
