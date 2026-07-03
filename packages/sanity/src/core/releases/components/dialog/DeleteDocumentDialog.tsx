import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {catchError, filter, firstValueFrom, map, of, timeout} from 'rxjs'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useDocumentOperation} from '../../../hooks/useDocumentOperation'
import {useReferringDocuments} from '../../../hooks/useReferringDocuments'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {useValuePreview} from '../../../preview'
import {Preview} from '../../../preview/components/Preview'
import {useDocumentStore} from '../../../store/datastores'
import {getPublishedId, getVersionFromId} from '../../../util/draftUtils'
import {useDocumentVersions} from '../../hooks/useDocumentVersions'
import {useDocumentVersionTypeSortedList} from '../../hooks/useDocumentVersionTypeSortedList'
import {releasesLocaleNamespace} from '../../i18n'
import {isReleaseScheduledOrScheduling} from '../../util/util'

// The delete outcome is reported through the operation events stream, which
// may never emit for this operation if it is superseded. Bound the wait so the
// dialog cannot hang forever.
const DELETE_OUTCOME_TIMEOUT = 30000

/**
 * Confirmation dialog for permanently deleting a document (its published and
 * draft variants along with every release version) from the release detail
 * view.
 *
 * @internal
 */
export function DeleteDocumentDialog(props: {
  onClose: () => void
  documentVersionId: string
  documentType: string
}): React.JSX.Element {
  const {onClose, documentVersionId, documentType} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: coreT} = useTranslation()

  const schema = useSchema()
  const toast = useToast()
  const documentStore = useDocumentStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const publishedId = getPublishedId(documentVersionId)
  const releaseId = getVersionFromId(documentVersionId)

  const {delete: deleteOp} = useDocumentOperation(publishedId, documentType, releaseId)
  const {data: documentVersions, loading: versionsLoading} = useDocumentVersions({
    documentId: publishedId,
  })
  const {referringDocuments, isLoading: referringDocumentsLoading} =
    useReferringDocuments(publishedId)

  // Deleting a document is blocked while any of its versions belong to a
  // scheduled release, matching the delete document action in the form view.
  const {sortedDocumentList} = useDocumentVersionTypeSortedList({documentId: publishedId})
  const hasScheduledRelease = sortedDocumentList.some(isReleaseScheduledOrScheduling)

  const otherReleasesCount = useMemo(
    () =>
      documentVersions.filter((id) => {
        const version = getVersionFromId(id)
        return version !== undefined && version !== releaseId
      }).length,
    [documentVersions, releaseId],
  )

  const schemaType = schema.get(documentType)
  const preview = useValuePreview({schemaType, value: {_id: documentVersionId}})

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)

    // Subscribe to the outcome before executing so it cannot be missed.
    const outcomePromise = firstValueFrom(
      documentStore.pair.operationEvents(publishedId, documentType).pipe(
        filter((event) => event.op === 'delete'),
        map((event) => (event.type === 'error' ? event.error : null)),
        timeout({first: DELETE_OUTCOME_TIMEOUT}),
        catchError(() => of(null)),
      ),
    )

    deleteOp.execute(documentVersions)
    const error = await outcomePromise

    if (error) {
      toast.push({
        closable: true,
        status: 'error',
        title: coreT('release.action.delete-document.failure'),
        description: error.message,
      })
    } else {
      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={coreT}
            i18nKey={'release.action.delete-document.success'}
            values={{title: preview?.value?.title || publishedId}}
          />
        ),
      })
    }

    setIsDeleting(false)
    onClose()
  }, [
    coreT,
    deleteOp,
    documentStore.pair,
    documentType,
    documentVersions,
    onClose,
    preview?.value?.title,
    publishedId,
    toast,
  ])

  const isConfirmDisabled =
    isDeleting || versionsLoading || Boolean(deleteOp.disabled) || hasScheduledRelease

  return (
    <Dialog
      header={t('delete-document-dialog.header')}
      id="document-delete-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          text: t('delete-document-dialog.action.cancel'),
          onClick: onClose,
        },
        confirmButton: {
          text: t('delete-document-dialog.action.delete'),
          onClick: handleDelete,
          tone: 'critical',
          disabled: isConfirmDisabled,
          loading: isDeleting,
        },
      }}
    >
      <Stack space={4} paddingX={4} paddingBottom={4}>
        {schemaType ? (
          <Preview value={{_id: documentVersionId}} schemaType={schemaType} />
        ) : (
          <LoadingBlock />
        )}
        <Text muted size={1}>
          {t('delete-document-dialog.description')}
        </Text>
        {hasScheduledRelease && (
          <WarningCard>{t('delete-document-dialog.warning.scheduled-release')}</WarningCard>
        )}
        {!hasScheduledRelease && otherReleasesCount > 0 && (
          <WarningCard>
            {t('delete-document-dialog.warning.other-releases', {count: otherReleasesCount})}
          </WarningCard>
        )}
        {!referringDocumentsLoading && referringDocuments.length > 0 && (
          <WarningCard>
            {t('delete-document-dialog.warning.referring-documents', {
              count: referringDocuments.length,
            })}
          </WarningCard>
        )}
      </Stack>
    </Dialog>
  )
}

function WarningCard({children}: {children: React.ReactNode}) {
  return (
    <Card padding={3} radius={2} tone="caution">
      <Flex gap={3}>
        <Text aria-hidden="true" size={1}>
          <WarningOutlineIcon />
        </Text>
        <Box flex={1}>
          <Text size={1}>{children}</Text>
        </Box>
      </Flex>
    </Card>
  )
}
