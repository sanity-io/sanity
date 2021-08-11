import {LegacyLayerProvider} from '@sanity/base/components'
import {WarningOutlineIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import {Box, Button, Card, Dialog, Flex, Grid, Spinner, Text} from '@sanity/ui'
import React from 'react'
import {
  enhanceWithReferringDocuments,
  WithReferringDocumentsProps,
} from './enhanceWithReferringDocuments'
import {DocTitle} from './DocTitle'
import {ReferringDocumentsList} from './ReferringDocumentsList'

export interface ConfirmUnpublishProps extends WithReferringDocumentsProps {
  onCancel: () => void
  onConfirm: () => void
  published?: SanityDocument | null
  draft?: SanityDocument | null
}

export const ConfirmUnpublish = enhanceWithReferringDocuments(function ConfirmUnpublish(
  props: ConfirmUnpublishProps
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
  const canContinue = !isCheckingReferringDocuments
  const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm unpublish'
  const value = draft || published
  const docTitle = value ? <DocTitle document={value} /> : <em>No document</em>

  const footer = (
    <Grid columns={canContinue ? 2 : 1} gap={2} paddingX={4} paddingY={3}>
      <Button mode="ghost" onClick={onCancel} text="Cancel" />
      {canContinue && (
        <Button
          onClick={onConfirm}
          text={hasReferringDocuments ? 'Try to unpublish anyway' : 'Unpublish now'}
          tone="critical"
        />
      )}
    </Grid>
  )

  return (
    <LegacyLayerProvider zOffset="fullscreen">
      <Dialog
        footer={footer}
        id="confirm-unpublish"
        header={title}
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
                      that refers to “{docTitle}”
                    </Text>
                  </Box>
                </Flex>
              </Card>

              <Box marginY={4}>
                <Text as="p">
                  You may not be able to unpublish “{docTitle}” because the following document
                  {referringDocuments.length !== 1 && <>s</>} refers to it:
                </Text>
              </Box>

              <ReferringDocumentsList documents={referringDocuments} />
            </>
          )}

          {!isCheckingReferringDocuments && !hasReferringDocuments && (
            <>
              <Card padding={3} radius={2} tone="caution">
                <Flex>
                  <Text size={1}>
                    <WarningOutlineIcon />
                  </Text>
                  <Box flex={1} marginLeft={3}>
                    <Text size={1}>
                      If you unpublish this document, it will no longer be available to the public.
                      However, it will not be deleted and can be published again later.
                    </Text>
                  </Box>
                </Flex>
              </Card>

              <Box marginTop={4}>
                <Text as="p">
                  Are you sure you want to unpublish the document <strong>“{docTitle}”</strong>?
                </Text>
              </Box>
            </>
          )}
        </Box>
      </Dialog>
    </LegacyLayerProvider>
  )
})
