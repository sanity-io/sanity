import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {CalendarIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {useClickOutsideEvent} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type JSX, useCallback, useEffect, useRef, useState} from 'react'

import {Button, Popover} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {ReleasePickerMenu} from './ReleasePickerMenu'

type InsertPosition = {path: Path; offset: number}

/**
 * Calculate the end position of the document for inserting content
 */
function getEndPosition(editor: PortableTextEditor): InsertPosition | null {
  const value = PortableTextEditor.getValue(editor)
  if (!value) return null

  const lastBlock = value.at(-1)
  if (!lastBlock || !lastBlock.children || !Array.isArray(lastBlock.children)) {
    return null
  }

  const lastChild = lastBlock.children.at(-1)
  if (!lastChild) return null

  const offset =
    '_type' in lastChild && lastChild._type === 'span' && 'text' in lastChild
      ? (lastChild.text?.length ?? 0)
      : 0

  return {
    path: [{_key: lastBlock._key}, 'children', {_key: lastChild._key}],
    offset,
  }
}

interface ReleaseLinkMenuButtonProps {
  selected: boolean
}

export function ReleaseLinkMenuButton(props: ReleaseLinkMenuButtonProps): JSX.Element {
  const {selected} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const [open, setOpen] = useState(false)
  const [insertPosition, setInsertPosition] = useState<InsertPosition | null>(null)
  const pendingOpen = useRef(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const handleClose = useCallback(() => {
    setOpen(false)
    setInsertPosition(null)
  }, [])

  useClickOutsideEvent(handleClose, () => [popoverRef.current, buttonRef.current])

  const handleToggle = useCallback(() => {
    if (open) {
      handleClose()
      return
    }

    if (selection) {
      setInsertPosition(selection.focus)
      setOpen(true)
    } else {
      pendingOpen.current = true
      PortableTextEditor.focus(editor)
    }
  }, [editor, selection, open, handleClose])

  useEffect(() => {
    if (pendingOpen.current && selection) {
      const endPos = getEndPosition(editor)
      setInsertPosition(endPos ?? selection.focus)
      setOpen(true)
      pendingOpen.current = false
    }
  }, [selection, editor])

  const handleSelect = useCallback(
    (releaseId: string) => {
      if (insertPosition === null) return

      PortableTextEditor.select(editor, {anchor: insertPosition, focus: insertPosition})

      const schemaType = editor.schemaTypes.inlineObjects.find(
        (type) => type.name === 'releaseReference',
      )

      if (schemaType === undefined) {
        console.error('Schema type "releaseReference" not found')
        handleClose()
        return
      }

      try {
        PortableTextEditor.insertChild(editor, schemaType, {
          _type: 'releaseReference',
          _key: randomKey(12),
          releaseId,
        })

        PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {
          _type: 'span',
          text: ' ',
        })

        PortableTextEditor.focus(editor)
        handleClose()
      } catch (error) {
        console.error('Failed to insert release reference', error)
        handleClose()
      }
    },
    [editor, insertPosition, handleClose],
  )

  return (
    <Popover
      ref={popoverRef}
      content={<ReleasePickerMenu onSelect={handleSelect} />}
      open={open}
      portal
      placement="bottom-start"
    >
      <Button
        ref={buttonRef}
        mode="bleed"
        icon={CalendarIcon}
        text={t('toolbar.link-release.text')}
        tooltipProps={{content: t('toolbar.link-release.tooltip')}}
        selected={selected || open}
        onClick={handleToggle}
      />
    </Popover>
  )
}
