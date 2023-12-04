import {Card, Text, Heading, Flex, Button} from '@sanity/ui'
import styled from 'styled-components'
import {useColorSchemeValue} from '../../../colorScheme'
import {FreeTrialDialog} from './types'

interface PopoverContentProps {
  content: FreeTrialDialog
  handleClose: () => void
}

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 120px;
`

export function PopoverContent({content, handleClose}: PopoverContentProps) {
  const schemeValue = useColorSchemeValue()

  return (
    <Card scheme={schemeValue} style={{maxWidth: '220px', overflow: 'hidden'}} radius={2}>
      <Image src={content.image.asset.url} alt={content.image.asset.altText} />
      <Flex paddingX={3} paddingY={4} direction={'column'} gap={4}>
        <Heading size={1}>{content.headingText}</Heading>
        <Text size={1}>{content.descriptionText}</Text>
        {content.links ? (
          <Flex marginTop={1} gap={3} direction="column" align="flex-start">
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
      <Flex width="full" gap={3} justify="flex-end" padding={3}>
        {content.ctaButton?.text && (
          // If we have a ctaButton, we want to show a close button, else the close button will be the primary action.
          <Button
            mode="bleed"
            padding={2}
            fontSize={1}
            text={`Close`}
            tone="default"
            onClick={handleClose}
          />
        )}
        <Button
          mode="default"
          padding={2}
          fontSize={1}
          text={content.ctaButton?.text ?? 'Close'}
          href={content.ctaButton?.url}
          as={content.ctaButton?.url ? 'a' : undefined}
          autoFocus
          tone="primary"
          target="_blank"
          rel="noopener noreferrer"
        />
      </Flex>
    </Card>
  )
}
