import {PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex, Stack} from '@sanity/ui'
import {LaunchIcon} from '@sanity/icons'
import styled from 'styled-components'
import {Button} from '../../../../../ui-components'
import {DescriptionSerializer} from './UpsellDescriptionSerializer'

interface UpsellData {
  _createdAt: string
  _id: string
  _rev: string
  _type: string
  _updatedAt: string
  id: string
  image: {
    asset: {
      url: string
      altText: string | null
    }
  }
  descriptionText: PortableTextBlock[]
  ctaButton: {
    text: string
    url: string
  }
  secondaryButton: {
    rightIcon: string
    text: string
  }
}

export const data: UpsellData = {
  id: 'comments-upsell',
  _rev: '7bb6138e-57a1-4683-a100-7fd6459d40d6',
  secondaryButton: {rightIcon: '', text: 'Learn more'},
  _id: 'drafts.57e155f3-37b6-43ea-87b2-78f203b96066',
  image: {
    asset: {
      url: 'https://cdn.sanity.io/images/pyrmmpch/staging/ed72407f479b5f8ec1c886e66fff0f5907e6d9d3-1520x720.png',
      altText: null,
    },
  },
  _createdAt: '2024-01-24T09:22:00Z',
  _type: 'commentsUpsell',
  descriptionText: [
    {
      _type: 'iconAndText',
      icon: {
        url: 'https://cdn.sanity.io/images/pyrmmpch/staging/3c5c9bc6ace28b83737afcd495b842e67b35a862-21x21.svg',
      },
      _key: 'd8622cb61d93',
      title: 'Upgrade to unlock',
      accent: true,
    },
    {
      style: 'h2',
      _key: '1217717029eb',
      markDefs: [],
      children: [
        {
          _type: 'span',
          marks: [],
          text: 'Close your communication gap with comments',
          _key: 'fe5088ef51c20',
        },
      ],
      _type: 'block',
    },
    {
      _key: '89a267951d3a',
      markDefs: [],
      children: [
        {
          _type: 'span',
          marks: [],
          text: 'Some short description of this feature and the benefits our users get from it. Preferably just a couple lines',
          _key: '80df77ef94890',
        },
      ],
      _type: 'block',
      style: 'normal',
    },
  ],
  _updatedAt: '2024-01-24T09:33:07Z',
  ctaButton: {
    text: 'Upgrade plan',
    url: 'https://www.sanity.io/manage',
  },
}

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
`

const UpsellPanel = () => {
  const content = data
  // Fetch the data in  commentsProvider?

  return (
    <Box paddingX={3} marginBottom={6}>
      <Card radius={3} marginRight={3} overflow={'hidden'} border>
        {content.image && (
          <Image src={content.image.asset.url} alt={content.image.asset.altText ?? ''} />
        )}
        <Box padding={3} marginTop={2}>
          <Stack space={4}>
            <DescriptionSerializer blocks={content.descriptionText} />
          </Stack>
          <Flex gap={2} justify={'flex-end'} marginTop={5}>
            <Button
              mode="bleed"
              text={content.secondaryButton.text}
              tone="primary"
              iconRight={LaunchIcon}
            />
            <Button
              text={content.ctaButton.text}
              tone="primary"
              href={content.ctaButton.url}
              target="_blank"
              rel="noopener noreferrer"
              as="a"
            />
          </Flex>
        </Box>
      </Card>
    </Box>
  )
}

export default UpsellPanel
