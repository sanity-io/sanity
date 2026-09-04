import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Stack, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {Box} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {type UpsellData} from './types'
import {
  type InterpolationProp,
  UpsellDescriptionSerializer,
} from './upsellDescriptionSerializer/UpsellDescriptionSerializer'
import {closeButton, image, space3Var} from './UpsellDialog.css'

interface UpsellDialogProps {
  data?: UpsellData | null
  open?: boolean
  onClose: () => void
  onPrimaryClick: () => void
  onSecondaryClick: () => void
  interpolation?: InterpolationProp
}

export function UpsellDialog(props: UpsellDialogProps) {
  const {data, open = true, onClose, onPrimaryClick, onSecondaryClick, interpolation} = props
  const {space} = useThemeV2()

  if (!data || !open) {
    return null
  }

  return (
    <Dialog
      id="upsell-dialog"
      onClose={onClose}
      onClickOutside={onClose}
      __unstable_hideCloseButton
      bodyHeight="100%"
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
          tone: 'default',
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
      <Button
        className={closeButton}
        style={assignInlineVars({[space3Var]: `${space[3]}px`})}
        icon={CloseIcon}
        mode="bleed"
        tone="default"
        onClick={onClose}
        tabIndex={-1}
        tooltipProps={null}
      />
      {data.image && (
        <img className={image} src={data.image.asset.url} alt={data.image.asset.altText ?? ''} />
      )}
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
