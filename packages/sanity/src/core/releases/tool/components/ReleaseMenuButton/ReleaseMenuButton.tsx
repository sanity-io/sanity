import {ArchiveIcon, EllipsisHorizontalIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {type DefinedTelemetryLog} from '@sanity/telemetry'
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

type ReleaseAction = 'archive' | 'delete'

interface ReleaseActionMap {
  actionId: string
  dialogId: string
  dialogHeaderI18nKey: string
  dialogDescriptionSingularI18nKey: string
  dialogDescriptionMultipleI18nKey: string
  dialogConfirmButtonI18nKey: string
  toastSuccessI18nKey: string
  toastFailureI18nKey: string
  telemetry: DefinedTelemetryLog<void>
}

const RELEASE_ACTION_MAP: Record<ReleaseAction, ReleaseActionMap> = {
  delete: {
    actionId: 'confirm-delete',
    dialogId: 'confirm-delete-dialog',
    dialogHeaderI18nKey: 'delete-dialog.confirm-delete.header',
    dialogDescriptionSingularI18nKey: 'delete-dialog.confirm-delete-description_one',
    dialogDescriptionMultipleI18nKey: 'delete-dialog.confirm-delete-description_other',
    dialogConfirmButtonI18nKey: 'delete-dialog.confirm-delete-button',
    toastSuccessI18nKey: 'toast.delete.success',
    toastFailureI18nKey: 'toast.delete.error',
    telemetry: DeletedRelease,
  },
  archive: {
    actionId: 'confirm-archive',
    dialogId: 'confirm-archive-dialog',
    dialogHeaderI18nKey: 'archive-dialog.confirm-archive-header',
    dialogDescriptionSingularI18nKey: 'archive-dialog.confirm-archive-description_one',
    dialogDescriptionMultipleI18nKey: 'archive-dialog.confirm-archive-description_other',
    dialogConfirmButtonI18nKey: 'archive-dialog.confirm-archive-button',
    toastSuccessI18nKey: 'toast.archive.success',
    toastFailureI18nKey: 'toast.archive.error',
    telemetry: ArchivedRelease,
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
  const [selectedAction, setSelectedAction] = useState<ReleaseAction>()

  const releaseMenuDisabled = !release || isLoadingReleaseDocuments || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const handleDelete = useCallback(async () => {
    await deleteRelease(release._id)

    // return to release overview list now that release is deleted
    router.navigate({})
  }, [deleteRelease, release._id, router])

  const handleAction = useCallback(
    async (action: ReleaseAction) => {
      if (releaseMenuDisabled) return

      const actionLookup = {
        delete: handleDelete,
        archive: archive,
      }
      const actionValues = RELEASE_ACTION_MAP[action]

      try {
        setIsPerformingOperation(true)
        await actionLookup[action](release._id)
        telemetry.log(actionValues.telemetry)
        toast.push({
          closable: true,
          status: 'success',
          title: (
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey={actionValues.toastSuccessI18nKey}
                values={{title: release.metadata.title}}
              />
            </Text>
          ),
        })
      } catch (actionError) {
        toast.push({
          status: 'error',
          title: (
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey={actionValues.toastFailureI18nKey}
                values={{title: release.metadata.title, error: actionError.toString()}}
              />
            </Text>
          ),
        })
        console.error(actionError)
      } finally {
        setIsPerformingOperation(false)
        setSelectedAction(undefined)
      }
    },
    [
      archive,
      handleDelete,
      release._id,
      release.metadata.title,
      releaseMenuDisabled,
      t,
      telemetry,
      toast,
    ],
  )

  const handleUnarchive = async () => {
    // noop
    // TODO: similar to handleArchive - complete once server action exists
  }

  const confirmActionDialog = useMemo(() => {
    if (!selectedAction) return null

    const actionValues = RELEASE_ACTION_MAP[selectedAction]

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
            onClick: () => handleAction(selectedAction),
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
    (action: ReleaseAction) => {
      if (releaseDocuments.length > 0) {
        setSelectedAction(action)
      } else {
        handleAction(action)
      }
    },
    [handleAction, releaseDocuments.length],
  )

  const archiveUnarchiveMenuItem = useMemo(() => {
    if (release.state === 'published') return null

    if (release.state === 'archived')
      return (
        <MenuItem
          onClick={handleUnarchive}
          // TODO: disabled as CL action not yet impl
          disabled
          icon={UnarchiveIcon}
          text={t('action.unarchive')}
          data-testid="unarchive-release-menu-item"
        />
      )

    return (
      <MenuItem
        tooltipProps={{
          disabled: ['scheduled', 'scheduling'].includes(release.state) || isPerformingOperation,
          content: t('action.archive.tooltip'),
        }}
        onClick={() => handleOnInitiateAction('archive')}
        icon={ArchiveIcon}
        text={t('action.archive')}
        data-testid="archive-release-menu-item"
        disabled={['scheduled', 'scheduling'].includes(release.state)}
      />
    )
  }, [handleOnInitiateAction, isPerformingOperation, release.state, t])

  const deleteMenuItem = useMemo(() => {
    if (release.state !== 'archived' && release.state !== 'published') return null

    return (
      <MenuItem
        onClick={() => handleOnInitiateAction('delete')}
        disabled={releaseMenuDisabled || isPerformingOperation}
        icon={TrashIcon}
        text={t('action.delete-release')}
        data-testid="delete-release-menu-item"
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
