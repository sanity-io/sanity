import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Popover, PortalProvider, useGlobalKeyDown} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {BlockDecoratorDefinition, ObjectSchemaType} from '@sanity/types'
import {useCursorElement} from '../useCursorElement'
import {useCommentInput} from '../useCommentInput'
import {ToolbarButtons} from './ToolbarButtons'

const EMPTY_ARRAY: any[] = []

export const ToolbarPopover = styled(Popover)(({theme}) => {
  const {space, radius} = theme.sanity

  return css`
    &[data-placement='bottom'] {
      transform: translateY(${space[1]}px);
    }

    &[data-placement='top'] {
      transform: translateY(-${space[1]}px);
    }

    [data-ui='Popover__wrapper'] {
      border-radius: ${radius[3]}px;
      display: flex;
      flex-direction: column;
      overflow: clip;
      overflow: hidden;
      position: relative;
    }
  `
})

interface FloatingToolbarProps {
  rootElement: HTMLElement | null
}

export type DecoratorType = {active: boolean; schemaType: BlockDecoratorDefinition}
export type AnnotationType = {active: boolean; schemaType: ObjectSchemaType}

export function FloatingToolbar({rootElement}: FloatingToolbarProps) {
  const buttonsRef = useRef<{focusFirstButton: () => void} | null>(null)

  const {focused, toolbarMenuOpen, openToolbarMenu, closeToolbarMenu, readOnly} = useCommentInput()
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const cursorElement = useCursorElement({
    disabled: ({selectionType}) => {
      if (readOnly) {
        return true
      }
      if (selectionType === 'collapsed') {
        closeToolbarMenu()
        return true
      }
      openToolbarMenu()
      return false
    },
    rootElement: rootElement,
  })

  const annotationTypes: AnnotationType[] = useMemo(
    () =>
      (toolbarMenuOpen &&
        editor.schemaTypes.annotations.map((annotation) => {
          return {
            schemaType: annotation,
            active: !!(
              selection &&
              PortableTextEditor.activeAnnotations(editor).find(
                // eslint-disable-next-line max-nested-callbacks
                (a) => a._type === annotation.name,
              )
            ),
          }
        })) ||
      EMPTY_ARRAY,
    [editor, selection, toolbarMenuOpen],
  )
  const decoratorTypes: DecoratorType[] = useMemo(
    () =>
      (toolbarMenuOpen &&
        editor.schemaTypes.decorators.map((decorator) => {
          return {
            schemaType: decorator,
            active: !!(selection && PortableTextEditor.isMarkActive(editor, decorator.value)),
          }
        })) ||
      EMPTY_ARRAY,
    [editor, toolbarMenuOpen, selection],
  )

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!open) {
          return
        }
        // Force focus on the first button
        // when the user is pressing tab
        if (event.key === 'Tab') {
          if (buttonsRef.current && focused) {
            event.preventDefault()
            event.stopPropagation()
            buttonsRef.current.focusFirstButton()
          }
        }
        if (event.key === 'Escape') {
          closeToolbarMenu()
        }
      },
      [focused, closeToolbarMenu],
    ),
  )

  const preventTakingFocus = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <PortalProvider element={rootElement}>
      <div onMouseDown={preventTakingFocus}>
        <ToolbarPopover
          constrainSize
          content={
            <ToolbarButtons
              ref={buttonsRef}
              onClose={closeToolbarMenu}
              annotationTypes={annotationTypes}
              decoratorTypes={decoratorTypes}
            />
          }
          fallbackPlacements={['bottom', 'top']}
          open={toolbarMenuOpen}
          placement="bottom"
          referenceElement={cursorElement}
        />
      </div>
    </PortalProvider>
  )
}
