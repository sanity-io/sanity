import {isKeySegment, type Path} from '@sanity/types'
import React, {type SyntheticEvent, useCallback, useMemo, useContext} from 'react'
import {useTranslation} from '../../../../../i18n'
import {DiffCard, DiffContext} from '../../../../diff'
import type {ObjectDiff, StringDiff, StringDiffSegment} from '../../../../types'
import {ConnectorContext} from '../../../../../changeIndicators'
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
  const {onSetFocus} = useContext(ConnectorContext)
  const {path: fullPath} = useContext(DiffContext)
  const spanSegment = useMemo(() => path.slice(-2, 1)[0], [path])
  const {t} = useTranslation()
  const isRemoved = diff && diff.action === 'removed'
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex(
      (seg) => isKeySegment(seg) && isKeySegment(spanSegment) && seg._key === spanSegment._key,
    ),
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
    [focusPath, isRemoved, onSetFocus],
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
        tooltip={{description: t('change.portable-text.text', {context: segment.action})}}
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
