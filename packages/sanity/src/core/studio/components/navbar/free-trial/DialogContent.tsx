import {Button, Card, Dialog, Flex, Heading, Text} from '@sanity/ui'
import styled from 'styled-components'
import {CloseIcon} from '@sanity/icons'
import {useColorSchemeValue} from '../../../colorScheme'
import {FreeTrialDialog} from './types'

interface ModalContentProps {
  content: FreeTrialDialog
  handleClose: () => void
}

const StyledButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  background: transparent;
  border-radius: 9999px;
  box-shadow: none;
  color: white;
  --card-fg-color: black;
`

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 240px;
`

export function DialogContent({handleClose, content}: ModalContentProps) {
  const schemeValue = useColorSchemeValue()

  return (
    <Card scheme={schemeValue}>
      <Dialog
        id="free-trial-modal"
        onClose={handleClose}
        onClickOutside={handleClose}
        __unstable_hideCloseButton
        cardRadius={2}
        footer={
          <Flex width="full" gap={3} justify="flex-end" padding={3}>
            <Button
              mode="bleed"
              padding={2}
              fontSize={1}
              text={`Close`}
              tone="default"
              onClick={handleClose}
            />
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
          aria-label={`close dialog`}
          onClick={handleClose}
          tabIndex={-1}
        />
        <Image src={content.image.asset.url} alt={content.image.asset.altText} />
        <Flex paddingX={3} paddingY={5} direction={'column'} gap={4}>
          <Heading size={1}>{content.headingText}</Heading>
          <Text size={1}>{content.descriptionText}</Text>
          {content.links ? (
            <Flex marginTop={3} gap={3} direction="column" align="flex-start">
              {content.links.map((link) => (
                <Text
                  size={1}
                  weight="medium"
                  key={link._key}
                  as="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                </Text>
              ))}
            </Flex>
          ) : null}
        </Flex>
      </Dialog>
    </Card>
  )
}
