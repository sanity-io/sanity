import {LegacyLayerProvider} from '@sanity/base/components'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Grid, Spinner, Text} from '@sanity/ui'
import {SanityDocument} from '@sanity/types'
import React from 'react'
import {
  enhanceWithReferringDocuments,
  WithReferringDocumentsProps,
} from './enhanceWithReferringDocuments'
import {DocTitle} from './DocTitle'
import {ReferringDocumentsList} from './ReferringDocumentsList'

export interface ConfirmDeleteProps extends WithReferringDocumentsProps {
  onCancel: () => void
  onConfirm: () => void
  published?: SanityDocument | null
  draft?: SanityDocument | null
}

export const ConfirmDelete = enhanceWithReferringDocuments(function ConfirmDelete(
  props: ConfirmDeleteProps
) {
  const {
    isCheckingReferringDocuments,
    referringDocuments,
    draft,
    published,
    onCancel,
    onConfirm,
  } = props
  const hasReferringDocuments = referringDocuments.length > 0
  const showConfirmButton = !isCheckingReferringDocuments
  const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm delete'
  const value = draft || published
  const docTitle = value ? <DocTitle document={value} /> : <em>No document</em>

  const footer = (
    <Grid columns={showConfirmButton ? 2 : 1} gap={2} paddingX={4} paddingY={3}>
      <Button mode="ghost" onClick={onCancel} text="Cancel" />

      {showConfirmButton && (
        <Button
          onClick={onConfirm}
          text={hasReferringDocuments ? 'Delete anyway' : 'Delete now'}
          tone="critical"
        />
      )}
    </Grid>
  )

  return (
    <LegacyLayerProvider zOffset="fullscreen">
      <Dialog
        footer={footer}
        header={title}
        id="confirm-delete-dialog"
        onClickOutside={onCancel}
        onClose={onCancel}
        width={1}
      >
        <Box padding={4}>
          {isCheckingReferringDocuments && (
            <Flex align="center" direction="column">
              <Spinner muted />
              <Box marginTop={3}>
                <Text align="center" muted size={1}>
                  Looking for referring documents…
                </Text>
              </Box>
            </Flex>
          )}

          {hasReferringDocuments && (
            <>
              <Card padding={3} radius={2} tone="caution">
                <Flex>
                  <Text size={1}>
                    <WarningOutlineIcon />
                  </Text>
                  <Box flex={1} marginLeft={3}>
                    <Text size={1}>
                      Warning: Found{' '}
                      {referringDocuments.length === 1 ? (
                        <>a document</>
                      ) : (
                        <>{referringDocuments.length} documents</>
                      )}{' '}
                      that refer{referringDocuments.length === 1 ? <>s</> : ''} to “{docTitle}”.
                    </Text>
                  </Box>
                </Flex>
              </Card>

              <Box marginY={4}>
                <Text as="p" muted>
                  You may not be able to delete “{docTitle}” because{' '}
                  {referringDocuments.length === 1 ? <>this document</> : <>these documents</>}{' '}
                  refer
                  {referringDocuments.length === 1 ? <>s</> : ''} to it:
                </Text>
              </Box>

              <ReferringDocumentsList documents={referringDocuments} />
            </>
          )}

          {!isCheckingReferringDocuments && !hasReferringDocuments && (
            <Text as="p">
              Are you sure you want to delete <strong>“{docTitle}”</strong>?
            </Text>
          )}
        </Box>
      </Dialog>
    </LegacyLayerProvider>
  )
})
