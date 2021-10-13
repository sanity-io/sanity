/* eslint-disable react/prop-types */
import React, {FunctionComponent, useCallback, useMemo} from 'react'
import {isEqual} from 'lodash'
import {PortableTextChild, Type, RenderAttributes} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import styled, {css} from 'styled-components'
import {Card, Theme} from '@sanity/ui'
import Preview from '../../../Preview'

type Props = {
  value: PortableTextChild
  type: Type
  attributes: RenderAttributes
  readOnly: boolean
  hasError: boolean
  onFocus: (path: Path) => void
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
  hasError,
  onFocus,
  readOnly,
  type,
  value,
}) => {
  const handleOpen = useCallback((): void => {
    if (focused) {
      onFocus(path.concat(FOCUS_TERMINATOR))
    }
  }, [focused, onFocus, path])

  const isEmpty = useMemo(() => !value || isEqual(Object.keys(value), ['_key', '_type']), [value])

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (selected || focused) {
      return 'primary'
    }

    return undefined
  }, [focused, hasError, selected])

  return useMemo(
    () => (
      <Root
        data-focused={focused ? '' : undefined}
        data-invalid={hasError ? '' : undefined}
        data-selected={selected ? '' : undefined}
        tone={tone}
        onClick={handleOpen}
        $readOnly={readOnly}
      >
        <Preview type={type} value={value} layout="inline" />
        {isEmpty && !readOnly && <span>Click to edit</span>}
      </Root>
    ),
    [focused, handleOpen, hasError, isEmpty, readOnly, selected, tone, type, value]
  )
}
