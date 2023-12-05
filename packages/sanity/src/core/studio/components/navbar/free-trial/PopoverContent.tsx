import {Card, Text, Heading, Flex, Button, Box, Container} from '@sanity/ui'
import styled from 'styled-components'
import {useColorSchemeValue} from '../../../colorScheme'
import {FreeTrialDialog} from './types'
import {DescriptionSerializer} from './Description'

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
    <Card scheme={schemeValue} radius={3}>
      <Container width={0}>
        {content.image && (
          <Image src={content.image.asset.url} alt={content.image.asset.altText ?? ''} />
        )}
        <Flex padding={3} direction={'column'}>
          <Box paddingX={2} marginTop={3}>
            {/* // TODO: Replace the XX for the actual number of days left. */}
            <Heading size={1}>{content.headingText}</Heading>
          </Box>
          <Box marginTop={4}>
            <DescriptionSerializer blocks={content.descriptionText} />
          </Box>
        </Flex>
        <Flex width="full" gap={3} justify="flex-end" padding={3}>
          {content.secondaryButton?.text && (
            <Button
              mode="bleed"
              padding={2}
              fontSize={1}
              text={content.secondaryButton.text}
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
            onClick={content.ctaButton?.url ? undefined : handleClose}
            autoFocus
            tone="primary"
            target="_blank"
            rel="noopener noreferrer"
          />
        </Flex>
      </Container>
    </Card>
  )
}
