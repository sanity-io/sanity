import {CloseIcon} from '@sanity/icons'
import {Card, Menu, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {SanityDefaultPreview, Translate, useTranslation} from 'sanity'

import {Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useClient} from '../../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {releasesLocaleNamespace} from '../../../i18n'
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
  const {t} = useTranslation(releasesLocaleNamespace)

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
      <Card tone="default" display="flex">
        <MenuButton
          id="document-actions"
          button={<ContextMenuButton />}
          menu={
            <Menu>
              <MenuItem
                text={t('release.action.discard-version')}
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
          header={t('release.discard-version-dialog.header')}
          onClose={() => setShowDiscardDialog(false)}
          footer={{
            confirmButton: {
              text: t('release.discard-version-dialog.title'),
              tone: 'default',
              onClick: handleDiscardVersion,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
            },
          }}
        >
          <Card marginBottom={4} radius={2} border>
            <SanityDefaultPreview {...document.previewValues} isPlaceholder={document.isLoading} />
          </Card>
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey={'release.discard-version-dialog.description'}
              values={{title: bundleTitle}}
            />
          </Text>
        </Dialog>
      )}
    </>
  )
}
