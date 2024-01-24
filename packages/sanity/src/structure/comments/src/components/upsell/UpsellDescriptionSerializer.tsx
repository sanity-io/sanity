import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {LinkIcon} from '@sanity/icons'
import type {PortableTextBlock} from '@sanity/types'
import {Box, Flex, Heading, Text} from '@sanity/ui'
import styled from 'styled-components'
import React, {useEffect, useState} from 'react'

interface DescriptionSerializerProps {
  blocks: PortableTextBlock[]
}

const Divider = styled(Box)`
  height: 1px;
  background: var(--card-border-color);
  width: 100%;
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
const DynamicIcon = (props: {icon: {url: string}}) => {
  const [ref, setRef] = useState<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (!ref) return

    const controller = new AbortController()
    const signal = controller.signal

    fetch(props.icon.url, {signal})
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.text()
      })
      .then((data) => {
        if (!ref) return
        ref.innerHTML = data
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })

    // eslint-disable-next-line consistent-return
    return () => {
      controller.abort()
    }
  }, [ref, props.icon.url])

  return <DynamicIconContainer ref={setRef} />
}

function NormalBlock(props: {children: React.ReactNode}) {
  const {children} = props

  return (
    <Box paddingX={2}>
      <Text size={1} muted>
        {children}
      </Text>
    </Box>
  )
}

function HeadingBlock(props: {children: React.ReactNode}) {
  const {children} = props
  return (
    <Box paddingX={2}>
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
    inlineIcon: (props) => <DynamicIcon icon={props.value.icon} />,
    divider: () => (
      <Box marginY={3}>
        <Box paddingY={3}>
          <Divider />
        </Box>
      </Box>
    ),
    iconAndText: (props) => (
      <Flex align="flex-start" paddingX={2} paddingTop={1} paddingBottom={2} gap={2}>
        <Flex gap={1} style={{flexShrink: 0}}>
          <Text accent={props.value.accent} size={1}>
            <DynamicIcon icon={props.value.icon} />
          </Text>
          <Text accent={props.value.accent} size={1} weight="semibold">
            {props.value.title}
          </Text>
        </Flex>

        <Text accent={props.value.accent} size={1} muted>
          {props.value.text}
        </Text>
      </Flex>
    ),
  },
}

export function DescriptionSerializer(props: DescriptionSerializerProps) {
  return (
    <PortableText
      value={props.blocks}
      components={components}
      /* Disable warnings on missing components */
      onMissingComponent={false}
    />
  )
}
