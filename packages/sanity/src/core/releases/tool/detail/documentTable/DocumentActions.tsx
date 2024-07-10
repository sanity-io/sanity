import {CloseIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Menu, Text, useToast} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useState} from 'react'
import {SanityDefaultPreview} from 'sanity'
import {css, styled} from 'styled-components'

import {Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useClient} from '../../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'

const DialogText = styled(Text)((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    strong {
      font-weight: ${theme.font.text.weights.medium};
    }
  `
})

export function DocumentActions({
  document,
  previewValues,
  isPreviewLoading,
  versionTitle,
}: {
  document: SanityDocument
  isPreviewLoading: boolean
  versionTitle: string
  previewValues:
    | PreviewValue
    | {
        title: JSX.Element
        subtitle: JSX.Element
        media: () => JSX.Element
      }
}) {
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
          bodyHeight="fill"
          padding={false}
          id="discard-version-dialog"
          header="Are you sure you want to discard the document version?"
          onClose={() => setShowDiscardDialog(false)}
          footer={{
            confirmButton: {
              tone: 'default',
              onClick: handleDiscardVersion,
              loading: discardStatus === 'discarding',
              disabled: discardStatus === 'discarding',
              text: 'Discard version',
            },
          }}
        >
          <Flex gap={4} paddingX={4} direction={'column'} paddingY={2}>
            <Card radius={2} border>
              <SanityDefaultPreview {...previewValues} isPlaceholder={isPreviewLoading} />
            </Card>
            <Box>
              <DialogText muted size={1}>
                The <strong>{versionTitle}</strong> version of this document will be permanently
                deleted.
              </DialogText>
            </Box>
          </Flex>
        </Dialog>
      )}
    </>
  )
}
