import {
  ArchiveIcon,
  EditIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  UnarchiveIcon,
} from '@sanity/icons'
import {Button, Menu, MenuButton, Spinner, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {Dialog, MenuItem} from '../../../../ui-components'
import {BundleDetailsDialog} from '../../../bundles/components/dialog/BundleDetailsDialog'
import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {releasesLocaleNamespace} from '../../i18n'

type Props = {
  bundle?: BundleDocument
  documentCount: number
}

export const BundleMenuButton = ({bundle, documentCount}: Props) => {
  const {deleteBundle, updateBundle} = useBundleOperations()
  const router = useRouter()
  const isBundleArchived = !!bundle?.archivedAt
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit' | 'delete'>()
  const [discardStatus, setDiscardStatus] = useState<'idle' | 'discarding' | 'error'>('idle')

  const bundleMenuDisabled = !bundle
  const toast = useToast()
  const {t} = useTranslation(releasesLocaleNamespace)

  const resetSelectedAction = () => setSelectedAction(undefined)

  const handleOnDeleteBundle = async () => {
    if (bundleMenuDisabled) return
    try {
      setDiscardStatus('discarding')
      await deleteBundle(bundle)
      setDiscardStatus('idle')
      if (router.state.bundleSlug) {
        // navigate back to bundle overview
        router.navigate({bundleSlug: undefined})
      }
    } catch (e) {
      setDiscardStatus('error')
      toast.push({
        closable: true,
        status: 'error',
        title: 'Failed to delete bundle',
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
            padding={2}
            aria-label={t('release.menu.label')}
          />
        }
        id="bundle-menu"
        menu={
          <Menu>
            <MenuItem
              onClick={() => setSelectedAction('edit')}
              icon={EditIcon}
              text={t('release.action.edit')}
            />
            <MenuItem
              onClick={handleOnToggleArchive}
              icon={isBundleArchived ? UnarchiveIcon : ArchiveIcon}
              text={isBundleArchived ? t('release.action.unarchive') : t('release.action.archive')}
            />
            <MenuItem
              onClick={() => setSelectedAction('delete')}
              icon={TrashIcon}
              text={t('release.action.delete')}
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
          header={`Are you sure you want to delete the '${bundle?.title}' release?`}
          onClose={resetSelectedAction}
          // remove body padding if no documents in release
          padding={bundleHasDocuments}
          footer={{
            confirmButton: {
              text: 'Delete',
              tone: 'default',
              onClick: handleOnDeleteBundle,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
            },
          }}
        >
          {bundleHasDocuments && (
            <Text data-testid="confirm-delete-body" muted size={1}>
              {t('release.delete.warning', {documentCount, count: documentCount})}
            </Text>
          )}
        </Dialog>
      )}
      {selectedAction === 'edit' && (
        <BundleDetailsDialog
          onCancel={resetSelectedAction}
          onSubmit={resetSelectedAction}
          bundle={bundle}
        />
      )}
    </>
  )
}
