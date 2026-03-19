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
import {type ReactNode, useEffect, useMemo, useState} from 'react'

import {interpolateTemplate} from '../../../util/interpolateTemplate'
import {transformBlocks} from './helpers'

/** @internal */
export type InterpolationProp = {[key: string]: string | number}

import {assignInlineVars} from '@vanilla-extract/dynamic'
import {
  divider as dividerClass,
  serializerContainer,
  iconTextContainer as iconTextContainerClass,
  iconTextContainerAccent,
  accentSpan as accentSpanClass,
  semiboldSpan as semiboldSpanClass,
  fontWeightVar,
  link as linkClass,
  linkUseTextColor,
  dynamicIconContainerInline,
  dynamicIconContainerBlock,
  imageBlock,
  imageRadiusVar,
} from './UpsellDescriptionSerializer.css'

const DynamicIcon = (props: {icon: {url: string}; inline?: boolean}) => {
  const iconClassName = props.inline ? dynamicIconContainerInline : dynamicIconContainerBlock
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

  return <span className={iconClassName} dangerouslySetInnerHTML={{__html}} />
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



function ImageBlock(
  props: PortableTextTypeComponentProps<{
    image?: {url: string}
  }>,
) {
  return (
    <Box paddingX={2} marginY={4}>
      <img className={imageBlock} src={props.value.image?.url} />
    </Box>
  )
}

const interpolateChildrenText = (interpolation?: InterpolationProp) => (children: ReactNode) => {
  if (!children || !interpolation) return children

  const childrenArray = Array.isArray(children) ? children : [children]

  return childrenArray.map((child) => {
    if (typeof child === 'string') {
      return interpolateTemplate(child, interpolation)
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
      semibold: ({children}) => <span className={semiboldSpanClass}>{interpolateChildren(children)}</span>,
      link: (props) => (
        <a
          className={props.value.useTextColor ? linkUseTextColor : linkClass}
          href={props.value.href}
          rel="noopener noreferrer"
          target="_blank"
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
        </a>
      ),
      accent: ({children}) => <span className={accentSpanClass}>{interpolateChildren(children)}</span>,
    },
    types: {
      inlineIcon: (props) => {
        const children = props.value.sanityIcon ? (
          <Icon
            symbol={props.value.sanityIcon}
          />
        ) : (
          <>{props.value.icon?.url && <DynamicIcon icon={props.value.icon} inline />}</>
        )

        if (props.value.accent) {
          return <span className={accentSpanClass}>{children}</span>
        }
        return children
      },
      divider: () => (
        <Box marginY={3}>
          <Box paddingY={3}>
            <Box className={dividerClass} />
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
            <Text className={props.value.accent ? iconTextContainerAccent : iconTextContainerClass} size={1}>
              {props.value.sanityIcon ? (
                <Icon symbol={props.value.sanityIcon} />
              ) : (
                <>{props.value.icon?.url && <DynamicIcon icon={props.value.icon} />} </>
              )}
            </Text>
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
      <div className={serializerContainer}>
        <PortableText
          value={value}
          components={components}
          /* Disable warnings on missing components */
          onMissingComponent={false}
        />
      </div>
    </Card>
  )
}
