import React, {useCallback, useMemo, useRef} from 'react'
import {Box, Popover, PortalProvider, useGlobalKeyDown} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {BlockDecoratorDefinition, ObjectSchemaType} from '@sanity/types'
import {useScratchPad} from '../../../hooks/useScratchPad'
import {ToolbarButtons} from './ToolbarButtons'
import {useCursorElement} from 'sanity'

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

  const {editorFocused, editorToolbarMenuOpen, openEditorToolbarMenu, closeEditorToolbarMenu} =
    useScratchPad()
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const cursorElement = useCursorElement({
    disabled: ({selectionType}) => {
      if (selectionType === 'collapsed') {
        closeEditorToolbarMenu()
        return true
      }
      openEditorToolbarMenu()
      return false
    },
    rootElement: rootElement,
  })

  const decoratorTypes: DecoratorType[] = useMemo(
    () =>
      (editorToolbarMenuOpen &&
        editor.schemaTypes.decorators.map((decorator) => {
          const active = !!(selection && PortableTextEditor.isMarkActive(editor, decorator.value))
          return {
            schemaType: decorator,
            active,
          }
        })) ||
      EMPTY_ARRAY,
    [editor, editorToolbarMenuOpen, selection],
  )

  const annotationTypes: AnnotationType[] = useMemo(
    () =>
      (editorToolbarMenuOpen &&
        editor.schemaTypes.annotations.map((annotation) => {
          const active = !!(
            selection &&
            PortableTextEditor.activeAnnotations(editor).find((a) => a._type === annotation.name)
          )
          return {
            schemaType: annotation,
            active,
          }
        })) ||
      EMPTY_ARRAY,
    [editor, selection, editorToolbarMenuOpen],
  )

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!editorToolbarMenuOpen) {
          return
        }
        // Force focus on the first button
        // when the user is pressing tab
        if (event.key === 'Tab') {
          if (buttonsRef.current && editorFocused) {
            event.preventDefault()
            event.stopPropagation()
            buttonsRef.current.focusFirstButton()
          }
        }
        if (event.key === 'Escape') {
          closeEditorToolbarMenu()
        }
      },
      [editorToolbarMenuOpen, editorFocused, closeEditorToolbarMenu],
    ),
  )

  const preventTakingFocus = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <PortalProvider element={rootElement}>
      <Box onMouseDown={preventTakingFocus}>
        <ToolbarPopover
          content={
            <ToolbarButtons
              ref={buttonsRef}
              onClose={closeEditorToolbarMenu}
              annotationTypes={annotationTypes}
              decoratorTypes={decoratorTypes}
            />
          }
          fallbackPlacements={['bottom', 'top']}
          open={editorToolbarMenuOpen}
          placement="bottom"
          referenceElement={cursorElement}
        />
      </Box>
    </PortalProvider>
  )
}
