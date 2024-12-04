import {ArchiveIcon, EllipsisHorizontalIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {useRouter} from '../../../../../router/useRouter'
import {Button, Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {ArchivedRelease, DeletedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../../detail/useBundleDocuments'

export type ReleaseMenuButtonProps = {
  disabled?: boolean
  release: ReleaseDocument
}

const ARCHIVABLE_STATES = ['active', 'published']

const RELEASE_ACTION_MAP = {
  delete: {
    actionId: 'confirm-delete',
    dialogId: 'confirm-delete-dialog',
    dialogHeaderI18nKey: 'delete-dialog.confirm-delete.header',
    dialogDescriptionSingularI18nKey: 'delete-dialog.confirm-delete-description_one',
    dialogDescriptionMultipleI18nKey: 'delete-dialog.confirm-delete-description_other',
    dialogConfirmButtonI18nKey: 'delete-dialog.confirm-delete-button',
  },
  archive: {
    actionId: 'confirm-archive',
    dialogId: 'confirm-archive-dialog',
    dialogHeaderI18nKey: 'archive-dialog.confirm-archive-header',
    dialogDescriptionSingularI18nKey: 'archive-dialog.confirm-archive-description_one',
    dialogDescriptionMultipleI18nKey: 'archive-dialog.confirm-archive-description_other',
    dialogConfirmButtonI18nKey: 'archive-dialog.confirm-archive-button',
  },
}

export const ReleaseMenuButton = ({disabled, release}: ReleaseMenuButtonProps) => {
  const toast = useToast()
  const router = useRouter()
  const {archive, deleteRelease} = useReleaseOperations()
  const {loading: isLoadingReleaseDocuments, results: releaseDocuments} = useBundleDocuments(
    getReleaseIdFromReleaseDocumentId(release._id),
  )
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'confirm-delete' | 'confirm-archive'>()

  const releaseMenuDisabled = !release || isLoadingReleaseDocuments || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const handleArchive = useCallback(async () => {
    if (releaseMenuDisabled) return

    try {
      setIsPerformingOperation(true)
      await archive(release._id)

      // it's in the process of becoming true, so the event we want to track is archive
      telemetry.log(ArchivedRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.archive.success"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
    } catch (archivingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.archive.error"
              values={{title: release.metadata.title, error: archivingError.toString()}}
            />
          </Text>
        ),
      })
      console.error(archivingError)
    } finally {
      setIsPerformingOperation(false)
      setSelectedAction(undefined)
    }
  }, [archive, release._id, release.metadata.title, releaseMenuDisabled, t, telemetry, toast])

  const handleDelete = useCallback(async () => {
    if (!release) return

    try {
      setIsPerformingOperation(true)
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
      setIsPerformingOperation(false)
      setSelectedAction(undefined)
    }
  }, [release, deleteRelease, telemetry, toast, t, router])

  const handleUnarchive = async () => {
    // noop
    // TODO: similar to handleArchive - complete once server action exists
  }

  const handleAction = useCallback(
    (action: 'archive' | 'delete') => {
      if (action === 'delete') return handleDelete()
      else if (action === 'archive') return handleArchive()

      return null
    },
    [handleArchive, handleDelete],
  )

  const confirmActionDialog = useMemo(() => {
    if (selectedAction !== 'confirm-delete' && selectedAction !== 'confirm-archive') return null
    const actionValues =
      RELEASE_ACTION_MAP[selectedAction === 'confirm-archive' ? 'archive' : 'delete']

    const dialogDescription =
      releaseDocuments.length === 1
        ? actionValues.dialogDescriptionSingularI18nKey
        : actionValues.dialogDescriptionMultipleI18nKey

    return (
      <Dialog
        id={actionValues.dialogId}
        data-testid={actionValues.dialogId}
        header={t(actionValues.dialogHeaderI18nKey, {title: release.metadata.title})}
        onClose={() => setSelectedAction(undefined)}
        footer={{
          confirmButton: {
            text: t(actionValues.dialogConfirmButtonI18nKey),
            tone: 'positive',
            onClick: () =>
              handleAction(selectedAction === 'confirm-archive' ? 'archive' : 'delete'),
            loading: isPerformingOperation,
            disabled: isPerformingOperation,
          },
        }}
      >
        <Text muted size={1}>
          {
            <Translate
              t={t}
              i18nKey={dialogDescription}
              values={{
                count: releaseDocuments.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [
    handleAction,
    isPerformingOperation,
    release.metadata.title,
    releaseDocuments.length,
    selectedAction,
    t,
  ])

  const handleOnInitiateAction = useCallback(
    (action: 'archive' | 'delete') => {
      if (releaseDocuments.length > 0) {
        setSelectedAction(action === 'archive' ? 'confirm-archive' : 'confirm-delete')
      } else {
        handleAction(action)
      }
    },
    [handleAction, releaseDocuments.length],
  )

  const archiveUnarchiveMenuItem = useMemo(() => {
    if (!release?.state || release.state === 'archived')
      return (
        <MenuItem
          onClick={handleUnarchive}
          // TODO: disabled as CL action not yet impl
          disabled
          icon={UnarchiveIcon}
          text={t('action.unarchive')}
          data-testid="unarchive-release"
        />
      )

    return (
      <MenuItem
        tooltipProps={{
          disabled: ARCHIVABLE_STATES.includes(release.state) || isPerformingOperation,
          content: t('action.archive.tooltip'),
        }}
        onClick={() => handleOnInitiateAction('archive')}
        icon={ArchiveIcon}
        text={t('action.archive')}
        data-testid="archive-release"
        disabled={!ARCHIVABLE_STATES.includes(release.state)}
      />
    )
  }, [handleOnInitiateAction, isPerformingOperation, release.state, t])

  const deleteMenuItem = useMemo(() => {
    if (release.state !== 'archived') return null

    return (
      <MenuItem
        onClick={() => handleOnInitiateAction('delete')}
        disabled={releaseMenuDisabled || isPerformingOperation}
        icon={TrashIcon}
        text={t('action.delete-release')}
        data-testid="delete-release-button"
        tone="default"
      />
    )
  }, [handleOnInitiateAction, isPerformingOperation, release.state, releaseMenuDisabled, t])

  return (
    <>
      <MenuButton
        button={
          <Button
            disabled={releaseMenuDisabled || isPerformingOperation}
            icon={isPerformingOperation ? Spinner : EllipsisHorizontalIcon}
            mode="bleed"
            tooltipProps={{content: t('menu.tooltip')}}
            aria-label={t('menu.label')}
            data-testid="release-menu-button"
          />
        }
        id="release-menu"
        menu={
          <Menu>
            {archiveUnarchiveMenuItem}
            {deleteMenuItem}
          </Menu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: ['top-end'],
          placement: 'bottom',
          portal: true,
          tone: 'default',
        }}
      />
      {confirmActionDialog}
    </>
  )
}
