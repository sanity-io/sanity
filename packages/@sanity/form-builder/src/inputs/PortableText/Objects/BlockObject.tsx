import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Card, Theme} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
import styled, {css} from 'styled-components'
import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {hasFocusWithinPath} from '../../../utils/focusUtils'
import {BlockObjectPreview} from './BlockObjectPreview'

interface BlockObjectProps {
  attributes: RenderAttributes
  blockRef?: React.RefObject<HTMLDivElement>
  editor: PortableTextEditor
  hasError: boolean
  onFocus: (path: Path) => void
  focusPath: Path
  readOnly: boolean
  type: Type
  value: PortableTextBlock
}

const Root = styled(Card)((props: {theme: Theme}) => {
  const {color, radius} = props.theme.sanity

  return css`
    box-shadow: 0 0 0 1px var(--card-border-color);
    border-radius: ${radius[1]}px;

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
})

export function BlockObject(props: BlockObjectProps) {
  const {
    attributes: {focused, selected, path},
    blockRef,
    editor,
    focusPath,
    hasError,
    onFocus,
    readOnly,
    type,
    value,
  } = props
  const elementRef = useRef<HTMLDivElement>()

  useScrollIntoViewOnFocusWithin(elementRef, hasFocusWithinPath(focusPath, value))

  const handleClickToOpen = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (focused) {
        event.preventDefault()
        event.stopPropagation()
        onFocus(path.concat(FOCUS_TERMINATOR))
      } else {
        onFocus(path)
      }
    },
    [focused, onFocus, path]
  )

  const handleEdit = useCallback((): void => {
    onFocus(path.concat(FOCUS_TERMINATOR))
  }, [onFocus, path])

  const handleDelete = useCallback(
    () => (): void => {
      PortableTextEditor.delete(
        editor,
        {focus: {path, offset: 0}, anchor: {path, offset: 0}},
        {mode: 'block'}
      )
      PortableTextEditor.focus(editor)
    },
    [editor, path]
  )

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        value={value}
        readOnly={readOnly}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
      />
    )
  }, [type, value, readOnly, handleDelete, handleEdit])

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (selected || focused) {
      return 'primary'
    }

    return undefined
  }, [focused, hasError, selected])

  const padding = useMemo(() => {
    if (type?.type?.name === 'image') {
      return 0
    }

    return 1
  }, [type])

  return (
    <Root
      data-focused={focused ? '' : undefined}
      data-invalid={hasError ? '' : undefined}
      data-selected={selected ? '' : undefined}
      data-testid="pte-block-object"
      marginY={3}
      onDoubleClick={handleClickToOpen}
      overflow="hidden"
      padding={padding}
      ref={elementRef}
      tone={tone}
    >
      <div ref={blockRef}>{blockPreview}</div>
    </Root>
  )
}
