import {PortableText, PortableTextComponents} from '@portabletext/react'
import {gray} from '@sanity/color'
import {LinkIcon} from '@sanity/icons'
import {PortableTextBlock} from '@sanity/types'
import {Box, Flex, Text} from '@sanity/ui'
import styled from 'styled-components'

interface DescriptionSerializerProps {
  blocks: PortableTextBlock[]
}

const Divider = styled(Box)`
  height: 1px;
  background: var(--card-border-color);
  width: 100%;
`

const ImageAsIcon = styled.img`
  width: 21px;
  height: 21px;
  margin-right: 8px;
`

const InlineIconImage = styled.img`
  width: 21px;
  height: 21px;
  margin: -7px 0;
`

const SerializerContainer = styled.div`
  --card-fg-color: ${gray[600].hex};
  // Remove margin bottom to last box.
  > [data-ui='Box']:last-child {
    margin-bottom: 0;
  }
`

const IconRowTitle = styled(Text)`
  --card-fg-color: ${gray[800].hex};
`

const Link = styled.a<{useTextColor: boolean}>`
  font-weight: 600;
  color: ${(props) => (props.useTextColor ? 'var(--card-fg-color) !important' : '')};
`

function NormalBlock(props: {children: React.ReactNode}) {
  const {children} = props

  return (
    <Box paddingX={2} marginBottom={4}>
      <Text size={1}>{children}</Text>
    </Box>
  )
}

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => <NormalBlock>{children}</NormalBlock>,
  },
  list: {
    bullet: ({children}) => children,
    number: ({children}) => <>{children}</>,
    checkmarks: ({children}) => <>{children}</>,
  },
  listItem: {
    bullet: ({children}) => <NormalBlock>{children}</NormalBlock>,
    number: ({children}) => <NormalBlock>{children}</NormalBlock>,
    checkmarks: ({children}) => <NormalBlock>{children}</NormalBlock>,
  },

  marks: {
    strong: ({children}) => <strong>{children}</strong>,
    link: (props) => (
      <Link
        href={props.value.href}
        rel="noopener noreferrer"
        target="_blank"
        useTextColor={props.value.useTextColor}
      >
        {props.children}
        {props.value.showIcon && <LinkIcon style={{marginLeft: '2px'}} />}
      </Link>
    ),
  },
  types: {
    inlineIcon: (props) => (
      <InlineIconImage src={props.value.icon?.url} alt={props.value.icon?.title} />
    ),
    divider: () => (
      <Box marginY={3}>
        <Box paddingY={3}>
          <Divider />
        </Box>
      </Box>
    ),
    iconAndText: (props) => (
      <Flex align="center" paddingX={2} marginTop={2}>
        <ImageAsIcon src={props.value.icon.url} alt={props.value.title} />
        <IconRowTitle size={1} weight="semibold">
          {props.value.title}
        </IconRowTitle>
        <Box marginLeft={2}>
          <Text size={1}>{props.value.text}</Text>
        </Box>
      </Flex>
    ),
  },
}

export function DescriptionSerializer(props: DescriptionSerializerProps) {
  return (
    <SerializerContainer>
      <PortableText value={props.blocks} components={components} />
    </SerializerContainer>
  )
}
