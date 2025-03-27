import {white} from '@sanity/color'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {Box, Stack} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {Button, Dialog} from '../../../ui-components'
import {type UpsellData} from './types'
import {type InterpolationProp, UpsellDescriptionSerializer} from './upsellDescriptionSerializer'

/**
 * Absolute positioned button to close the dialog.
 */
const StyledButton = styled(Button)`
  position: absolute;
  top: ${vars.space[3]};
  right: ${vars.space[3]};
  z-index: 20;
  background: transparent;
  border-radius: 9999px;
  box-shadow: none;
  color: ${white.hex};

  ${getVarName(vars.color.fg)}: ${white.hex};

  :hover {
    ${getVarName(vars.color.fg)}: ${white.hex};
  }
`

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
      zOffset={800}
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
        <Stack gap={4} paddingBottom={2}>
          <UpsellDescriptionSerializer
            blocks={data.descriptionText}
            interpolation={interpolation}
          />
        </Stack>
      </Box>
    </Dialog>
  )
}
