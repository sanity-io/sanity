/* eslint-disable react/prop-types */
import React, {FunctionComponent, useCallback, useMemo} from 'react'
import {hues} from '@sanity/color'
import {PortableTextChild, Type, RenderAttributes} from '@sanity/portable-text-editor'
import {Marker, Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import styled, {css} from 'styled-components'
import {Box, Card, Theme, Tooltip} from '@sanity/ui'
import Preview from '../../../Preview'
import {Markers} from '../../../legacyParts'
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

function rootStyle({theme}: {theme: Theme}) {
  const {color, radius} = theme.sanity

  return css`
    line-height: 0;
    border-radius: ${radius[2]}px;
    padding: 2px;
    box-shadow: inset 0 0 0 1px var(--card-border-color);
    height: calc(1em - 1px);
    margin-top: 0.0625em;

    &:not([hidden]) {
      display: inline-flex;
      align-items: center;
      vertical-align: top;
    }

    &[data-ready-only] {
      cursor: default;
    }

    &[data-focused] {
      box-shadow: inset 0 0 0 1px ${color.selectable.primary.selected.border};
      color: ${color.selectable.primary.pressed.fg};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.default.hovered.border};
        }
      }
    }

    &[data-markers] {
      --card-bg-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      --card-bg-color: ${color.muted.caution.hovered.bg};

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.muted.caution.hovered.border};
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

const Root = styled(Card)(rootStyle)

const PreviewSpan = styled.span`
  display: block;
  max-width: calc(5em + 80px);
  position: relative;
  z-index: 100;

  & > * {
    user-select: none;
    pointer-events: none;
  }
`

const TooltipBox = styled(Box)`
  max-width: 250px;
`

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

  const hasError = useMemo(
    () =>
      markers.filter((marker) => marker.type === 'validation' && marker.level === 'error').length >
      0,
    [markers]
  )

  const hasWarning = useMemo(
    () =>
      markers.filter((marker) => marker.type === 'validation' && marker.level === 'warning')
        .length > 0,
    [markers]
  )

  const hasMarkers = markers.length > 0

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (hasWarning) {
      return 'caution'
    }

    if (selected || focused) {
      return 'primary'
    }

    return undefined
  }, [focused, hasError, hasWarning, selected])

  const preview = useMemo(
    () => (
      <PreviewSpan>
        <Preview type={type} value={value} fallbackTitle="Click to edit" layout="inline" />
      </PreviewSpan>
    ),
    [type, value]
  )

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 ? (
        <Tooltip
          placement="top"
          portal="editor"
          content={
            <TooltipBox padding={2}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </TooltipBox>
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
        data-warning={hasWarning || undefined}
        data-selected={selected || undefined}
        data-read-only={readOnly || undefined}
        data-markers={hasMarkers || undefined}
        tone={tone}
        onClick={handleOpen}
        forwardedAs="span"
      >
        <span>{markersToolTip || preview}</span>
      </Root>
    ),
    [
      focused,
      handleOpen,
      hasError,
      hasWarning,
      hasMarkers,
      markersToolTip,
      preview,
      readOnly,
      selected,
      tone,
    ]
  )
}
