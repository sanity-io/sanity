import {ArchiveIcon, EllipsisHorizontalIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem, Spinner, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {Dialog} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'

type Props = {
  bundle?: BundleDocument
  documentCount: number
}

export const BundleMenuButton = ({bundle, documentCount}: Props) => {
  const {deleteBundle, updateBundle} = useBundleOperations()
  const router = useRouter()
  const isBundleArchived = !!bundle?.archivedAt
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [discardStatus, setDiscardStatus] = useState<'idle' | 'discarding' | 'error'>('idle')

  const bundleMenuDisabled = !bundle
  const toast = useToast()

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
      setShowDiscardDialog(false)
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
            aria-label="Release menu"
          />
        }
        id="bundle-menu"
        menu={
          <Menu>
            <MenuItem
              onClick={handleOnToggleArchive}
              icon={isBundleArchived ? UnarchiveIcon : ArchiveIcon}
              text={isBundleArchived ? 'Unarchive' : 'Archive'}
            />
            <MenuItem onClick={() => setShowDiscardDialog(true)} icon={TrashIcon} text="Delete" />
          </Menu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: [],
          placement: 'bottom',
          portal: true,
        }}
      />
      {showDiscardDialog && (
        <Dialog
          id="discard-version-dialog"
          header={`Are you sure you want to delete the '${bundle?.title}' release?`}
          onClose={() => setShowDiscardDialog(false)}
          // remove body padding if no documents in release
          padding={bundleHasDocuments}
          footer={{
            confirmButton: {
              tone: 'default',
              onClick: handleOnDeleteBundle,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
            },
          }}
        >
          {bundleHasDocuments && (
            <Text data-testid="confirm-delete-body" muted size={1}>
              This will also delete {documentCount} document version{documentCount > 1 ? 's' : ''}.
            </Text>
          )}
        </Dialog>
      )}
    </>
  )
}
