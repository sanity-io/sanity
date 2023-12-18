import {Card, Heading, Flex, Box, Container} from '@sanity/ui'
import styled from 'styled-components'
import {Button} from '../../../../../ui-components'
import {FreeTrialDialog} from './types'
import {DescriptionSerializer} from './DescriptionSerializer'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
`

interface PopoverContentProps {
  content: FreeTrialDialog
  handleClose: () => void
  handleOpenNext: () => void
}

export function PopoverContent({content, handleClose, handleOpenNext}: PopoverContentProps) {
  return (
    <Card radius={3} overflow={'hidden'} width={0}>
      <Container width={0}>
        {content.image && (
          <Image src={content.image.asset.url} alt={content.image.asset.altText ?? ''} />
        )}
        <Flex padding={3} direction={'column'}>
          <Box paddingX={2} marginTop={3}>
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
              text={content.secondaryButton.text}
              tone="default"
              onClick={handleClose}
            />
          )}
          <Button
            mode="default"
            tooltipProps={null}
            text={content.ctaButton?.text}
            autoFocus
            tone="primary"
            {...(content.ctaButton?.action === 'openUrl'
              ? {
                  href: content.ctaButton.url,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  as: 'a',
                }
              : {
                  onClick: content.ctaButton?.action === 'openNext' ? handleOpenNext : handleClose,
                })}
          />
        </Flex>
      </Container>
    </Card>
  )
}
