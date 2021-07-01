import React, {useCallback} from 'react'
import {ConnectorContext} from '@sanity/base/lib/change-indicators'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {DiffContext, DiffTooltip, useDiffAnnotationColor} from '../../../../diff'
import {isHeader} from '../helpers'
import {PortableTextBlock, PortableTextDiff} from '../types'
import Blockquote from './Blockquote'
import Header from './Header'
import Paragraph from './Paragraph'

export default function Block({
  diff,
  block,
  children,
}: {
  diff: PortableTextDiff
  block: PortableTextBlock
  children: JSX.Element
}): JSX.Element {
  const color = useDiffAnnotationColor(diff, [])
  const {path: fullPath} = React.useContext(DiffContext)
  const {onSetFocus} = React.useContext(ConnectorContext)
  const isRemoved = diff.action === 'removed'
  let returned = children

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!isRemoved) {
        onSetFocus(fullPath)
      }
    },
    [fullPath, isRemoved]
  )

  if (block.style === 'blockquote') {
    returned = <Blockquote>{returned}</Blockquote>
  } else if (block.style && isHeader(block)) {
    returned = <Header style={block.style}>{returned}</Header>
  } else {
    returned = <Paragraph>{returned}</Paragraph>
  }

  let fromStyle
  // If style was changed, indicate that
  if (
    diff.origin.action === 'changed' &&
    diff.origin.fields.style &&
    diff.origin.fields.style.action === 'changed' &&
    diff.origin.fields.style.annotation
  ) {
    fromStyle = diff?.origin?.fromValue?.style
    const style = color ? {background: color.background, color: color.text} : {}

    returned = (
      <Card
        padding={3}
        border
        radius={2}
        style={{borderStyle: 'dotted'}}
        diff-block-action={diff.action}
        data-block-note={`changed_from_style_${fromStyle || 'undefined'}`}
      >
        <Stack space={2}>
          <DiffTooltip
            annotations={[diff.origin.fields.style?.annotation]}
            diff={diff.origin.fields.style}
          >
            <Text size={0}>Changed block style from '{fromStyle}'</Text>
          </DiffTooltip>
          <Box style={style}>{returned}</Box>
        </Stack>
      </Card>
    )
  }

  return (
    <div
      onClick={handleClick}
      diff-block-action={diff.action}
      data-block-note={`changed_from_style_${fromStyle || 'undefined'}`}
    >
      {returned}
    </div>
  )
}
