import React from "react";
import { urlFor } from "../../helpers/image-url-builder";
import { Box, Flex, Label, Heading, Stack, Text, Card } from "@sanity/ui";
import styled from 'styled-components'

const Image = styled.img`
    aspect-ratio: 1;
    display: block;
    width: 100%;
`

export function Picture({ picture, size }) {
  return (
    <Stack direction="column">
      {picture?.asset ? (
        <Card radius={6} overflow="hidden">
          <Image
            src={urlFor(picture).width(size).height(size).url()}
            alt={picture?.alt ?? ""}
          />
        </Card>
      ) : (
        <Card radius={6}>
          <ImagePlaceholder size={size} />
        </Card>
      )}
    </Stack>
  );
}

export function GridBox({ text, value }) {
  return (
    <Stack space={4}>
      <Label as="h3">{text}</Label>
      <Box marginTop={2}>
        <Text>{value}</Text>
      </Box>
    </Stack>
  );
}

const ImagePlaceholder = styled.div`
  background: "lightgrey";
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`
