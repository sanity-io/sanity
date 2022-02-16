import React from 'react'
import {WarningOutlineIcon, DocumentsIcon, ClipboardIcon} from '@sanity/icons'
import {useToast, Text, Box, Button, Card, Flex, Label} from '@sanity/ui'
import {SanityPreview} from '@sanity/base/preview'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import {SchemaType} from '@sanity/types'
import {ReferringDocuments} from './useReferringDocuments'
import {
  ReferencesCard,
  InternalReferences,
  OtherReferenceCount,
  CrossDatasetReferences,
  CrossDatasetReferencesSummary,
  Chevron,
  TableContainer,
  Table,
} from './ConfirmDeleteDialogBody.styles'

type DeletionConfirmationDialogBodyProps = Required<ReferringDocuments> & {
  documentTitle: React.ReactNode
  action: string
}

function getSchemaType(typeName: string): SchemaType {
  const schemaMod = require('part:@sanity/base/schema')
  const schema = schemaMod.default || schemaMod
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`No such schema type: ${typeName}`)
  }
  return type
}

/**
 * The inner part of the `ConfirmDeleteDialog`. This is ran when both the
 * `crossDatasetReferences` and `internalReferences` are loaded.
 */
export function ConfirmDeleteDialogBody({
  crossDatasetReferences,
  internalReferences,
  documentTitle,
  total,
  action,
}: DeletionConfirmationDialogBodyProps) {
  const toast = useToast()

  if (internalReferences?.totalCount === 0 && crossDatasetReferences?.totalCount === 0) {
    return (
      <Text as="p">
        Are you sure you want to delete <strong>“{documentTitle}”</strong>?
      </Text>
    )
  }

  return (
    <>
      <Card padding={3} radius={2} tone="caution">
        <Flex>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              {total === 1 ? (
                <>1 document refers to “{documentTitle}”</>
              ) : (
                <>
                  {total.toLocaleString()} documents refer to “{documentTitle}”
                </>
              )}
            </Text>
          </Box>
        </Flex>
      </Card>

      <Text>
        You may not be able to delete “{documentTitle}” because the following documents refer to it:
      </Text>

      <ReferencesCard radius={2} shadow={1}>
        {internalReferences.totalCount > 0 && (
          <InternalReferences>
            {internalReferences.references.map((internalReference) => (
              <Box as="li" key={internalReference._id} paddingX={3} paddingY={3}>
                <SanityPreview
                  type={getSchemaType(internalReference._type)}
                  value={internalReference}
                  layout="default"
                />
              </Box>
            ))}
            {internalReferences.totalCount > internalReferences.references.length && (
              <Box as="li" padding={3}>
                <OtherReferenceCount {...internalReferences} />
              </Box>
            )}
          </InternalReferences>
        )}

        {crossDatasetReferences.totalCount > 0 && (
          <CrossDatasetReferences
            style={{
              // only add the border if needed
              borderTop:
                internalReferences.totalCount > 0
                  ? '1px solid var(--card-shadow-outline-color)'
                  : undefined,
            }}
          >
            <CrossDatasetReferencesSummary>
              <Text size={3}>
                <DocumentsIcon />
              </Text>
              <Text>
                {crossDatasetReferences.totalCount === 1 ? (
                  <>1 document in another project</>
                ) : (
                  <>{crossDatasetReferences.totalCount} documents in other projects</>
                )}
              </Text>
              <Chevron />
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
                  {crossDatasetReferences.references.map(
                    ({projectId, datasetName, id: documentId}, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={`${documentId}-${index}`}>
                        <td>
                          <Text size={1}>{projectId}</Text>
                        </td>
                        <td>
                          <Text size={1}>{datasetName}</Text>
                        </td>
                        <td>
                          <Flex align="center" gap={2} justify="flex-end">
                            <Text textOverflow="ellipsis" size={1}>
                              {documentId}
                            </Text>
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
                          </Flex>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </Table>
              <Box padding={2}>
                <OtherReferenceCount {...crossDatasetReferences} />
              </Box>
            </TableContainer>
          </CrossDatasetReferences>
        )}
      </ReferencesCard>

      <Text>
        If you {action} this document, documents that refer to it will no longer be able to access
        it.
      </Text>
    </>
  )
}
