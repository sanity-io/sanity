import {Box, Flex} from '@sanity/ui'
import {useCallback, useId, useMemo} from 'react'
import {getPublishedId, LoadingBlock, useDocumentVersions, useTranslation} from 'sanity'

import {Dialog} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import {DocTitle} from '../DocTitle'
import {ConfirmDeleteDialogBody} from './ConfirmDeleteDialogBody'
import {dialogBody, loadingContainer} from './ConfirmDeleteDialog.css'
import {useReferringDocuments} from './useReferringDocuments'

/** @internal */
export interface ConfirmDeleteDialogProps {
  /**
   * Incoming document ID used to find other referencing documents. This
   * field respects draft IDs (e.g. if you pass in a published ID when one
   * doesn't exist the document title may not show up).
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
  action?: 'delete' | 'unpublish'
  onCancel: () => void
  onConfirm: (versions: string[]) => void
}

/**
 * A confirmation dialog used to prevent unwanted document deletes. Loads all
 * the referencing internal and cross-data references prior to showing the
 * delete button.
 *
 * @internal
 */
export function ConfirmDeleteDialog({
  id,
  type,
  action = 'delete',
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const {t} = useTranslation(structureLocaleNamespace)
  const dialogId = `deletion-confirmation-${useId()}`
  const {
    internalReferences,
    crossDatasetReferences,
    isLoading,
    totalCount,
    projectIds,
    datasetNames,
    hasUnknownDatasetNames,
  } = useReferringDocuments(id)
  const documentTitle = <DocTitle document={useMemo(() => ({_id: id, _type: type}), [id, type])} />
  const showConfirmButton = !isLoading
  const {data: documentVersions, loading: versionsLoading} = useDocumentVersions({
    documentId: getPublishedId(id),
  })

  const handleConfirm = useCallback(() => {
    onConfirm(documentVersions)
  }, [onConfirm, documentVersions])

  return (
    <Dialog
      width={1}
      id={dialogId}
      header={t('confirm-delete-dialog.header.text', {context: action})}
      footer={{
        cancelButton: {
          onClick: onCancel,
          text: t('confirm-delete-dialog.cancel-button.text'),
        },
        confirmButton: showConfirmButton
          ? {
              text:
                totalCount > 0
                  ? t('confirm-delete-dialog.confirm-anyway-button.text', {context: action})
                  : t('confirm-delete-dialog.confirm-button.text', {context: action}),
              onClick: handleConfirm,
            }
          : undefined,
      }}
      onClose={onCancel}
      onClickOutside={onCancel}
    >
      <Box className={dialogBody}>
        {crossDatasetReferences && internalReferences && !isLoading && !versionsLoading ? (
          <ConfirmDeleteDialogBody
            crossDatasetReferences={crossDatasetReferences}
            internalReferences={internalReferences}
            documentTitle={documentTitle}
            isLoading={isLoading}
            totalCount={totalCount}
            action={action}
            projectIds={projectIds}
            datasetNames={datasetNames}
            hasUnknownDatasetNames={hasUnknownDatasetNames}
            onReferenceLinkClick={onCancel}
            documentId={id}
            documentType={type}
            documentVersions={documentVersions}
          />
        ) : (
          <Flex
            align="center"
            direction="column"
            justify="center"
            className={loadingContainer}
            data-testid="loading-container"
          >
            <LoadingBlock showText title={t('confirm-delete-dialog.loading.text')} />
          </Flex>
        )}
      </Box>
    </Dialog>
  )
}
