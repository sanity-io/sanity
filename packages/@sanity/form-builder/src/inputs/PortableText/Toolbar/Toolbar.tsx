/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import {
  PortableTextEditor,
  EditorSelection,
  HotkeyOptions,
  RenderBlockFunction
} from '@sanity/portable-text-editor'
import classNames from 'classnames'
import React from 'react'
import {Path} from '../../../typedefs/path'
import ActionMenu from './ActionMenu'
import BlockStyleSelect from './BlockStyleSelect'
import InsertMenu from './InsertMenu'
import {getBlockStyleSelectProps, getInsertMenuItems, getPTEToolbarActionGroups} from './helpers'

import styles from './Toolbar.css'

interface Props {
  editor?: PortableTextEditor
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  readOnly: boolean
  renderBlock: RenderBlockFunction
  onFocus: (path: Path) => void
  selection: EditorSelection
}

function PTEToolbar(props: Props) {
  const {editor, hotkeys, isFullscreen, readOnly, onFocus, renderBlock, selection} = props
  const actionGroups = React.useMemo(
    () => (editor ? getPTEToolbarActionGroups(editor, selection, onFocus, hotkeys) : []),
    [editor, selection, onFocus, hotkeys]
  )
  const blockStyleSelectProps = React.useMemo(
    () => (editor ? getBlockStyleSelectProps(editor) : null),
    [editor]
  )
  const insertMenuItems = React.useMemo(
    () => (editor ? getInsertMenuItems(editor, selection, onFocus) : []),
    [editor]
  )

  if (!editor) return null

  return (
    <div
      className={classNames(styles.root, isFullscreen && styles.fullscreen)}
      // Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={event => event.preventDefault()}
      onKeyPress={event => event.preventDefault()}
    >
      {blockStyleSelectProps && blockStyleSelectProps.items.length > 1 && (
        <div className={styles.blockStyleSelectContainer}>
          <BlockStyleSelect
            {...blockStyleSelectProps}
            className={styles.blockStyleSelect}
            editor={editor}
            padding="small"
            selection={selection}
            readOnly={readOnly}
            renderBlock={renderBlock}
          />
        </div>
      )}
      {insertMenuItems.length > 0 && (
        <div className={styles.insertMenuContainer}>
          <InsertMenu items={insertMenuItems} readOnly={readOnly} />
        </div>
      )}
      <div className={styles.actionMenuContainer}>
        <ActionMenu groups={actionGroups} readOnly={readOnly} />
      </div>
    </div>
  )
}

export default PTEToolbar
