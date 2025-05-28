import {white} from '@sanity/color'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {Box, Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

import {Button, Dialog} from '../../../ui-components'
import {type UpsellData} from './types'
import {type InterpolationProp, UpsellDescriptionSerializer} from './upsellDescriptionSerializer'

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

interface UpsellDialogProps {
  data: UpsellData
  onClose: () => void
  onPrimaryClick: () => void
  onSecondaryClick: () => void
  interpolation?: InterpolationProp
}

export function UpsellDialog(props: UpsellDialogProps) {
  const {data, onClose, onPrimaryClick, onSecondaryClick, interpolation} = props

  return (
    <Dialog
      id="upsell-dialog"
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
          <UpsellDescriptionSerializer
            blocks={data.descriptionText}
            interpolation={interpolation}
          />
        </Stack>
      </Box>
    </Dialog>
  )
}
