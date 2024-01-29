import {useCallback} from 'react'
import styled from 'styled-components'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {Box, Stack} from '@sanity/ui'
import {useTelemetry} from '@sanity/telemetry/react'
import {Button, Dialog} from '../../../../../ui-components'
import {useCommentsUpsell} from '../../hooks'
import {
  CommentsUpsellDialogPrimaryBtnClicked,
  CommentsUpsellDialogSecondaryBtnClicked,
} from '../../../__telemetry__/comments.telemetry'
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

export function UpsellDialog() {
  const {upsellDialogOpen, setUpsellDialogOpen, upsellData} = useCommentsUpsell()
  const telemetry = useTelemetry()

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
  }, [setUpsellDialogOpen])

  const handlePrimaryClick = useCallback(() => {
    telemetry.log(CommentsUpsellDialogPrimaryBtnClicked)
  }, [telemetry])

  const handleSecondaryClicked = useCallback(() => {
    telemetry.log(CommentsUpsellDialogSecondaryBtnClicked)
  }, [telemetry])

  if (!upsellDialogOpen) return null
  if (!upsellData) return null

  return (
    <Dialog
      id="comments-upsell"
      onClose={handleClose}
      onClickOutside={handleClose}
      __unstable_hideCloseButton
      bodyHeight="fill"
      padding={false}
      footer={{
        cancelButton: upsellData.secondaryButton?.text
          ? {
              text: upsellData.secondaryButton.text,
              mode: 'bleed',
              tone: 'default',
              iconRight: LaunchIcon,
              ...(upsellData.secondaryButton.url && {
                target: '_blank',
                rel: 'noopener noreferrer',
                as: 'a',
                href: upsellData.secondaryButton.url,
              }),
              onClick: handleSecondaryClicked,
            }
          : undefined,
        confirmButton: {
          text: upsellData.ctaButton?.text,
          mode: 'default',
          tone: 'primary',
          ...(upsellData.ctaButton.url && {
            target: '_blank',
            rel: 'noopener noreferrer',
            as: 'a',
            href: upsellData.ctaButton.url,
          }),
          onClick: handlePrimaryClick,
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
      {upsellData.image && (
        <Image src={upsellData.image.asset.url} alt={upsellData.image.asset.altText ?? ''} />
      )}
      <Box padding={3}>
        <Stack space={4} paddingBottom={2}>
          <DescriptionSerializer blocks={upsellData.descriptionText} />
        </Stack>
      </Box>
    </Dialog>
  )
}
