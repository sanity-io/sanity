import React, {FunctionComponent, SyntheticEvent, useCallback, useMemo} from 'react'
import {PortableTextChild, RenderAttributes} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Path} from '@sanity/types'
import styled, {css} from 'styled-components'
import {Theme, ThemeColorToneKey} from '@sanity/ui'

type Props = {
  value: PortableTextChild
  children: JSX.Element
  attributes: RenderAttributes
  hasError: boolean
  onFocus: (path: Path) => void
}

type AnnotationStyleProps = {
  $toneKey?: ThemeColorToneKey
  theme: Theme
}

function annotationStyle(props: AnnotationStyleProps) {
  const {$toneKey, theme} = props
  const borderStyle = $toneKey === 'primary' ? 'solid' : 'dashed'

  return css`
    text-decoration: none;
    display: inline;
    background: ${theme.sanity.color.selectable[$toneKey].enabled.bg};
    border-bottom: 1px ${borderStyle} ${theme.sanity.color.selectable[$toneKey].enabled.fg};
    color: ${theme.sanity.color.selectable[$toneKey].enabled.fg};

    @media (hover: hover) {
      &:hover {
        background: ${theme.sanity.color.selectable[$toneKey].hovered.bg};
        border-color: ${theme.sanity.color.selectable[$toneKey].hovered.fg};
        color: ${theme.sanity.color.selectable[$toneKey].hovered.fg};
      }
    }
  `
}

const Root = styled.div<AnnotationStyleProps>(annotationStyle)

export const Annotation: FunctionComponent<Props> = ({
  children,
  hasError,
  attributes,
  value,
  onFocus,
}) => {
  const {path} = attributes

  const markDefPath = useMemo(() => [...path.slice(0, 1), 'markDefs', {_key: value._key}], [
    path,
    value._key,
  ])

  const handleOnClick = useCallback(
    (event: SyntheticEvent<HTMLSpanElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      onFocus(markDefPath.concat(FOCUS_TERMINATOR))
    },
    [markDefPath, onFocus]
  )

  const isLink = useMemo(() => value?._type === 'link', [value])

  const toneKey = useMemo(() => {
    if (hasError) {
      return 'critical'
    }
    if (isLink) {
      return 'primary'
    }
    return 'default'
  }, [isLink, hasError])

  return (
    <Root onClick={handleOnClick} $toneKey={toneKey}>
      {children}
    </Root>
  )
}
