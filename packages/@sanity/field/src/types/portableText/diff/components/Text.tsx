import {isKeySegment, Path} from '@sanity/types'
import React, {SyntheticEvent, useCallback} from 'react'
import {ConnectorContext} from '@sanity/base/lib/change-indicators'
import {startCase} from 'lodash'
import {DiffCard, DiffContext, ObjectDiff, StringDiff, StringDiffSegment} from '../../../../diff'
import {InlineBox} from './styledComponents'

interface TextProps {
  diff?: StringDiff
  childDiff?: ObjectDiff
  children: JSX.Element
  path: Path
  segment: StringDiffSegment
}

export function Text({
  diff,
  childDiff,
  children,
  path,
  segment,
  ...restProps
}: TextProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const diffWithFallback = diff || childDiff
  const hasChanged =
    diffWithFallback && diffWithFallback.action !== 'unchanged' && segment.action !== 'unchanged'
  if (hasChanged) {
    return (
      <TextWithDiff {...restProps} childDiff={childDiff} diff={diff} segment={segment} path={path}>
        {children}
      </TextWithDiff>
    )
  }
  return <InlineBox>{children}</InlineBox>
}

export function TextWithDiff({diff, childDiff, children, path, segment, ...restProps}: TextProps) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path: fullPath} = React.useContext(DiffContext)
  const spanSegment = path.slice(-2, 1)[0]
  const isRemoved = diff && diff.action === 'removed'
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex(
      (seg) => isKeySegment(seg) && isKeySegment(spanSegment) && seg._key === spanSegment._key
    )
  )
  const focusPath = prefix.concat(path)

  const handleClick = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation()
      if (!isRemoved) {
        event.preventDefault()
        onSetFocus(focusPath)
      }
    },
    [focusPath]
  )
  const realSeg = diff && diff.segments.find((rSeg) => rSeg.text === segment.text)

  const diffWithFallback = realSeg || diff || childDiff
  const annotation =
    (diffWithFallback && diffWithFallback.action !== 'unchanged' && diffWithFallback.annotation) ||
    null
  const diffCard =
    annotation && segment.action !== 'unchanged' ? (
      <DiffCard
        annotation={annotation}
        as={segment.action === 'removed' ? 'del' : 'ins'}
        tooltip={{description: `${startCase(segment.action)} text`}}
      >
        {children}
      </DiffCard>
    ) : null
  return (
    <InlineBox {...restProps} onClick={handleClick} data-changed="">
      <span>
        <>{diffCard || children}</>
      </span>
    </InlineBox>
  )
}
