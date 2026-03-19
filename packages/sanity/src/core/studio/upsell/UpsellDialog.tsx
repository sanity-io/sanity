import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {Box, Stack, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {Button, Dialog} from '../../../ui-components'
import {type UpsellData} from './types'
import {type InterpolationProp, UpsellDescriptionSerializer} from './upsellDescriptionSerializer'
import {styledButton, image as imageClass, topVar, rightVar} from './UpsellDialog.css'

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
        className={styledButton}
        style={assignInlineVars({[topVar]: `${space[3]}px`, [rightVar]: `${space[3]}px`})}
        icon={CloseIcon}
        mode="bleed"
        tone="default"
        onClick={onClose}
        tabIndex={-1}
        tooltipProps={null}
      />
      {data.image && (
        <img
          className={imageClass}
          src={data.image.asset.url}
          alt={data.image.asset.altText ?? ''}
        />
      )}
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
