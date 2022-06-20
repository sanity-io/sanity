import React from 'react'
import {Card, Flex, Text, Grid, Box, Label} from '@sanity/ui'
import {urlFor} from '../../../helpers/image-url-builder'
import styled from 'styled-components'

const Image = styled.img`
  aspect-ratio: 1;
  display: block;
  width: 100%;
`

export function GridList({heading, items = []}) {
  return (
    <Box>
      {heading && (
        <Box marginBottom={3}>
          <Label as="h2">{heading}</Label>
        </Box>
      )}
      <Grid columns={2} gap={5}>
        {items.map((item) => (
          <Box key={item._id}>
            {item?.image && (
              <Card radius={6} marginBottom={2} overflow="hidden">
                <Image width="200" src={urlFor(item.image).width(200).height(200)} alt="" />
              </Card>
            )}
            {item.title && (
              <Text as="p" weight="bold">
                {item.title}
              </Text>
            )}
          </Box>
        ))}
      </Grid>
    </Box>
  )
}
