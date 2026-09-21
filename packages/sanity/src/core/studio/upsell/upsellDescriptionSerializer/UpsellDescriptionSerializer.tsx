import {
  PortableText,
  type PortableTextComponents,
  type PortableTextTypeComponentProps,
} from '@portabletext/react'
import {Icon} from '@sanity/icons'
import {LinkIcon} from '@sanity/icons/Link'
import {type PortableTextBlock} from '@sanity/types'
import {Card, Heading, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {Flex, Box} from 'ui5'

import {interpolateTemplate} from '../../../util/interpolateTemplate'
import {transformBlocks} from './helpers'
import {
  accentSpan,
  divider,
  dynamicIconContainer,
  dynamicIconContainerInline,
  iconTextContainerAccent,
  image,
  inlineIconTextLeft,
  inlineIconTextRight,
  link,
  linkTextColor,
  radius3Var,
  semiboldSpan,
  serializerContainer,
  textSemiboldWeightVar,
} from './UpsellDescriptionSerializer.css'

/** @internal */
export type InterpolationProp = {[key: string]: string | number}

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

  return (
    <span
      className={clsx(dynamicIconContainer, props.inline && dynamicIconContainerInline)}
      dangerouslySetInnerHTML={{__html}}
    />
  )
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
      <img className={image} src={props.value.image?.url} alt="" />
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
      semibold: ({children}) => (
        <span className={semiboldSpan}>{interpolateChildren(children)}</span>
      ),
      link: (props) => (
        <a
          className={clsx(link, props.value.useTextColor && linkTextColor)}
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
      accent: ({children}) => <span className={accentSpan}>{interpolateChildren(children)}</span>,
    },
    types: {
      inlineIcon: (props) => {
        const children = props.value.sanityIcon ? (
          <Icon
            className={clsx(
              props.value.hasTextLeft && inlineIconTextLeft,
              props.value.hasTextRight && inlineIconTextRight,
            )}
            symbol={props.value.sanityIcon}
          />
        ) : (
          <>{props.value.icon?.url && <DynamicIcon icon={props.value.icon} inline />}</>
        )

        if (props.value.accent) {
          return <span className={accentSpan}>{children}</span>
        }
        return children
      },
      divider: () => (
        <Box marginY={3}>
          <Box paddingY={3}>
            <Box className={divider} />
          </Box>
        </Box>
      ),
      iconAndText: (props) => (
        <Flex
          alignItems="flex-start"
          paddingX={2}
          paddingTop={1}
          paddingBottom={2}
          marginTop={2}
          gap={2}
        >
          <Flex gap={2} style={{flexShrink: 0}}>
            <Text
              className={props.value.accent ? iconTextContainerAccent : undefined}
              size={1}
              accent={props.value.accent}
            >
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
  // `radius` and `font` do not vary with tone or scheme, so one read at the root serves every
  // `semibold` mark and image block rendered below it.
  const {font, radius} = useThemeV2()

  const value = useMemo(() => transformBlocks(blocks), [blocks])
  const components = useMemo(
    () => createComponents({onLinkClick, interpolation}),
    [onLinkClick, interpolation],
  )

  return (
    <Card tone="default">
      <div
        className={serializerContainer}
        style={assignInlineVars({
          [radius3Var]: `${radius[3]}px`,
          [textSemiboldWeightVar]: `${font.text.weights.semibold}`,
        })}
      >
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
