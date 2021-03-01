/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import {
  HotkeyOptions,
  RenderBlockFunction,
  usePortableTextEditor,
  usePortableTextEditorSelection,
  PortableTextEditor,
} from '@sanity/portable-text-editor'
import classNames from 'classnames'
import React from 'react'
import {Path} from '@sanity/types'
import ActionMenu from './ActionMenu'
import BlockStyleSelect from './BlockStyleSelect'
import InsertMenu from './InsertMenu'
import {getBlockStyleSelectProps, getInsertMenuItems, getPTEToolbarActionGroups} from './helpers'

import styles from './Toolbar.css'

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
  const actionGroups = React.useMemo(
    () => (editor ? getPTEToolbarActionGroups(editor, selection, onFocus, hotkeys) : []),
    [editor, selection, onFocus, hotkeys]
  )
  const actionsLen = actionGroups.reduce((acc, x) => acc + x.actions.length, 0)
  const blockStyleSelectProps = React.useMemo(
    () => (editor ? getBlockStyleSelectProps(editor) : null),
    [selection]
  )
  const insertMenuItems = React.useMemo(
    () => (editor ? getInsertMenuItems(editor, selection, onFocus) : []),
    [selection]
  )

  return (
    <div
      className={classNames(styles.root, isFullscreen && styles.fullscreen)}
      // Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={(event) => event.preventDefault()}
      onKeyPress={(event) => event.preventDefault()}
    >
      {blockStyleSelectProps && blockStyleSelectProps.items.length > 1 && (
        <div className={styles.blockStyleSelectContainer}>
          <BlockStyleSelect
            {...blockStyleSelectProps}
            className={styles.blockStyleSelect}
            disabled={disabled}
            padding="small"
            selection={selection}
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
