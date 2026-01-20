import {PortableTextEditor, usePortableTextEditor, usePortableTextEditorSelection} from '@portabletext/editor'
import {LinkIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {Button, Popover} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useCallback, useEffect, useRef, useState} from 'react'

import {ReleasePickerMenu} from './ReleasePickerMenu'

/**
 * Calculate the end position of the document for inserting content
 */
function getEndPosition(editor: PortableTextEditor): {path: Path; offset: number} | null {
  const value = PortableTextEditor.getValue(editor)
  const lastBlock = value.slice(-1)[0]

  if (!lastBlock || !lastBlock.children) return null

  const lastChild = lastBlock.children.slice(-1)[0]
  if (!lastChild) return null

  return {
    path: [{_key: lastBlock._key}, 'children', {_key: lastChild._key}],
    offset: lastChild.text?.length || 0,
  }
}

interface ReleaseLinkMenuButtonProps {
  selected: boolean
}

export function ReleaseLinkMenuButton(props: ReleaseLinkMenuButtonProps) {
  const {selected} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const [open, setOpen] = useState(false)
  const [insertPosition, setInsertPosition] = useState<{path: Path; offset: number} | null>(null)
  const pendingOpen = useRef(false)

  const handleOpen = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('Opening menu, selection:', selection)

    if (selection) {
      // Editor is focused: capture position and open
      setInsertPosition(selection.focus)
      setOpen(true)
    } else {
      // Editor not focused: focus it first
      pendingOpen.current = true
      PortableTextEditor.focus(editor)
    }
  }, [editor, selection])

  // Effect: Open menu after editor is focused
  useEffect(() => {
    if (pendingOpen.current && selection) {
      // Editor was just focused for the first time - insert at end
      const endPos = getEndPosition(editor)
      setInsertPosition(endPos || selection.focus) // Fallback to selection.focus if can't find end
      setOpen(true)
      pendingOpen.current = false
    }
  }, [selection, editor])

  const handleClose = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('Closing menu')
    setOpen(false)
    setInsertPosition(null)
  }, [])

  const handleSelect = useCallback(
    (releaseId: string) => {
      if (!insertPosition) return

      // Set cursor position
      PortableTextEditor.select(editor, {anchor: insertPosition, focus: insertPosition})

      // Find schema type for releaseReference
      const schemaType = editor.schemaTypes.inlineObjects.find(
        (type) => type.name === 'releaseReference',
      )

      if (!schemaType) {
        // eslint-disable-next-line no-console
        console.error('Schema type "releaseReference" not found')
        handleClose()
        return
      }

      // Insert release reference as inline object
      PortableTextEditor.insertChild(editor, schemaType, {
        _type: 'releaseReference',
        _key: randomKey(12),
        releaseId,
      })

      // Insert space after for easier typing
      PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {
        _type: 'span',
        text: ' ',
      })

      // Focus editor and close menu
      PortableTextEditor.focus(editor)
      handleClose()
    },
    [editor, insertPosition, handleClose],
  )

  return (
    <Popover
      content={<ReleasePickerMenu onSelect={handleSelect} />}
      open={open}
      portal
      placement="bottom-start"
      onClickOutside={handleClose}
    >
      <Button
        mode="bleed"
        icon={LinkIcon}
        title="Link Release"
        fontSize={1}
        padding={2}
        selected={selected || open}
        onClick={handleOpen}
      />
    </Popover>
  )
}
