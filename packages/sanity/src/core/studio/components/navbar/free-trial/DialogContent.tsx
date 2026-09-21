import {CloseIcon} from '@sanity/icons/Close'
import {Heading} from '@sanity/ui'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {useColorSchemeValue} from '../../../colorScheme'
import {UpsellDescriptionSerializer} from '../../../upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'
import {type TrialDialogDismissedInfo} from './__telemetry__/trialDialogEvents.telemetry'
import {closeButton, dialog, image} from './DialogContent.css'
import {type FreeTrialDialog} from './types'

interface ModalContentProps {
  content: FreeTrialDialog
  onClose: (action?: TrialDialogDismissedInfo['dialogDismissAction']) => void
  onOpenNext: () => void
  onOpenUrlCallback: () => void
  open: boolean
}

export function DialogContent({
  onClose,
  onOpenNext,
  onOpenUrlCallback,
  content,
  open,
}: ModalContentProps) {
  function handleClose() {
    onClose('xClick')
  }
  function handleClickOutside() {
    onClose('outsideClick')
  }
  function handleCTAClose() {
    onClose('ctaClicked')
  }
  const schemeValue = useColorSchemeValue()
  if (!open) return null
  return (
    <Dialog
      className={dialog}
      id="free-trial-modal"
      onClose={onClose}
      onClickOutside={handleClickOutside}
      padding={false}
      __unstable_hideCloseButton
      scheme={schemeValue}
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
          ...(content.ctaButton?.action === 'openUrl'
            ? {
                href: content.ctaButton.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                as: 'a',
                onClick: onOpenUrlCallback,
              }
            : {
                onClick: content.ctaButton?.action === 'openNext' ? onOpenNext : handleCTAClose,
              }),
        },
      }}
    >
      <Button
        className={closeButton}
        icon={CloseIcon}
        mode="bleed"
        tone="default"
        onClick={handleClose}
        tabIndex={-1}
        tooltipProps={null}
      />
      {content.image && (
        <img
          className={image}
          src={content.image.asset.url}
          alt={content.image.asset.altText ?? ''}
        />
      )}
      <Flex padding={3} flexDirection={'column'}>
        <Box paddingX={2} marginTop={3}>
          <Heading size={2}>{content.headingText}</Heading>
        </Box>
        <Box marginTop={4} paddingBottom={3}>
          <UpsellDescriptionSerializer blocks={content.descriptionText} />
        </Box>
      </Flex>
    </Dialog>
  )
}
