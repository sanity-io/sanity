import {type Path, type PortableTextTextBlock} from '@sanity/types'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {type MouseEvent, useCallback, useContext} from 'react'
import {DiffContext, ReviewChangesContext} from 'sanity/_singletons'

import {useTranslation} from '../../../../../i18n'
import {DiffTooltip, useDiffAnnotationColor} from '../../../../diff'
import {isHeader} from '../helpers'
import {type PortableTextDiff} from '../types'
import {Blockquote} from './Blockquote'
import {Header} from './Header'
import {Paragraph} from './Paragraph'

const EMPTY_PATH: Path = []

export function Block(props: {
  diff: PortableTextDiff
  block: PortableTextTextBlock
  children: React.JSX.Element
}): React.JSX.Element {
  const {diff, block, children} = props
  const color = useDiffAnnotationColor(diff, EMPTY_PATH)
  const {path: fullPath} = useContext(DiffContext)
  const {onSetFocus} = useContext(ReviewChangesContext)
  const {t} = useTranslation()
  const isRemoved = diff.action === 'removed'
  let returned = children

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
      event.stopPropagation()

      if (!isRemoved) {
        onSetFocus(fullPath)
      }
    },
    [fullPath, isRemoved, onSetFocus],
  )

  if (block.style === 'blockquote') {
    returned = <Blockquote>{returned}</Blockquote>
  } else if (block.style && isHeader(block)) {
    returned = <Header style={block.style}>{returned}</Header>
  } else {
    returned = <Paragraph>{returned}</Paragraph>
  }

  let fromStyle: string | undefined
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
            <Text size={0}>
              {t('changes.portable-text.block-style-changed', {fromStyle, toStyle: block.style})}
            </Text>
          </DiffTooltip>
          <Box style={style}>{returned}</Box>
        </Stack>
      </Card>
    )
  }

  return (
    <div
      onClick={handleClick}
      data-diff-block-action={diff.action}
      data-block-note={`changed_from_style_${fromStyle || 'undefined'}`}
    >
      {returned}
    </div>
  )
}
