import {LaunchIcon} from '@sanity/icons'
import {Stack, Flex, Box} from '@sanity/ui'
import styled from 'styled-components'
import {Button} from '../../../../../ui-components'
import {CommentsUpsellData} from '../../types'

// Rename to `UpsellDescriptionSerializer`?
import {DescriptionSerializer} from 'sanity'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 200px;
`

interface CommentsUpsellContentProps {
  data: CommentsUpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

export function CommentsUpsellContent(props: CommentsUpsellContentProps) {
  const {data, onPrimaryClick, onSecondaryClick} = props

  return (
    <Stack overflow="hidden">
      {data.image && <Image src={data.image.asset.url} alt={data.image.asset.altText ?? ''} />}

      <Box padding={3} marginTop={2}>
        <Stack space={4}>
          <DescriptionSerializer blocks={data.descriptionText} />
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
    </Stack>
  )
}
