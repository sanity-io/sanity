import {LaunchIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack} from '@sanity/ui'
import {UpsellDescriptionSerializer} from 'sanity'
import styled from 'styled-components'

import {Button} from '../../../../../ui-components'
import {type CommentsUpsellData} from '../../types'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
`

interface CommentsUpsellPanelProps {
  data: CommentsUpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

export function CommentsUpsellPanel(props: CommentsUpsellPanelProps) {
  const {data, onPrimaryClick, onSecondaryClick} = props
  return (
    <Container width={1}>
      <Box marginBottom={6}>
        <Card radius={3} overflow={'hidden'} border>
          {data.image && <Image src={data.image.asset.url} alt={data.image.asset.altText ?? ''} />}
          <Box padding={3} marginTop={2}>
            <Stack space={4}>
              <UpsellDescriptionSerializer blocks={data.descriptionText} />
            </Stack>
            <Flex gap={2} justify={'flex-end'} marginTop={5}>
              <Button
                mode="bleed"
                text={data.secondaryButton.text}
                tone="primary"
                iconRight={LaunchIcon}
                {...(data.secondaryButton.url && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  as: 'a',
                  href: data.secondaryButton.url,
                })}
                onClick={onSecondaryClick}
              />
              <Button
                text={data.ctaButton.text}
                tone="primary"
                {...(data.ctaButton.url && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  as: 'a',
                  href: data.ctaButton.url,
                })}
                onClick={onPrimaryClick}
              />
            </Flex>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}
