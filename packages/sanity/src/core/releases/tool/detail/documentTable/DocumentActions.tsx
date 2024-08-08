import {CloseIcon} from '@sanity/icons'
import {Card, Menu, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {SanityDefaultPreview} from 'sanity'

import {Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useClient} from '../../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {type BundleDocumentRow} from '../ReleaseSummary'

export function DocumentActions({
  document,
  bundleTitle,
}: {
  document: BundleDocumentRow
  bundleTitle: string
}) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [discardStatus, setDiscardStatus] = useState<'idle' | 'discarding' | 'error'>('idle')
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()

  const handleDiscardVersion = async () => {
    try {
      setDiscardStatus('discarding')
      await client.delete(document.document._id)
      setDiscardStatus('idle')
    } catch (e) {
      setDiscardStatus('error')
      toast.push({
        closable: true,
        status: 'error',
        title: 'Failed to discard version',
      })
    } finally {
      setShowDiscardDialog(false)
    }
  }
  return (
    <>
      <Card tone="default" display="flex">
        <MenuButton
          id="document-actions"
          button={<ContextMenuButton />}
          menu={
            <Menu>
              <MenuItem
                text="Discard version"
                icon={CloseIcon}
                onClick={() => setShowDiscardDialog(true)}
              />
            </Menu>
          }
        />
      </Card>
      {showDiscardDialog && (
        <Dialog
          id="discard-version-dialog"
          header="Are you sure you want to discard the document version?"
          onClose={() => setShowDiscardDialog(false)}
          footer={{
            confirmButton: {
              text: 'Discard version',
              tone: 'default',
              onClick: handleDiscardVersion,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
            },
          }}
        >
          <Card marginBottom={4} radius={2} border>
            <SanityDefaultPreview
              {...document.previewValues}
              isPlaceholder={document.previewValues.isLoading}
            />
          </Card>
          <Text muted size={1}>
            The <strong>{bundleTitle}</strong> version of this document will be permanently deleted.
          </Text>
        </Dialog>
      )}
    </>
  )
}
