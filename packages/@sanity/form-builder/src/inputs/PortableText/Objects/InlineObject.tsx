/* eslint-disable react/prop-types */
import React, {FunctionComponent, useCallback, useMemo} from 'react'
import {isEqual} from 'lodash'
import {PortableTextChild, Type, RenderAttributes} from '@sanity/portable-text-editor'
import {Marker, Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import styled, {css} from 'styled-components'
import {Card, Stack, Theme, Tooltip} from '@sanity/ui'
import Preview from '../../../Preview'
import Markers from '../legacyParts/Markers'
import {RenderCustomMarkers} from '../types'

type Props = {
  attributes: RenderAttributes
  markers: Marker[]
  onFocus: (path: Path) => void
  readOnly: boolean
  renderCustomMarkers: RenderCustomMarkers
  type: Type
  value: PortableTextChild
}

interface RootCardProps {
  $readOnly: boolean
}

function rootStyle(props: RootCardProps & {theme: Theme}) {
  const {$readOnly, theme} = props
  const {color, radius} = theme.sanity

  return css`
    line-height: 1;
    border-radius: ${radius[2]}px;
    padding: 1px;
    box-sizing: border-box;
    max-width: calc(120px + 7ch);
    cursor: ${$readOnly ? 'default' : undefined};
    box-shadow: 0 0 0 1px var(--card-border-color);

    &[data-focused] {
      box-shadow: 0 0 0 1px ${color.selectable.primary.selected.border};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.default.hovered.border};
        }
      }
    }

    &[data-invalid] {
      --card-bg-color: ${color.input.invalid.enabled.bg};
      --card-border-color: ${color.input.invalid.enabled.border};

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.invalid.hovered.border};
        }
      }
    }
  `
}

const Root = styled(Card)<RootCardProps>(rootStyle)

export const InlineObject: FunctionComponent<Props> = ({
  attributes: {focused, selected, path},
  markers,
  onFocus,
  readOnly,
  renderCustomMarkers,
  type,
  value,
}) => {
  const handleOpen = useCallback((): void => {
    if (focused) {
      onFocus(path.concat(FOCUS_TERMINATOR))
    }
  }, [focused, onFocus, path])

  const isEmpty = useMemo(() => !value || isEqual(Object.keys(value), ['_key', '_type']), [value])
  const hasError = useMemo(
    () =>
      markers.filter((marker) => marker.type === 'validation' && marker.level === 'error').length >
      0,
    [markers]
  )

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (selected || focused) {
      return 'primary'
    }

    return undefined
  }, [focused, hasError, selected])

  const preview = useMemo(
    () => (
      <span>
        <Preview type={type} value={value} layout="inline" />
        {isEmpty && !readOnly && 'Click to edit'}
      </span>
    ),
    [isEmpty, readOnly, type, value]
  )

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 ? (
        <Tooltip
          placement="top"
          portal
          content={
            <Stack space={3} padding={2} style={{maxWidth: 250}}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </Stack>
          }
        >
          {preview}
        </Tooltip>
      ) : undefined,
    [markers, preview, renderCustomMarkers]
  )

  return useMemo(
    () => (
      <Root
        data-focused={focused || undefined}
        data-invalid={hasError || undefined}
        data-selected={selected || undefined}
        tone={tone}
        onClick={handleOpen}
        $readOnly={readOnly}
      >
        {markersToolTip || preview}
      </Root>
    ),
    [focused, handleOpen, hasError, markersToolTip, preview, readOnly, selected, tone]
  )
}
