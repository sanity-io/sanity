import styled from 'styled-components'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {white} from '@sanity/color'
import {Box, Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {Button, Dialog} from '../../../../../ui-components'
import {CommentsUpsellData} from '../../types'
import {UpsellDescriptionSerializer} from 'sanity'

/**
 * Absolute positioned button to close the dialog.
 */
const StyledButton = styled(Button)(({theme}) => {
  const {space} = getTheme_v2(theme)
  return `
      position: absolute;
      top: ${space[3]}px;
      right: ${space[3]}px;
      z-index: 20;
      background: transparent;
      border-radius: 9999px;
      box-shadow: none;
      color: ${white.hex};
      --card-fg-color: ${white.hex};
      :hover {
        --card-fg-color: ${white.hex};
      }
    `
})

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
          <UpsellDescriptionSerializer blocks={data.descriptionText} />
        </Stack>
      </Box>
    </Dialog>
  )
}
