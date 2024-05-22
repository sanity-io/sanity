import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {Icon, LinkIcon} from '@sanity/icons'
import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex, Heading, Text} from '@sanity/ui'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {transformBlocks} from './helpers'

interface DescriptionSerializerProps {
  blocks: PortableTextBlock[]
}
const Divider = styled(Box)`
  height: 1px;
  background: var(--card-border-color);
  width: 100%;
`

const SerializerContainer = styled.div`
  // Remove margin top of first element
  > div:first-child {
    margin-top: 0;
  }
  // Remove margin bottom to last box.
  > [data-ui='Box']:last-child {
    margin-bottom: 0;
  }
`

const IconTextContainer = styled(Text)((props) => {
  if (props.accent) {
    return `
    --card-icon-color: var(--card-accent-fg-color);
    `
  }
  return ``
})

const AccentSpan = styled.span`
  color: var(--card-accent-fg-color);
  --card-icon-color: var(--card-accent-fg-color);
`

const SemiboldSpan = styled.span(({theme}) => {
  const {weights} = theme.sanity.fonts.text

  return css`
    font-weight: ${weights.semibold};
  `
})

interface InlineIconProps {
  $hasTextLeft: boolean
  $hasTextRight: boolean
}
const InlineIcon = styled(Icon)<InlineIconProps>`
  &[data-sanity-icon] {
    /* Forces the icon to leave the necessary space to the right or left it has surrounding text */
    margin-left: ${(props) => (props.$hasTextLeft ? '0' : '')};
    margin-right: ${(props) => (props.$hasTextRight ? '0' : '')};
  }
`

const Link = styled.a<{useTextColor: boolean}>`
  font-weight: 600;
  color: ${(props) => (props.useTextColor ? 'var(--card-muted-fg-color) !important' : '')};
`

const DynamicIconContainer = styled.span`
  > svg {
    display: inline;
    font-size: calc(21 / 16 * 1rem) !important;
    margin: -0.375rem 0 !important;
    *[stroke] {
      stroke: currentColor;
    }
  }
`

const accentSpanWrapper = (children: ReactNode) => <AccentSpan>{children}</AccentSpan>

const DynamicIcon = (props: {icon: {url: string}}) => {
  const [__html, setHtml] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    fetch(props.icon.url, {signal})
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.text()
      })
      .then((data) => setHtml(data))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })

    return () => {
      controller.abort()
    }
  }, [props.icon.url])

  return <DynamicIconContainer dangerouslySetInnerHTML={{__html}} />
}

function NormalBlock(props: {children: ReactNode}) {
  const {children} = props

  return (
    <Box paddingX={2} marginBottom={4}>
      <Text size={1} muted>
        {children}
      </Text>
    </Box>
  )
}

function HeadingBlock(props: {children: ReactNode}) {
  const {children} = props
  return (
    <Box paddingX={2} marginY={4}>
      <Heading size={2} as="h2">
        {children}
      </Heading>
    </Box>
  )
}

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => <NormalBlock>{children}</NormalBlock>,
    h2: ({children}) => <HeadingBlock>{children}</HeadingBlock>,
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
    semibold: ({children}) => <SemiboldSpan>{children}</SemiboldSpan>,
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
    accent: (props) => <AccentSpan>{props.children}</AccentSpan>,
  },
  types: {
    inlineIcon: (props) => {
      return (
        <ConditionalWrapper condition={props.value.accent} wrapper={accentSpanWrapper}>
          {props.value.sanityIcon ? (
            <InlineIcon
              symbol={props.value.sanityIcon}
              $hasTextLeft={props.value.hasTextLeft}
              $hasTextRight={props.value.hasTextRight}
            />
          ) : (
            <DynamicIcon icon={props.value.icon} />
          )}
        </ConditionalWrapper>
      )
    },
    divider: () => (
      <Box marginY={3}>
        <Box paddingY={3}>
          <Divider />
        </Box>
      </Box>
    ),
    iconAndText: (props) => (
      <Flex align="flex-start" paddingX={2} paddingTop={1} paddingBottom={2} marginTop={2} gap={2}>
        <Flex gap={2} style={{flexShrink: 0}}>
          <IconTextContainer size={1} accent={props.value.accent}>
            {props.value.sanityIcon ? (
              <Icon symbol={props.value.sanityIcon} />
            ) : (
              <DynamicIcon icon={props.value.icon} />
            )}
          </IconTextContainer>
          <Text size={1} weight="semibold" accent={props.value.accent}>
            {props.value.title}
          </Text>
        </Flex>

        <Text size={1} muted accent={props.value.accent}>
          {props.value.text}
        </Text>
      </Flex>
    ),
  },
}

interface DescriptionSerializerProps {
  blocks: PortableTextBlock[]
}

/**
 * Portable text serializer for the description text for upsell elements.
 * Not meant for public consumption.
 * @internal
 */
export function UpsellDescriptionSerializer(props: DescriptionSerializerProps) {
  const value = useMemo(() => transformBlocks(props.blocks), [props.blocks])
  return (
    <Card tone="default">
      <SerializerContainer>
        <PortableText
          value={value}
          components={components}
          /* Disable warnings on missing components */
          onMissingComponent={false}
        />
      </SerializerContainer>
    </Card>
  )
}
