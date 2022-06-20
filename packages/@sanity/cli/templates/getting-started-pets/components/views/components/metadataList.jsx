import React from 'react'
import {Card, Flex, Stack, Text, Grid, Box, Label, Tooltip} from '@sanity/ui'
import {urlFor} from '../../../helpers/image-url-builder'
import styled from 'styled-components'

export function MetadataList({items = []}) {
  return (
    <Box>
      <Grid columns={2} gap={5}>
        {items.map((item, index) => (
          <Box key={index}>
            <Stack space={3}>
              {item.title && (
                <Label as="h3" muted>
                  {item.title}
                </Label>
              )}
              {item.value && (
                <Text as="p" weight="bold">
                  {item.value}
                </Text>
              )}
              {item?.image && (
                <ImageWrapper>
                  <ImageAndCaption image={item.image} caption={item?.imageCaption} />
                </ImageWrapper>
              )}
              {item?.images?.length && (
                <Flex gap={2}>
                  {item.images.map(({image, imageCaption}, index) => (
                    <ImageWrapper key={index}>
                      <ImageAndCaption image={image} caption={imageCaption} />
                    </ImageWrapper>
                  ))}
                </Flex>
              )}
            </Stack>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

function ImageAndCaption({image, caption}) {
  const size = 50
  if (!caption) {
    return (
      <Card>
        <Image
          loading="lazy"
          $width={size}
          src={urlFor(image)
            .width(size * 2)
            .height(size * 2)}
          alt=""
        />
      </Card>
    )
  }

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text muted size={1}>
            {caption}
          </Text>
        </Box>
      }
      portal
      placement="bottom"
      fallbackPlacements={['right', 'left']}
    >
      <Card>
        <Image
          $width={size}
          loading="lazy"
          src={urlFor(image)
            .width(size * 2)
            .height(size * 2)}
          alt=""
        />
      </Card>
    </Tooltip>
  )
}

const ImageWrapper = styled(Box)`
  max-width: 50px;
  border-radius: 50%;
  overflow: hidden;
`

const Image = styled.img`
  aspect-ratio: 1;
  display: block;
  width: 100%;
`
