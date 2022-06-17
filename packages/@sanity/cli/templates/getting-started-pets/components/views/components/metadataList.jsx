import React from "react";
import { Card, Stack, Text, Grid, Box, Label } from "@sanity/ui";
import { urlFor } from "../../../helpers/image-url-builder";
import styled from "styled-components";

export function MetadataList({ items = [] }) {
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
                <ImageAndCaption image={item.image} caption={item?.imageCaption} />
              )}
            </Stack>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}

function ImageAndCaption({ image, caption }) {
  if (!caption) {
    return (
      <Card radius={6} overflow="hidden">
        <Image width="200" src={urlFor(image).width(200).height(200)} alt="" />
      </Card>
    );
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
      placement="left"
      fallbackPlacements="left"
    >
      <Card radius={6} overflow="hidden">
        <Image
          width="200"
          src={urlFor(image).width(200).height(200)}
          alt=""
        />
      </Card>
    </Tooltip>
  );
}

const Image = styled.img`
  aspect-ratio: 1;
  display: block;
  width: 100%;
`;