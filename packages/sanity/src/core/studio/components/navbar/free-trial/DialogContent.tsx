import {Box, Button, Card, Dialog, Flex, Heading} from '@sanity/ui'
import styled from 'styled-components'
import {CloseIcon} from '@sanity/icons'
import {useColorSchemeValue} from '../../../colorScheme'
import {FreeTrialDialog} from './types'
import {DescriptionSerializer} from './DescriptionSerializer'

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
  handleClose: () => void
}

export function DialogContent({handleClose, content}: ModalContentProps) {
  const schemeValue = useColorSchemeValue()

  return (
    <StyledDialog
      id="free-trial-modal"
      onClose={handleClose}
      onClickOutside={handleClose}
      __unstable_hideCloseButton
      scheme={schemeValue}
      cardRadius={3}
      footer={
        <Flex width="full" gap={3} justify="flex-end" padding={3}>
          {content.secondaryButton?.text && (
            <Button
              mode="bleed"
              padding={2}
              fontSize={1}
              text={content.secondaryButton?.text}
              tone="default"
              onClick={handleClose}
            />
          )}
          <Button
            mode="default"
            padding={2}
            fontSize={1}
            text={content.ctaButton?.text}
            href={content.ctaButton?.url}
            autoFocus
            tone="primary"
            as="a"
            target="_blank"
            rel="noopener noreferrer"
          />
        </Flex>
      }
    >
      <StyledButton
        icon={CloseIcon}
        fontSize={1}
        padding={2}
        mode="bleed"
        tone="default"
        onClick={handleClose}
        tabIndex={-1}
      />
      {content.image && (
        <Image src={content.image.asset.url} alt={content.image.asset.altText ?? ''} />
      )}
      <Flex padding={3} direction={'column'}>
        <Box paddingX={2} marginTop={3}>
          <Heading size={2}>{content.headingText}</Heading>
        </Box>
        <Box marginTop={4} paddingBottom={3}>
          <DescriptionSerializer blocks={content.descriptionText} />
        </Box>
      </Flex>
    </StyledDialog>
  )
}
