import React, {forwardRef, useCallback, useImperativeHandle, useRef} from 'react'
import {Box, Button, Flex, Menu, MenuButton, MenuItem, PortalProvider} from '@sanity/ui'

import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {BoldIcon, LinkIcon, TextIcon} from '@sanity/icons'
import {useCommentInput} from '../useCommentInput'
import {AnnotationType, DecoratorType, ToolbarPopover} from './FloatingToolbar'
import {LinkEditForm} from './LinkEditForm'

interface ToolbarButtonProps {
  annotationTypes: AnnotationType[]
  decoratorTypes: DecoratorType[]
  onClose: () => void
}

export const ToolbarButtons = forwardRef(function ToolbarButtons(
  props: ToolbarButtonProps,
  ref: React.ForwardedRef<{focusFirstButton: () => void}>,
) {
  const {annotationTypes, decoratorTypes, onClose} = props
  const editor = usePortableTextEditor()
  const firstButtonRef = useRef<HTMLButtonElement | null>(null)
  const annotationsMenuRef = useRef<HTMLButtonElement | null>(null)
  const {focusEditor} = useCommentInput()

  useImperativeHandle(ref, () => ({
    focusFirstButton() {
      if (firstButtonRef.current) {
        firstButtonRef.current.focus()
      }
    },
  }))

  const toggleAnnotation = useCallback(
    (event: React.MouseEvent<Element> | React.KeyboardEvent<Element>) => {
      const annotationName = event.currentTarget.getAttribute('data-button-annotation')
      const schemaType = editor.schemaTypes.annotations.find((t) => t.name === annotationName)
      if (!schemaType) {
        throw Error(`Schema type not found for ${annotationName}`)
      }
      if (
        annotationTypes.some(
          (annotation) => !annotation.active && annotation.schemaType.name === schemaType.name,
        )
      ) {
        PortableTextEditor.addAnnotation(editor, schemaType)
      } else {
        PortableTextEditor.removeAnnotation(editor, schemaType)
      }
    },
    [editor, annotationTypes],
  )

  const toggleDecorator = useCallback(
    (event: React.MouseEvent<Element> | React.KeyboardEvent<Element>) => {
      const mark = event.currentTarget.getAttribute('data-button-decorator')
      if (mark) {
        PortableTextEditor.toggleMark(editor, mark)
        PortableTextEditor.focus(editor)
      }
    },
    [editor],
  )

  const hasActiveDecorators = decoratorTypes.some((decorator) => decorator.active)
  const hasActiveAnnotations = annotationTypes.some((annotation) => annotation.active)

  return (
    <Box padding={1}>
      <Flex justify="space-evenly" gap={2}>
        {/* Decorators */}
        <MenuButton
          ref={firstButtonRef}
          __unstable_disableRestoreFocusOnClose
          button={
            <Button
              fontSize={2}
              icon={TextIcon}
              mode={hasActiveDecorators ? 'default' : 'bleed'}
              tone={'primary'}
            />
          }
          id={''}
          menu={
            <Menu>
              {decoratorTypes.map((decoratorType) => (
                <MenuItem
                  data-button-decorator={`${decoratorType.schemaType.value}`}
                  fontSize={2}
                  icon={decoratorType.schemaType.icon}
                  key={decoratorType.schemaType.value}
                  pressed={decoratorType.active}
                  onClick={toggleDecorator}
                  tone={'primary'}
                />
              ))}
            </Menu>
          }
        />
        {/* Annotations */}
        {annotationTypes.map((annotationType) => (
          <MenuButton
            __unstable_disableRestoreFocusOnClose
            key={annotationType.schemaType.name}
            ref={annotationsMenuRef}
            button={
              <Button
                data-button-annotation={`${annotationType.schemaType.name}`}
                fontSize={2}
                icon={annotationType.schemaType.icon}
                key={annotationType.schemaType.name}
                mode={hasActiveAnnotations ? 'default' : 'bleed'}
                tone={'primary'}
              />
            }
            id={''}
            menu={<LinkEditForm />}
          />
        ))}
      </Flex>
    </Box>
  )
})
