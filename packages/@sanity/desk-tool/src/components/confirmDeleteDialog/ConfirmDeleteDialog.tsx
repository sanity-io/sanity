import React, {useMemo} from 'react'
import {Box, Dialog, Button, Text, Spinner, Grid} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {DocTitle} from '../DocTitle'
import {useReferringDocuments} from './useReferringDocuments'
import {DialogBody as DialogBodyWrapper, LoadingContainer} from './ConfirmDeleteDialog.styles'
import {ConfirmDeleteDialogBody} from './ConfirmDeleteDialogBody'

interface ReferencingDocumentsProps {
  /**
   * Incoming document ID used to find other referencing documents. This
   * field respects draft IDs (e.g. if you pass in a published ID when one
   * doesn't, exist the document title may not show up).
   */
  id: string
  /**
   * The schema typename of the incoming document
   */
  type: string
  /**
   * The name of the action being done. (e.g. the `'unpublish'` action requires
   * the same document deletion confirmation).
   */
  action?: string
  onCancel: () => void
  onConfirm: () => void
}

/**
 * A confirmation dialog used to prevent unwanted document deletes. Loads all
 * the referencing internal and cross-data references prior to showing the
 * delete button.
 */
export function ConfirmDeleteDialog({
  id,
  type,
  action = 'delete',
  onCancel,
  onConfirm,
}: ReferencingDocumentsProps) {
  const dialogId = `deletion-confirmation-${useId()}`
  const {internalReferences, crossDatasetReferences, isLoading, total} = useReferringDocuments(id)
  const capitalizedAction = `${action.substring(0, 1).toUpperCase()}${action.substring(1)}`

  const documentTitle = <DocTitle document={useMemo(() => ({_id: id, _type: type}), [id, type])} />
  const showConfirmButton = !isLoading

  return (
    <Dialog
      width={1}
      id={dialogId}
      header={`${capitalizedAction} document?`}
      footer={
        <Grid columns={showConfirmButton ? 2 : 1} gap={2} paddingX={4} paddingY={3}>
          <Button mode="ghost" onClick={onCancel} text="Cancel" />

          {showConfirmButton && (
            <Button
              text={total > 0 ? `${capitalizedAction} anyway` : `${capitalizedAction} now`}
              tone="critical"
              onClick={onConfirm}
            />
          )}
        </Grid>
      }
      onClose={onCancel}
    >
      <DialogBodyWrapper>
        {crossDatasetReferences && internalReferences && !isLoading ? (
          <ConfirmDeleteDialogBody
            crossDatasetReferences={crossDatasetReferences}
            internalReferences={internalReferences}
            documentTitle={documentTitle}
            isLoading={isLoading}
            total={total}
            action={action}
          />
        ) : (
          <LoadingContainer>
            <Spinner muted />
            <Box marginTop={3}>
              <Text align="center" muted size={1}>
                Looking for referring documents…
              </Text>
            </Box>
          </LoadingContainer>
        )}
      </DialogBodyWrapper>
    </Dialog>
  )
}
