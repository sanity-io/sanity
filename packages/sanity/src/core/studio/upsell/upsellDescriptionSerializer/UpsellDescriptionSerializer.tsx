import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
  type PortableTextTypeComponentProps,
} from '@portabletext/react'
import {Icon as IconWrapper, type IconSymbol} from '@sanity/icons'
import {LinkIcon} from '@sanity/icons/Link'
import {type PortableTextBlock} from '@sanity/types'
import {Card, Heading, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type CSSProperties, type ReactNode, useContext, useEffect, useMemo, useState} from 'react'
import {UpsellDescriptionSerializerContext} from 'sanity/_singletons'
import {Text, Flex, Box, Icon} from 'ui5'

import {interpolateTemplate} from '../../../util/interpolateTemplate'
import {transformBlocks} from './helpers'
import {
  accentSpan,
  divider,
  dynamicIconContainer,
  dynamicIconContainerInline,
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
      <Text size={1} muted as="div" trim={true}>
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

/**
 * Render-scoped options for the module-scope PortableText components below, provided through
 * `UpsellDescriptionSerializerContext`. Building the components map per render (even memoized on
 * these values) would give every block a new component identity and remount the description.
 *
 * @internal
 */
export interface UpsellDescriptionSerializerContextValue {
  onLinkClick?: ({url, linkTitle}: {url: string; linkTitle: string}) => void
  interpolation?: InterpolationProp
}

const EMPTY_CONTEXT_VALUE: UpsellDescriptionSerializerContextValue = {}

function useUpsellDescriptionSerializer(): UpsellDescriptionSerializerContextValue {
  return useContext(UpsellDescriptionSerializerContext) ?? EMPTY_CONTEXT_VALUE
}

function interpolateChildren(children: ReactNode, interpolation?: InterpolationProp): ReactNode {
  if (!children || !interpolation) return children

  const childrenArray = Array.isArray(children) ? children : [children]

  return childrenArray.map((child) => {
    if (typeof child === 'string') {
      return interpolateTemplate(child, interpolation)
    }

    return child
  })
}

/** Replaces `{{placeholders}}` in string children with the serializer's `interpolation` values. */
function Interpolated({children}: {children?: ReactNode}) {
  const {interpolation} = useUpsellDescriptionSerializer()
  return interpolateChildren(children, interpolation)
}

const LIST_ITEM_STYLE = {display: 'list-item', padding: '0.5rem 0'} as const

function ListItem({children}: {children?: ReactNode}) {
  return (
    <Text as="li" size={1} muted style={LIST_ITEM_STYLE} trim={true}>
      <Interpolated>{children}</Interpolated>
    </Text>
  )
}

interface LinkMarkValue {
  _type: 'link'
  href: string
  useTextColor?: boolean
  showIcon?: boolean
}

interface InlineIconValue {
  _type: 'inlineIcon'
  sanityIcon?: IconSymbol
  icon?: {url: string}
  hasTextLeft?: boolean
  hasTextRight?: boolean
  accent?: boolean
}

interface IconAndTextValue {
  _type: 'iconAndText'
  sanityIcon?: IconSymbol
  icon?: {url: string}
  accent?: boolean
  title?: string
  text?: string
}

function LinkMark(props: PortableTextMarkComponentProps<LinkMarkValue>) {
  const {children, text, value} = props
  const {onLinkClick} = useUpsellDescriptionSerializer()
  const href = value?.href

  return (
    <a
      className={clsx(link, value?.useTextColor && linkTextColor)}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      onClick={onLinkClick && href ? () => onLinkClick({url: href, linkTitle: text}) : undefined}
    >
      {children}
      {value?.showIcon && <LinkIcon style={{marginLeft: '2px'}} />}
    </a>
  )
}

function InlineIconBlock(props: PortableTextTypeComponentProps<InlineIconValue>) {
  const {value} = props
  const children = value.sanityIcon ? (
    <IconWrapper
      className={clsx(
        value.hasTextLeft && inlineIconTextLeft,
        value.hasTextRight && inlineIconTextRight,
      )}
      symbol={value.sanityIcon}
    />
  ) : (
    <>{value.icon?.url && <DynamicIcon icon={value.icon} inline />}</>
  )

  if (value.accent) {
    return <span className={accentSpan}>{children}</span>
  }
  return children
}

function DividerBlock() {
  return (
    <Box marginY={3}>
      <Box paddingY={3}>
        <Box className={divider} />
      </Box>
    </Box>
  )
}

function IconAndTextBlock(props: PortableTextTypeComponentProps<IconAndTextValue>) {
  const {value} = props

  return (
    <Flex
      alignItems="flex-start"
      paddingX={2}
      paddingTop={1}
      paddingBottom={2}
      marginTop={2}
      gap={2}
    >
      <Flex gap={2} style={{flexShrink: 0}}>
        {(props.value.sanityIcon || props.value.icon?.url) && (
          <Icon
            size={1}
            tone={props.value.accent ? 'suggest' : undefined}
            style={props.value.sanityIcon ? {margin: '-0.375rem'} : undefined}
            icon={
              props.value.sanityIcon ? (
                <IconWrapper symbol={props.value.sanityIcon} />
              ) : (
                <DynamicIcon icon={props.value.icon!} />
              )
            }
          />
        )}
        <Text
          size={1}
          weight="semibold"
          tone={props.value.accent ? 'suggest' : undefined}
          as="div"
          trim={true}
        >
          <Interpolated>{value.title}</Interpolated>
        </Text>
      </Flex>
      <Text size={1} muted tone={props.value.accent ? 'suggest' : undefined} as="div" trim={true}>
        <Interpolated>{value.text}</Interpolated>
      </Text>
    </Flex>
  )
}

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => (
      <NormalBlock>
        <Interpolated>{children}</Interpolated>
      </NormalBlock>
    ),
    h2: ({children}) => (
      <H2Block>
        <Interpolated>{children}</Interpolated>
      </H2Block>
    ),
    h3: ({children}) => (
      <H3Block>
        <Interpolated>{children}</Interpolated>
      </H3Block>
    ),
  },
  list: {
    bullet: ({children}) => (
      <ul>
        <Interpolated>{children}</Interpolated>
      </ul>
    ),
    number: ({children}) => (
      <ol>
        <Interpolated>{children}</Interpolated>
      </ol>
    ),
    checkmarks: ({children}) => <Interpolated>{children}</Interpolated>,
  },
  listItem: {
    bullet: ListItem,
    number: ListItem,
    checkmarks: ({children}) => (
      <Text as="div" trim={true}>
        {children}
      </Text>
    ),
  },
  marks: {
    strong: ({children}) => (
      <strong>
        <Interpolated>{children}</Interpolated>
      </strong>
    ),
    semibold: ({children}) => (
      <span className={semiboldSpan}>
        <Interpolated>{children}</Interpolated>
      </span>
    ),
    link: LinkMark,
    accent: ({children}) => (
      <span className={accentSpan}>
        <Interpolated>{children}</Interpolated>
      </span>
    ),
  },
  types: {
    inlineIcon: InlineIconBlock,
    divider: DividerBlock,
    iconAndText: IconAndTextBlock,
    imageBlock: ImageBlock,
  },
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

  const {font, radius} = useThemeV2()

  const value = useMemo(() => transformBlocks(blocks), [blocks])
  const contextValue = useMemo<UpsellDescriptionSerializerContextValue>(
    () => ({onLinkClick, interpolation}),
    [onLinkClick, interpolation],
  )

  return (
    <Card tone="default">
      <div
        className={serializerContainer}
        style={
          {
            [radius3Var]: `${radius[3]}px`,
            [textSemiboldWeightVar]: `${font.text.weights.semibold}`,
          } as CSSProperties
        }
      >
        <UpsellDescriptionSerializerContext.Provider value={contextValue}>
          <PortableText
            value={value}
            components={components}
            /* Disable warnings on missing components */
            onMissingComponent={false}
          />
        </UpsellDescriptionSerializerContext.Provider>
      </div>
    </Card>
  )
}
