import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
  type PortableTextTypeComponentProps,
} from '@portabletext/react'
import {Icon, type IconSymbol} from '@sanity/icons'
import {LinkIcon} from '@sanity/icons/Link'
import {type PortableTextBlock} from '@sanity/types'
import {Card, Heading, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ReactNode, useContext, useEffect, useMemo, useState} from 'react'
import {UpsellDescriptionSerializerContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {interpolateTemplate} from '../../../util/interpolateTemplate'
import {transformBlocks} from './helpers'

/** @internal */
export type InterpolationProp = {[key: string]: string | number}

const Divider = styled(Box)`
  height: 1px;
  background: var(--card-border-color);
  width: 100%;
`

const SerializerContainer = styled.div`
  /* Remove margin top of first element */
  > div:first-child {
    margin-top: 0;
  }
  /* Remove margin bottom to last box. */
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
    <Text as="li" size={1} muted style={LIST_ITEM_STYLE}>
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
    <Link
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      $useTextColor={Boolean(value?.useTextColor)}
      onClick={onLinkClick && href ? () => onLinkClick({url: href, linkTitle: text}) : undefined}
    >
      {children}
      {value?.showIcon && <LinkIcon style={{marginLeft: '2px'}} />}
    </Link>
  )
}

function InlineIconBlock(props: PortableTextTypeComponentProps<InlineIconValue>) {
  const {value} = props
  const children = value.sanityIcon ? (
    <InlineIcon
      symbol={value.sanityIcon}
      $hasTextLeft={Boolean(value.hasTextLeft)}
      $hasTextRight={Boolean(value.hasTextRight)}
    />
  ) : (
    <>{value.icon?.url && <DynamicIcon icon={value.icon} inline />}</>
  )

  if (value.accent) {
    return <AccentSpan>{children}</AccentSpan>
  }
  return children
}

function DividerBlock() {
  return (
    <Box marginY={3}>
      <Box paddingY={3}>
        <Divider />
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
        <IconTextContainer size={1} accent={value.accent}>
          {value.sanityIcon ? (
            <Icon symbol={value.sanityIcon} />
          ) : (
            <>{value.icon?.url && <DynamicIcon icon={value.icon} />} </>
          )}
        </IconTextContainer>
        <Text size={1} weight="semibold" accent={value.accent}>
          <Interpolated>{value.title}</Interpolated>
        </Text>
      </Flex>

      <Text size={1} muted accent={value.accent}>
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
    checkmarks: ({children}) => <Text>{children}</Text>,
  },
  marks: {
    strong: ({children}) => (
      <strong>
        <Interpolated>{children}</Interpolated>
      </strong>
    ),
    semibold: ({children}) => (
      <SemiboldSpan>
        <Interpolated>{children}</Interpolated>
      </SemiboldSpan>
    ),
    link: LinkMark,
    accent: ({children}) => (
      <AccentSpan>
        <Interpolated>{children}</Interpolated>
      </AccentSpan>
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

  const value = useMemo(() => transformBlocks(blocks), [blocks])
  const contextValue = useMemo<UpsellDescriptionSerializerContextValue>(
    () => ({onLinkClick, interpolation}),
    [onLinkClick, interpolation],
  )

  return (
    <Card tone="default">
      <SerializerContainer>
        <UpsellDescriptionSerializerContext.Provider value={contextValue}>
          <PortableText
            value={value}
            components={components}
            /* Disable warnings on missing components */
            onMissingComponent={false}
          />
        </UpsellDescriptionSerializerContext.Provider>
      </SerializerContainer>
    </Card>
  )
}
