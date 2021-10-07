import React, {FunctionComponent, useCallback, useMemo} from 'react'
import {PortableTextChild, RenderAttributes} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Path} from '@sanity/types'
import styled, {css} from 'styled-components'
import {Theme, ThemeColorToneKey} from '@sanity/ui'

type Props = {
  attributes: RenderAttributes
  children: JSX.Element
  hasError: boolean
  isEditing: boolean
  onFocus: (path: Path) => void
  value: PortableTextChild
}

type AnnotationStyleProps = {
  isEditing: boolean
  $toneKey?: ThemeColorToneKey
  theme: Theme
}

function annotationStyle(props: AnnotationStyleProps) {
  const {$toneKey, theme, isEditing} = props

  const borderStyle = $toneKey === 'primary' ? 'solid' : 'dashed'
  const toneVariant = isEditing ? 'pressed' : 'enabled'

  return css`
    position: relative; // Must be relative or backwards selections will become flaky for some reason!
    text-decoration: none;
    display: inline;
    background-color: ${theme.sanity.color.selectable[$toneKey][toneVariant].bg};
    border-bottom: 1px ${borderStyle} ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};
    color: ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};

    ${!isEditing &&
    css`
      @media (hover: hover) {
        &:hover {
          background-color: ${theme.sanity.color.selectable[$toneKey].hovered.bg};
          border-color: ${theme.sanity.color.selectable[$toneKey].hovered.fg};
          color: ${theme.sanity.color.selectable[$toneKey].hovered.fg};
        }
      }
    `}
  `
}

const Root = styled.div<AnnotationStyleProps>(annotationStyle)

export const Annotation: FunctionComponent<Props> = ({
  attributes,
  children,
  hasError,
  isEditing,
  onFocus,
  value,
}) => {
  const {path} = attributes

  const markDefPath = useMemo(() => [...path.slice(0, 1), 'markDefs', {_key: value._key}], [
    path,
    value._key,
  ])

  const handleOnClick = useCallback((): void => {
    onFocus(markDefPath.concat(FOCUS_TERMINATOR))
  }, [markDefPath, onFocus])

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
    <Root onClick={handleOnClick} $toneKey={toneKey} isEditing={isEditing}>
      {children}
    </Root>
  )
}
