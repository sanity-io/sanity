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

const denyFocusChange = (event: React.SyntheticEvent<HTMLDivElement>): void => {
  event.preventDefault()
}

interface PTEToolbarProps {
  editor?: PortableTextEditor
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  readOnly: boolean
  renderBlock: RenderBlockFunction
  onFocus: (path: Path) => void
  selection: EditorSelection
}

function PTEToolbar(props: PTEToolbarProps): JSX.Element {
  const {editor, hotkeys, isFullscreen, readOnly, onFocus, renderBlock, selection} = props
  const rootClassNames = classNames(styles.root, isFullscreen && styles.fullscreen)
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
      className={rootClassNames}
      // Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={denyFocusChange}
      onKeyPress={denyFocusChange}
    >
      <div className={styles.blockStyleSelectContainer}>
        {blockStyleSelectProps && (
          <BlockStyleSelect
            {...blockStyleSelectProps}
            className={styles.blockStyleSelect}
            editor={editor}
            padding="small"
            selection={selection}
            readOnly={readOnly}
            renderBlock={renderBlock}
          />
        )}
      </div>
      <div className={styles.actionMenuContainer}>
        <ActionMenu groups={actionGroups} readOnly={readOnly} />
      </div>
      <div className={styles.insertMenuContainer}>
        <InsertMenu items={insertMenuItems} readOnly={readOnly} />
      </div>

      {/* <div className={styles.inner}>
        <PrimaryGroup
          editor={editor}
          hotkeys={hotkeys}
          insertItems={insertItems}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          readOnly={readOnly}
          onFocus={onFocus}
          renderBlock={c}
          selection={selection}
        />
      </div> */}
    </div>
  )
}

export default PTEToolbar
