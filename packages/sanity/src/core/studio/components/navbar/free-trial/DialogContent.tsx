import {CloseIcon} from '@sanity/icons'
import {Box, Flex, Heading} from '@sanity/ui'
import {styled} from 'styled-components'

import {Button, Dialog} from '../../../../../ui-components'
import {useColorSchemeValue} from '../../../colorScheme'
import {UpsellDescriptionSerializer} from '../../../upsell'
import {type TrialDialogDismissedInfo} from './__telemetry__/trialDialogEvents.telemetry'
import {type FreeTrialDialog} from './types'

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
  height: 196px;
`

const StyledDialog = styled(Dialog)`
  > [data-ui='DialogCard'] {
    max-width: 22.5rem;
  }
`
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
    <StyledDialog
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
      <Flex padding={3} direction={'column'}>
        <Box paddingX={2} marginTop={3}>
          <Heading size={2}>{content.headingText}</Heading>
        </Box>
        <Box marginTop={4} paddingBottom={3}>
          <UpsellDescriptionSerializer blocks={content.descriptionText} />
        </Box>
      </Flex>
    </StyledDialog>
  )
}
