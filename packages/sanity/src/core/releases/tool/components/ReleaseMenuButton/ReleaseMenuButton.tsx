import {
  ArchiveIcon,
  EditIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  UnarchiveIcon,
} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {
  ArchivedRelease,
  DeletedRelease,
  UnarchivedRelease,
} from '../../../../bundles/__telemetry__/releases.telemetry'
import {ReleaseDetailsDialog} from '../../../../bundles/components/dialog/ReleaseDetailsDialog'
import {Translate, useTranslation} from '../../../../i18n'
import {type BundleDocument} from '../../../../store/bundles/types'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {releasesLocaleNamespace} from '../../../i18n'

export type ReleaseMenuButtonProps = {
  disabled?: boolean
  bundle?: BundleDocument
  documentCount?: number
}

export const ReleaseMenuButton = ({disabled, bundle, documentCount}: ReleaseMenuButtonProps) => {
  const {deleteBundle, updateBundle} = useBundleOperations()
  const router = useRouter()
  const isBundleArchived = !!bundle?.archivedAt
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit' | 'delete'>()
  const [discardStatus, setDiscardStatus] = useState<'idle' | 'discarding' | 'error'>('idle')

  const bundleMenuDisabled = !bundle || disabled
  const toast = useToast()
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const resetSelectedAction = () => setSelectedAction(undefined)

  const handleOnDeleteBundle = async () => {
    if (bundleMenuDisabled) return
    try {
      setDiscardStatus('discarding')
      await deleteBundle(bundle)
      telemetry.log(DeletedRelease)
      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate t={t} i18nKey={'action.delete.success'} values={{title: bundle.title}} />
        ),
      })
      setDiscardStatus('idle')
      if (router.state.releaseId) {
        // navigate back to bundle overview
        router.navigate({releaseId: undefined})
      }
    } catch (e) {
      setDiscardStatus('error')
      toast.push({
        closable: true,
        status: 'error',
        title: t('action.delete.failure'),
        description: e.message,
      })
    } finally {
      resetSelectedAction()
    }
  }

  const handleOnToggleArchive = async () => {
    if (bundleMenuDisabled) return

    setIsPerformingOperation(true)
    await updateBundle({
      ...bundle,
      archivedAt: isBundleArchived ? undefined : new Date().toISOString(),
    })

    if (isBundleArchived) {
      // it's in the process of becoming false, so the event we want to track is unarchive
      telemetry.log(UnarchivedRelease)
    } else {
      // it's in the process of becoming true, so the event we want to track is archive
      telemetry.log(ArchivedRelease)
    }
    setIsPerformingOperation(false)
  }

  const bundleHasDocuments = !!documentCount

  return (
    <>
      <MenuButton
        button={
          <Button
            disabled={bundleMenuDisabled || isPerformingOperation}
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
            <MenuItem
              onClick={() => setSelectedAction('edit')}
              icon={EditIcon}
              text={t('action.edit')}
              data-testid="edit-release"
            />
            <MenuItem
              onClick={handleOnToggleArchive}
              icon={isBundleArchived ? UnarchiveIcon : ArchiveIcon}
              text={isBundleArchived ? t('action.unarchive') : t('action.archive')}
              data-testid="archive-release"
            />
            <MenuItem
              onClick={() => setSelectedAction('delete')}
              icon={TrashIcon}
              text={t('action.delete')}
              data-testid="delete-release"
            />
          </Menu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: [],
          placement: 'bottom',
          portal: true,
        }}
      />
      {selectedAction === 'delete' && (
        <Dialog
          id="discard-version-dialog"
          header={t('delete-dialog.header', {title: bundle?.title})}
          onClose={resetSelectedAction}
          // remove body padding if no documents in release
          padding={bundleHasDocuments}
          data-testid="delete-dialog"
          footer={{
            confirmButton: {
              text: t('action.delete'),
              tone: 'default',
              onClick: handleOnDeleteBundle,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
            },
          }}
        >
          {bundleHasDocuments && (
            <Text data-testid="confirm-delete-body" muted size={1}>
              {t('delete.warning', {count: documentCount})}
            </Text>
          )}
        </Dialog>
      )}
      {selectedAction === 'edit' && (
        <ReleaseDetailsDialog
          onCancel={resetSelectedAction}
          onSubmit={resetSelectedAction}
          bundle={bundle}
        />
      )}
    </>
  )
}
