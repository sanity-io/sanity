import {CloseIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Menu, Text, useToast} from '@sanity/ui'
import {useState} from 'react'

import {Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useClient} from '../../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'

export function DocumentActions({document}: {document: SanityDocument}) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [discardStatus, setDiscardStatus] = useState<'idle' | 'discarding' | 'error'>('idle')
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()

  const handleDiscardVersion = async () => {
    try {
      setDiscardStatus('discarding')
      await client.delete(document._id)
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
      {showDiscardDialog && (
        <Dialog
          id="discard-version-dialog"
          header="Are you sure you want to delete this version of the document?"
          onClose={() => setShowDiscardDialog(false)}
          footer={{
            confirmButton: {
              tone: 'default',
              onClick: handleDiscardVersion,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
            },
          }}
        >
          <Text>This action can't be undone</Text>
        </Dialog>
      )}
    </>
  )
}
