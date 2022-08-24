import {LegacyLayerProvider, UserAvatar} from '@sanity/base/components'
import {useUser, useTimeAgo} from '@sanity/base/hooks'
import {Path} from '@sanity/types'
import React from 'react'
import {Tooltip, TooltipProps, Text, Stack, Flex, Inline, Label} from '@sanity/ui'
import {Diff, getAnnotationAtPath} from '../../diff'
import {AnnotationDetails} from '../../types'
import {useAnnotationColor} from '../annotations'

interface DiffTooltipProps extends TooltipProps {
  children: React.ReactElement
  description?: React.ReactNode
  diff: Diff
  path?: Path | string
}

interface DiffTooltipWithAnnotationsProps extends TooltipProps {
  annotations: AnnotationDetails[]
  children: React.ReactElement
  description?: React.ReactNode
}

export function DiffTooltip(props: DiffTooltipProps | DiffTooltipWithAnnotationsProps) {
  if ('diff' in props) {
    const {diff, path = [], ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path)

    return <DiffTooltipWithAnnotation {...restProps} annotations={annotation ? [annotation] : []} />
  }

  return <DiffTooltipWithAnnotation {...props} />
}

function DiffTooltipWithAnnotation(props: DiffTooltipWithAnnotationsProps) {
  const {annotations, children, description = 'Changed', ...restProps} = props

  if (!annotations) {
    return children
  }

  const content = (
    <Stack padding={3} space={2}>
      <Label size={1} style={{textTransform: 'uppercase'}}>
        {description}
      </Label>
      <Stack space={2}>
        {annotations.map((annotation, idx) => (
          <AnnotationItem annotation={annotation} key={idx} />
        ))}
      </Stack>
    </Stack>
  )

  return (
    <LegacyLayerProvider zOffset="paneFooter">
      <Tooltip
        content={content}
        data-placement={restProps.placement}
        portal
        allowedAutoPlacements={['top', 'bottom']}
        {...restProps}
      >
        {children}
      </Tooltip>
    </LegacyLayerProvider>
  )
}

function AnnotationItem({annotation}: {annotation: AnnotationDetails}) {
  const {author, timestamp} = annotation
  const {error, value: user} = useUser(author)
  const color = useAnnotationColor(annotation)
  const timeAgo = useTimeAgo(timestamp, {minimal: true})

  // @todo handle?
  if (error) {
    return null
  }

  return (
    <Inline space={2}>
      <Flex
        align="center"
        paddingRight={3}
        style={{
          backgroundColor: color.background,
          color: color.text,
          borderRadius: 'calc(23px / 2)',
        }}
      >
        <UserAvatar userId={author} />
        <Inline paddingLeft={2}>
          <Text muted size={1} style={{color: color.text}}>
            {user ? user.displayName : 'Loading…'}
          </Text>
        </Inline>
      </Flex>
      <Text as="time" size={1} dateTime={timestamp}>
        {timeAgo}
      </Text>
    </Inline>
  )
}
