import React from 'react'
import {Stack, Card} from '@sanity/ui'
import {urlFor} from '../../../helpers/image-url-builder'
import styled from 'styled-components'

export function Picture({picture, size}) {
  return (
    <Stack direction="column">
      {picture?.asset ? (
        <Card radius={6} overflow="hidden">
          <Image src={urlFor(picture).width(size).height(size).url()} alt={picture?.alt ?? ''} />
        </Card>
      ) : (
        <Card radius={6} overflow="hidden">
          <ImagePlaceholder $size={size} />
        </Card>
      )}
    </Stack>
  )
}

const Image = styled.img`
  aspect-ratio: 1;
  display: block;
  width: 100%;
`

const ImagePlaceholder = styled.div`
  background: #ffd6c8;
  width: ${(props) => props.$size}px;
  aspect-ratio: 1;
  max-width: 100%;
`
