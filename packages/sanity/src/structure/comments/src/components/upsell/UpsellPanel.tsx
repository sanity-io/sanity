import {Box, Card, Container, Flex, Stack} from '@sanity/ui'
import {LaunchIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback} from 'react'
import styled from 'styled-components'
import {Button} from '../../../../../ui-components'
import {useCommentsUpsell} from '../../hooks'
import {
  CommentsUpsellPanelPrimaryBtnClicked,
  CommentsUpsellPanelSecondaryBtnClicked,
} from '../../../__telemetry__/comments.telemetry'
import {DescriptionSerializer} from 'sanity'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
`

export function UpsellPanel() {
  const {upsellData} = useCommentsUpsell()
  const telemetry = useTelemetry()

  const handlePrimaryClick = useCallback(() => {
    telemetry.log(CommentsUpsellPanelPrimaryBtnClicked)
  }, [telemetry])

  const handleSecondaryClicked = useCallback(() => {
    telemetry.log(CommentsUpsellPanelSecondaryBtnClicked)
  }, [telemetry])

  if (!upsellData) return null
  return (
    <Container width={1}>
      <Box marginBottom={6}>
        <Card radius={3} overflow={'hidden'} border>
          {upsellData.image && (
            <Image src={upsellData.image.asset.url} alt={upsellData.image.asset.altText ?? ''} />
          )}
          <Box padding={3} marginTop={2}>
            <Stack space={4}>
              <DescriptionSerializer blocks={upsellData.descriptionText} />
            </Stack>
            <Flex gap={2} justify={'flex-end'} marginTop={5}>
              <Button
                mode="bleed"
                text={upsellData.secondaryButton.text}
                tone="primary"
                iconRight={LaunchIcon}
                {...(upsellData.secondaryButton.url && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  as: 'a',
                  href: upsellData.secondaryButton.url,
                })}
                onClick={handleSecondaryClicked}
              />
              <Button
                text={upsellData.ctaButton.text}
                tone="primary"
                {...(upsellData.ctaButton.url && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  as: 'a',
                  href: upsellData.ctaButton.url,
                })}
                onClick={handlePrimaryClick}
              />
            </Flex>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}
