import React, {forwardRef, useCallback, useImperativeHandle, useRef} from 'react'
import {Box, Button, Flex, Hotkeys, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'

import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {LinkIcon, TextIcon} from '@sanity/icons'
import {decoratorsMap} from '../../../config'
import {AnnotationType, DecoratorType} from './FloatingToolbar'

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
  const decoratorsMenuRef = useRef<HTMLButtonElement | null>(null)
  const annotationsMenuRef = useRef<HTMLButtonElement | null>(null)

  useImperativeHandle(ref, () => ({
    focusFirstButton() {
      if (decoratorsMenuRef.current) {
        decoratorsMenuRef.current.focus()
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
          ref={decoratorsMenuRef}
          __unstable_disableRestoreFocusOnClose
          button={
            <Button
              fontSize={1}
              icon={TextIcon}
              mode={hasActiveDecorators ? 'default' : 'bleed'}
              tone={'primary'}
              title="Text formatting"
            />
          }
          id={'toolbar-buttons-decorators'}
          menu={
            <Menu>
              {decoratorTypes.map((decoratorType) => {
                const DecoratorIcon =
                  (decoratorType.schemaType.icon as React.ComponentType) || TextIcon
                const hotkey = decoratorsMap.find((t) => t.name === decoratorType.schemaType.value)
                  ?.hotkey
                return (
                  <MenuItem
                    key={decoratorType.schemaType.value}
                    data-button-decorator={`${decoratorType.schemaType.value}`}
                    pressed={decoratorType.active}
                    onClick={toggleDecorator}
                    tone={'primary'}
                    alt={`${decoratorType.schemaType.title} - hotkey: ${hotkey || 'N/A'}`}
                  >
                    <Flex justify="flex-start" gap={3} align="center">
                      <Box>
                        <Text size={2}>
                          <DecoratorIcon />
                        </Text>
                      </Box>
                      <Box>
                        <Flex align="center" gap={2} style={{lineHeight: 0}}>
                          <Text size={0}>{decoratorType.schemaType.title}</Text>
                          {hotkey && <Hotkeys fontSize={0} keys={[hotkey]} />}
                        </Flex>
                      </Box>
                    </Flex>
                  </MenuItem>
                )
              })}
            </Menu>
          }
        />
        {/* Annotations */}
        <MenuButton
          __unstable_disableRestoreFocusOnClose
          button={
            <Button
              fontSize={1}
              icon={LinkIcon}
              mode={hasActiveAnnotations ? 'default' : 'bleed'}
              tone={'primary'}
              title="Annotations"
            />
          }
          id={'toolbar-buttons-annotations'}
          menu={
            <Menu>
              {annotationTypes.map((annotationType) => {
                const AnnotationIcon =
                  (annotationType.schemaType.icon as React.ComponentType) || LinkIcon
                return (
                  <MenuItem
                    key={annotationType.schemaType.name}
                    data-button-annotation={`${annotationType.schemaType.name}`}
                    pressed={annotationType.active}
                    onClick={toggleAnnotation}
                    tone={'primary'}
                    alt={`${annotationType.schemaType.title}`}
                  >
                    <Flex justify="flex-start" gap={3} align="center">
                      <Box>
                        <Text size={2}>
                          <AnnotationIcon />
                        </Text>
                      </Box>
                      <Box>
                        <Flex align="center" gap={2} style={{lineHeight: 0}}>
                          <Text size={0}>{annotationType.schemaType.title}</Text>
                        </Flex>
                      </Box>
                    </Flex>
                  </MenuItem>
                )
              })}
            </Menu>
          }
          ref={annotationsMenuRef}
        />
      </Flex>
    </Box>
  )
})
