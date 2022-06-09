import React from 'react'
import {PortableText, PortableTextComponents} from '@portabletext/react'
import {Box, Card, Code, Heading, Stack, Text} from '@sanity/ui'
import urlBuilder from '@sanity/image-url'
import {getProject} from '@sanity/asset-utils'
import {StudioBlockContent, MaterializedImage, CodeBlock} from '../../../../../module-status'
import {ImageCard, ListBox, ListBoxOuter, RootBox, SpaceBox} from './PortableTextContent.styles'

interface PortableTextContentProps {
  value: StudioBlockContent[]
}

function Image({value}: {value: MaterializedImage}) {
  if (!value?.asset) {
    return null
  }

  const project = getProject(value.asset)
  const url = urlBuilder(project).image(value).fit('max').auto('format').url()

  const {asset, alt, caption} = value
  const {dimensions, lqip} = asset?.metadata || {}
  const aspectRatio = (dimensions.height / dimensions.width) * 100

  return (
    <SpaceBox marginY={4}>
      <Stack space={3} as="figure">
        <ImageCard radius={1} shadow={1} overflow="hidden" $aspectRatio={aspectRatio} $lqip={lqip}>
          <img src={url} alt={alt || caption} referrerPolicy="strict-origin-when-cross-origin" />
        </ImageCard>
        {caption && (
          <Text align="center" as="figcaption" muted size={1}>
            {value.caption}
          </Text>
        )}
      </Stack>
    </SpaceBox>
  )
}

const components: PortableTextComponents = {
  types: {
    image: ({value}) => <Image value={value} />,
    code: ({value}: {value: CodeBlock}) => (
      <SpaceBox marginY={4}>
        <Card padding={3} tone="transparent" radius={1} overflow="auto">
          <Code size={1} language={value?.language}>
            {value?.code}
          </Code>
        </Card>
      </SpaceBox>
    ),
  },
  block: {
    h1: ({children}) => (
      <SpaceBox marginBottom={4} marginTop={5}>
        <Heading size={5}>{children}</Heading>
      </SpaceBox>
    ),
    h2: ({children}) => (
      <SpaceBox marginBottom={4} marginTop={5}>
        <Heading size={4}>{children}</Heading>
      </SpaceBox>
    ),
    h3: ({children}) => (
      <SpaceBox marginBottom={4} marginTop={5}>
        <Heading size={3}>{children}</Heading>
      </SpaceBox>
    ),
    h4: ({children}) => (
      <SpaceBox marginBottom={4} marginTop={5}>
        <Heading size={2}>{children}</Heading>
      </SpaceBox>
    ),
    h5: ({children}) => (
      <SpaceBox marginBottom={4} marginTop={5}>
        <Heading size={1}>{children}</Heading>
      </SpaceBox>
    ),
    h6: ({children}) => (
      <SpaceBox marginBottom={4} marginTop={5}>
        <Heading size={0}>{children}</Heading>
      </SpaceBox>
    ),
    normal: ({children}) => (
      <SpaceBox marginY={4}>
        <Text as="p" muted size={1}>
          {children}
        </Text>
      </SpaceBox>
    ),
  },
  list: {
    bullet: ({children}) => (
      <SpaceBox data-list-type="bullet" marginBottom={4}>
        <Box as="ul">{children}</Box>
      </SpaceBox>
    ),
    number: ({children}) => (
      <SpaceBox data-list-type="number" marginBottom={4}>
        <Box as="ol">{children}</Box>
      </SpaceBox>
    ),
  },
  listItem: {
    bullet: ({children}) => (
      <ListBoxOuter marginBottom={1} forwardedAs="li">
        <ListBox>
          <Text muted size={1} data-list-prefix="bullet" />
          <Text muted size={1}>
            {children}
          </Text>
        </ListBox>
      </ListBoxOuter>
    ),
    number: ({children}) => (
      <ListBoxOuter marginBottom={1} forwardedAs="li">
        <ListBox>
          <Text muted data-list-prefix="number" size={1} />
          <Text muted size={1}>
            {children}
          </Text>
        </ListBox>
      </ListBoxOuter>
    ),
  },
}

export function PortableTextContent(props: PortableTextContentProps) {
  const {value} = props

  return (
    <RootBox>
      <PortableText value={value} components={components} />
    </RootBox>
  )
}
