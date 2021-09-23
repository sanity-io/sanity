import {
  HotkeyOptions,
  RenderBlockFunction,
  usePortableTextEditor,
  usePortableTextEditorSelection,
  Type,
  PortableTextEditor,
} from '@sanity/portable-text-editor'
import classNames from 'classnames'
import React, {useCallback, useMemo} from 'react'
import {Path, SchemaType} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {resolveInitialValueForType} from '@sanity/initial-value-templates'
import {useToast} from '@sanity/ui'
import ActionMenu from './ActionMenu'
import BlockStyleSelect from './BlockStyleSelect'
import InsertMenu from './InsertMenu'
import {getBlockStyleSelectProps, getInsertMenuItems, getPTEToolbarActionGroups} from './helpers'

import styles from './Toolbar.module.css'

const SLOW_INITIAL_VALUE_LIMIT = 300

const preventDefault = (event) => event.preventDefault()

interface Props {
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  readOnly: boolean
  renderBlock: RenderBlockFunction
  onFocus: (path: Path) => void
}

function PTEToolbar(props: Props) {
  const {hotkeys, isFullscreen, readOnly, onFocus, renderBlock} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const disabled = !selection

  const toast = useToast()

  const resolveInitialValue = useCallback(
    (type: Type) => {
      let isSlow = false
      const slowTimer = setTimeout(() => {
        isSlow = true
        toast.push({
          id: 'resolving-initial-value',
          status: 'info',
          title: 'Resolving initial value…',
        })
      }, SLOW_INITIAL_VALUE_LIMIT)
      return resolveInitialValueForType((type as any) as SchemaType)
        .then((value) => {
          if (isSlow) {
            // I found no way to close an existing toast, so this will replace the message in the
            // "Resolving initial value…"-toast and then make sure it gets closed.
            toast.push({
              id: 'resolving-initial-value',
              status: 'info',
              duration: 500,
              title: 'Initial value resolved',
            })
          }
          return value
        })
        .catch((error) => {
          toast.push({
            title: `Could not resolve initial value`,
            id: 'resolving-initial-value',
            description: `Unable to resolve initial value for type: ${type.name}: ${error.message}.`,
            status: 'error',
          })
          return undefined
        })
        .finally(() => clearTimeout(slowTimer))
    },
    [toast]
  )

  const handleInsertBlock = useCallback(
    async (type: Type) => {
      const initialValue = await resolveInitialValue(type)
      const path = PortableTextEditor.insertBlock(editor, type, initialValue)

      setTimeout(() => onFocus(path.concat(FOCUS_TERMINATOR)), 0)
    },
    [editor, onFocus, resolveInitialValue]
  )

  const handleInsertInline = useCallback(
    async (type: Type) => {
      const initialValue = await resolveInitialValue(type)
      const path = PortableTextEditor.insertChild(editor, type, initialValue)

      setTimeout(() => onFocus(path.concat(FOCUS_TERMINATOR)), 0)
    },
    [editor, onFocus, resolveInitialValue]
  )

  const handleInsertAnnotation = useCallback(
    async (type: Type) => {
      const initialValue = await resolveInitialValue(type)

      const paths = PortableTextEditor.addAnnotation(editor, type, initialValue)
      if (paths && paths.markDefPath) {
        onFocus(paths.markDefPath.concat(FOCUS_TERMINATOR))
      }
    },
    [editor, onFocus, resolveInitialValue]
  )

  const actionGroups = useMemo(
    () =>
      editor ? getPTEToolbarActionGroups(editor, selection, handleInsertAnnotation, hotkeys) : [],
    [editor, selection, handleInsertAnnotation, hotkeys]
  )
  const actionsLen = actionGroups.reduce((acc, x) => acc + x.actions.length, 0)
  const blockStyleSelectProps = editor ? getBlockStyleSelectProps(editor) : null

  const insertMenuItems = React.useMemo(
    () =>
      editor ? getInsertMenuItems(editor, selection, handleInsertBlock, handleInsertInline) : [],
    [editor, handleInsertBlock, handleInsertInline, selection]
  )

  return (
    <div
      className={classNames(styles.root, isFullscreen && styles.fullscreen)}
      // Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={preventDefault}
      onKeyPress={preventDefault}
    >
      {blockStyleSelectProps && blockStyleSelectProps.items.length > 1 && (
        <div className={styles.blockStyleSelectContainer}>
          <BlockStyleSelect
            {...blockStyleSelectProps}
            className={styles.blockStyleSelect}
            disabled={disabled}
            padding="small"
            readOnly={readOnly}
            renderBlock={renderBlock}
          />
        </div>
      )}
      {actionsLen > 0 && (
        <div className={styles.actionMenuContainer}>
          <ActionMenu disabled={disabled} groups={actionGroups} readOnly={readOnly} />
        </div>
      )}
      {insertMenuItems.length > 0 && (
        <div className={styles.insertMenuContainer}>
          <InsertMenu disabled={disabled} items={insertMenuItems} readOnly={readOnly} />
        </div>
      )}
    </div>
  )
}

export default PTEToolbar
