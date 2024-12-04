import {TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Dialog} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {DeletedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleaseDeleteButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

export const ReleaseDeleteButton = ({release, documents, disabled}: ReleaseDeleteButtonProps) => {
  const toast = useToast()
  const router = useRouter()
  const {deleteRelease} = useReleaseOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'confirm' | 'deleting'>('idle')

  const handleConfirmPublishAll = useCallback(async () => {
    if (!release) return

    try {
      setDeleteStatus('deleting')
      await deleteRelease(release._id)
      telemetry.log(DeletedRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.delete.success"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
      // return to release overview list now that release is deleted
      router.navigate({})
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.delete.error"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      setDeleteStatus('idle')
    }
  }, [release, deleteRelease, telemetry, toast, t, router])

  const confirmDeleteDialog = useMemo(() => {
    if (deleteStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-delete-dialog"
        header={t('delete-dialog.confirm-delete.title')}
        onClose={() => setDeleteStatus('idle')}
        footer={{
          confirmButton: {
            text: t('action.delete-release'),
            tone: 'positive',
            onClick: handleConfirmPublishAll,
            loading: deleteStatus === 'deleting',
            disabled: deleteStatus === 'deleting',
          },
        }}
      >
        <Text muted size={1}>
          {
            <Translate
              t={t}
              i18nKey="delete-dialog.confirm-delete-description"
              values={{
                title: release.metadata.title,
                releaseDocumentsLength: documents.length,
                count: documents.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [deleteStatus, t, handleConfirmPublishAll, release, documents.length])

  return (
    <>
      <Button
        icon={TrashIcon}
        disabled={disabled || deleteStatus === 'deleting'}
        text={t('action.delete-release')}
        onClick={() => setDeleteStatus('confirm')}
        loading={deleteStatus === 'deleting'}
        data-testid="delete-release-button"
        tone="default"
      />
      {confirmDeleteDialog}
    </>
  )
}
