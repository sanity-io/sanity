import React, {FunctionComponent, useCallback, useMemo, useRef} from 'react'
import {PortableTextChild, RenderAttributes} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Marker, Path} from '@sanity/types'
import styled, {css} from 'styled-components'
import {Theme, ThemeColorToneKey, Tooltip, Stack} from '@sanity/ui'
import Markers from '../legacyParts/Markers'
import {RenderCustomMarkers} from '../types'
import {hues} from '@sanity/color'

type Props = {
  attributes: RenderAttributes
  children: JSX.Element
  hasError: boolean
  isEditing: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers: RenderCustomMarkers
  value: PortableTextChild
}

type AnnotationStyleProps = {
  isEditing: boolean
  $toneKey?: ThemeColorToneKey
  theme: Theme
}

function annotationStyle(props: AnnotationStyleProps) {
  const {$toneKey, theme, isEditing} = props

  const toneVariant = isEditing ? 'pressed' : 'enabled'

  return css`
    text-decoration: none;
    display: inline;
    background-color: ${theme.sanity.color.selectable[$toneKey][toneVariant].bg};
    border-bottom: 1px dashed ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};
    color: ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};

    &[data-link] {
      border-bottom: 1px solid ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};
    }

    &[data-markers] {
      background-color: ${theme.sanity.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-error] {
      background-color: ${theme.sanity.color.muted.critical.hovered.bg};
    }

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

const TooltipStack = styled(Stack)`
  max-width: 250px;
`

const Root = styled.div<AnnotationStyleProps>(annotationStyle)

export const Annotation: FunctionComponent<Props> = ({
  attributes,
  children,
  hasError,
  isEditing,
  markers,
  onFocus,
  renderCustomMarkers,
  value,
}) => {
  const {path} = attributes
  const annotationRef = useRef()

  const markDefPath = useMemo(() => [...path.slice(0, 1), 'markDefs', {_key: value._key}], [
    path,
    value._key,
  ])

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 ? (
        <Tooltip
          placement="top"
          boundaryElement={annotationRef.current}
          portal
          content={
            <TooltipStack space={3} padding={2}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </TooltipStack>
          }
        >
          <span>{children}</span>
        </Tooltip>
      ) : undefined,
    [children, markers, renderCustomMarkers]
  )

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
    <Root
      onDoubleClick={handleOnClick}
      $toneKey={toneKey}
      isEditing={isEditing}
      ref={annotationRef}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-markers={markers.length > 0 ? '' : undefined}
    >
      {markersToolTip || children}
    </Root>
  )
}
