import {ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text, Tooltip, TooltipProps} from '@sanity/ui'
import React, {Fragment, useMemo} from 'react'

export interface CommentBreadcrumbsProps {
  titlePath: string[]
  maxLength: number
}

type Item = string | string[]

const TOOLTIP_DELAY: TooltipProps['delay'] = {
  close: 0,
  open: 500,
}

const separator = (
  <Text muted>
    <ChevronRightIcon />
  </Text>
)

const renderItem = (item: string, index: number) => {
  return (
    <Box as="li" key={`${item}-${index}`}>
      <Text textOverflow="ellipsis" size={1} weight="semibold">
        {item}
      </Text>
    </Box>
  )
}

export function CommentBreadcrumbs(props: CommentBreadcrumbsProps) {
  const {titlePath, maxLength} = props

  const items: Item[] = useMemo(() => {
    const len = titlePath.length
    const beforeLength = Math.ceil(maxLength / 2)
    const afterLength = Math.floor(maxLength / 2)

    if (maxLength && len > maxLength) {
      return [
        ...titlePath.slice(0, beforeLength - 1),
        titlePath.slice(beforeLength - 1, len - afterLength),
        ...titlePath.slice(len - afterLength),
      ]
    }

    return titlePath
  }, [maxLength, titlePath])

  const nodes = useMemo(() => {
    return items.map((item, index) => {
      const key = `${item}-${index}`
      const showSeparator = index < items.length - 1

      if (Array.isArray(item)) {
        return (
          <Fragment key={key}>
            <Tooltip
              delay={TOOLTIP_DELAY}
              content={
                <Stack space={2} padding={2}>
                  {item.map(renderItem)}
                </Stack>
              }
            >
              <Box>{renderItem('...', index)}</Box>
            </Tooltip>

            {showSeparator && separator}
          </Fragment>
        )
      }

      return (
        <Fragment key={key}>
          {renderItem(item, index)}

          {showSeparator && separator}
        </Fragment>
      )
    })
  }, [items])

  return (
    <Flex align="center" as="ol" gap={2}>
      {nodes}
    </Flex>
  )
}
