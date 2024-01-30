import styled from 'styled-components'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {Box, Stack} from '@sanity/ui'
import {Button, Dialog} from '../../../../../ui-components'
import {CommentsUpsellData} from '../../types'
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

interface CommentsUpsellDialogProps {
  data: CommentsUpsellData
  onClose: () => void
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

export function CommentsUpsellDialog(props: CommentsUpsellDialogProps) {
  const {data, onClose, onPrimaryClick, onSecondaryClick} = props

  return (
    <Dialog
      id="comments-upsell"
      onClose={onClose}
      onClickOutside={onClose}
      __unstable_hideCloseButton
      bodyHeight="fill"
      padding={false}
      footer={{
        cancelButton: data.secondaryButton?.text
          ? {
              text: data.secondaryButton.text,
              mode: 'bleed',
              tone: 'default',
              iconRight: LaunchIcon,
              ...(data.secondaryButton.url && {
                target: '_blank',
                rel: 'noopener noreferrer',
                as: 'a',
                href: data.secondaryButton.url,
              }),
              onClick: onSecondaryClick,
            }
          : undefined,
        confirmButton: {
          text: data.ctaButton?.text,
          mode: 'default',
          tone: 'primary',
          ...(data.ctaButton.url && {
            target: '_blank',
            rel: 'noopener noreferrer',
            as: 'a',
            href: data.ctaButton.url,
          }),
          onClick: onPrimaryClick,
        },
      }}
    >
      <StyledButton
        icon={CloseIcon}
        mode="bleed"
        tone="default"
        onClick={onClose}
        tabIndex={-1}
        tooltipProps={null}
      />
      {data.image && <Image src={data.image.asset.url} alt={data.image.asset.altText ?? ''} />}
      <Box padding={3} marginTop={2}>
        <Stack space={4} paddingBottom={2}>
          <DescriptionSerializer blocks={data.descriptionText} />
        </Stack>
      </Box>
    </Dialog>
  )
}
