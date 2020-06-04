import {
  PortableTextEditor,
  EditorSelection,
  HotkeyOptions,
  RenderBlockFunction
} from '@sanity/portable-text-editor'
import classNames from 'classnames'
import {uniq} from 'lodash'
import React from 'react'
import {Path} from '../../../typedefs/path'
import PrimaryGroup from './PrimaryGroup'

import styles from './Toolbar.css'

const BREAKPOINT_SCREEN_MEDIUM = 512

const denyFocusChange = (event: React.SyntheticEvent<HTMLDivElement>): void => {
  event.preventDefault()
}

interface PTEToolbarProps {
  editor: PortableTextEditor
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  isReadOnly: boolean
  renderBlock: RenderBlockFunction
  onFocus: (path: Path) => void
  selection: EditorSelection
}

function PTEToolbar(props: PTEToolbarProps): JSX.Element {
  const {editor, hotkeys, isFullscreen, isReadOnly, onFocus, renderBlock, selection} = props
  const [isMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT_SCREEN_MEDIUM : true
  )

  // NOTE: do not use any hooks afer this point
  if (!editor) return null

  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const insertItems = uniq(features.types.inlineObjects.concat(features.types.blockObjects))
  const rootClassNames = classNames(styles.root, isFullscreen && styles.fullscreen)

  return (
    <div
      className={rootClassNames}
      // Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={denyFocusChange}
      onKeyPress={denyFocusChange}
    >
      <div className={styles.inner}>
        <PrimaryGroup
          editor={editor}
          hotkeys={hotkeys}
          insertItems={insertItems}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          isReadOnly={isReadOnly}
          onFocus={onFocus}
          renderBlock={renderBlock}
          selection={selection}
        />
      </div>
    </div>
  )
}

export default PTEToolbar
