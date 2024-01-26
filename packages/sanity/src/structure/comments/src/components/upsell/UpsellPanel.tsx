import {Box, Card, Container, Flex, Stack} from '@sanity/ui'
import {LaunchIcon} from '@sanity/icons'
import styled from 'styled-components'
import {Button} from '../../../../../ui-components'
import {useComments} from '../../hooks'
import {DescriptionSerializer} from 'sanity'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
`

const UpsellPanel = () => {
  const {upsellData} = useComments()

  if (!upsellData) return null
  return (
    <Container width={1}>
      <Box paddingX={3} marginBottom={6}>
        <Card radius={3} marginRight={3} overflow={'hidden'} border>
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
              />
              <Button
                text={upsellData.ctaButton.text}
                tone="primary"
                href={upsellData.ctaButton.url}
                target="_blank"
                rel="noopener noreferrer"
                as="a"
              />
            </Flex>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}

export default UpsellPanel
