import {
  PortableText,
  type PortableTextComponents,
  type PortableTextTypeComponentProps,
} from '@portabletext/react'
import {Icon, LinkIcon} from '@sanity/icons'
import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex, Heading, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {template} from 'lodash'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {TEMPLATE_OPTIONS} from '../constants'
import {transformBlocks} from './helpers'

/** @internal */
export type InterpolationProp = {[key: string]: string | number}

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

const Link = styled.a<{$useTextColor: boolean}>`
  font-weight: 600;
  color: ${(props) => (props.$useTextColor ? 'var(--card-muted-fg-color) !important' : '')};
`

const DynamicIconContainer = styled.span<{$inline: boolean}>`
  display: ${({$inline}) => ($inline ? 'inline-block' : 'inline')};
  font-size: calc(21 / 16 * 1rem) !important;
  min-width: calc(21 / 16 * 1rem - 0.375rem);
  line-height: 0;
  > svg {
    height: 1em;
    width: 1em;
    display: inline;
    font-size: 1em !important;
    margin: -0.375rem !important;
    *[stroke] {
      stroke: currentColor;
    }
  }
`

const accentSpanWrapper = (children: ReactNode) => <AccentSpan>{children}</AccentSpan>

const DynamicIcon = (props: {icon: {url: string}; inline?: boolean}) => {
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

  return <DynamicIconContainer $inline={!!props.inline} dangerouslySetInnerHTML={{__html}} />
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

function H2Block(props: {children: ReactNode}) {
  const {children} = props
  return (
    <Box paddingX={2} marginY={4}>
      <Heading size={2} as="h2">
        {children}
      </Heading>
    </Box>
  )
}

function H3Block(props: {children: ReactNode}) {
  const {children} = props
  return (
    <Box paddingX={2} marginY={4}>
      <Heading size={1} as="h3">
        {children}
      </Heading>
    </Box>
  )
}

const Image = styled.img((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    object-fit: cover;
    width: 100%;
    border-radius: ${theme.radius[3]}px;
  `
})

function ImageBlock(
  props: PortableTextTypeComponentProps<{
    image?: {url: string}
  }>,
) {
  return (
    <Box paddingX={2} marginY={4}>
      <Image src={props.value.image?.url} />
    </Box>
  )
}

const interpolateChildrenText = (interpolation?: InterpolationProp) => (children: ReactNode) => {
  if (!children || !interpolation) return children

  const childrenArray = Array.isArray(children) ? children : [children]

  return childrenArray.map((child) => {
    if (typeof child === 'string') {
      const childTemplate = template(child, TEMPLATE_OPTIONS)
      return childTemplate(interpolation)
    }

    return child
  })
}

const createComponents = ({
  onLinkClick,
  interpolation,
}: {
  onLinkClick?: ({url, linkTitle}: {url: string; linkTitle: string}) => void
  interpolation?: InterpolationProp
}): PortableTextComponents => {
  const interpolateChildren = interpolateChildrenText(interpolation)

  return {
    block: {
      normal: ({children}) => <NormalBlock>{interpolateChildren(children)}</NormalBlock>,
      h2: ({children}) => <H2Block>{interpolateChildren(children)}</H2Block>,
      h3: ({children}) => <H3Block>{interpolateChildren(children)}</H3Block>,
    },
    list: {
      bullet: ({children}) => <ul>{interpolateChildren(children)}</ul>,
      number: ({children}) => <ol>{interpolateChildren(children)}</ol>,
      checkmarks: ({children}) => <>{interpolateChildren(children)}</>,
    },
    listItem: {
      bullet: ({children}) => (
        <Text
          as="li"
          size={1}
          muted
          style={{
            display: 'list-item',
            padding: '0.5rem 0',
          }}
        >
          {interpolateChildren(children)}
        </Text>
      ),
      number: ({children}) => (
        <Text
          as="li"
          size={1}
          muted
          style={{
            display: 'list-item',
            padding: '0.5rem 0',
          }}
        >
          {interpolateChildren(children)}
        </Text>
      ),
      checkmarks: ({children}) => <Text>{children}</Text>,
    },

    marks: {
      strong: ({children}) => <strong>{interpolateChildren(children)}</strong>,
      semibold: ({children}) => <SemiboldSpan>{interpolateChildren(children)}</SemiboldSpan>,
      link: (props) => (
        <Link
          href={props.value.href}
          rel="noopener noreferrer"
          target="_blank"
          $useTextColor={props.value.useTextColor}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={
            onLinkClick
              ? () =>
                  onLinkClick({
                    url: props.value.href,
                    linkTitle: props.text,
                  })
              : undefined
          }
        >
          {props.children}
          {props.value.showIcon && <LinkIcon style={{marginLeft: '2px'}} />}
        </Link>
      ),
      accent: ({children}) => <AccentSpan>{interpolateChildren(children)}</AccentSpan>,
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
              <>{props.value.icon?.url && <DynamicIcon icon={props.value.icon} inline />}</>
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
        <Flex
          align="flex-start"
          paddingX={2}
          paddingTop={1}
          paddingBottom={2}
          marginTop={2}
          gap={2}
        >
          <Flex gap={2} style={{flexShrink: 0}}>
            <IconTextContainer size={1} accent={props.value.accent}>
              {props.value.sanityIcon ? (
                <Icon symbol={props.value.sanityIcon} />
              ) : (
                <>{props.value.icon?.url && <DynamicIcon icon={props.value.icon} />} </>
              )}
            </IconTextContainer>
            <Text size={1} weight="semibold" accent={props.value.accent}>
              {interpolateChildren(props.value.title)}
            </Text>
          </Flex>

          <Text size={1} muted accent={props.value.accent}>
            {interpolateChildren(props.value.text)}
          </Text>
        </Flex>
      ),
      imageBlock: (props) => <ImageBlock {...props} />,
    },
  }
}

interface DescriptionSerializerProps {
  blocks: PortableTextBlock[]
  onLinkClick?: ({url, linkTitle}: {url: string; linkTitle: string}) => void
  interpolation?: InterpolationProp
}

/**
 * Portable text serializer for the description text for upsell elements.
 * Not meant for public consumption.
 * @internal
 */
export function UpsellDescriptionSerializer(props: DescriptionSerializerProps) {
  const {blocks, onLinkClick, interpolation} = props

  const value = useMemo(() => transformBlocks(blocks), [blocks])
  const components = useMemo(
    () => createComponents({onLinkClick, interpolation}),
    [onLinkClick, interpolation],
  )

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
