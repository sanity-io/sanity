import {useCallback} from 'react'
import styled from 'styled-components'
import {CloseIcon} from '@sanity/icons'
import {Box, Stack} from '@sanity/ui'
import {useComments} from '../../hooks'
import {Button, Dialog} from '../../../../../ui-components'
import {data} from './UpsellPanel'
import {DescriptionSerializer} from 'sanity'

/**
 * Absolute positioned button to close the dialog.
 */
const StyledButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  background: transparent;
  border-radius: 9999px;
  box-shadow: none;
  color: white;
  --card-fg-color: white;
  :hover {
    --card-fg-color: white;
  }
`

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 200px;
`
// const StyledDialog = styled(Dialog)`
//   > [data-ui='DialogCard'] {
//        max-width: 22.5rem;
//   }
// `

const UpsellDialog = () => {
  // TODO: Replace for real data
  const content = data
  const {upsellDialogOpen, setUpsellDialogOpen} = useComments()
  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
  }, [setUpsellDialogOpen])

  if (!upsellDialogOpen) return null

  return (
    <Dialog
      id="comments-upsell"
      onClose={handleClose}
      onClickOutside={handleClose}
      __unstable_hideCloseButton
      bodyHeight="fill"
      padding={false}
      footer={{
        cancelButton: content.secondaryButton?.text
          ? {
              text: content.secondaryButton.text,
              mode: 'bleed',
              tone: 'default',
              onClick: handleClose,
            }
          : undefined,
        confirmButton: {
          text: content.ctaButton?.text,
          mode: 'default',
          tone: 'primary',
          href: content.ctaButton.url,
          target: '_blank',
          rel: 'noopener noreferrer',
          as: 'a',
        },
      }}
    >
      <StyledButton
        icon={CloseIcon}
        mode="bleed"
        tone="default"
        onClick={handleClose}
        tabIndex={-1}
        tooltipProps={null}
      />
      {content.image && (
        <Image src={content.image.asset.url} alt={content.image.asset.altText ?? ''} />
      )}
      <Box padding={3}>
        <Stack space={4} paddingBottom={2}>
          <DescriptionSerializer blocks={content.descriptionText} />
        </Stack>
      </Box>
    </Dialog>
  )
}

export default UpsellDialog
