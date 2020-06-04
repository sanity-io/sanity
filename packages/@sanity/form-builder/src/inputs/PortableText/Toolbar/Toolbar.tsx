/* eslint-disable complexity */

import classNames from 'classnames'
import React from 'react'
import {uniq} from 'lodash'
import {Path} from '../../../typedefs/path'
import PrimaryGroup from './PrimaryGroup'
import styles from './Toolbar.css'
import {
  PortableTextEditor,
  EditorSelection,
  HotkeyOptions,
  RenderBlockFunction
} from '@sanity/portable-text-editor'

const BREAKPOINT_SCREEN_MEDIUM = 512

const denyFocusChange = (event: React.SyntheticEvent<HTMLDivElement>): void => {
  event.preventDefault()
}

type Props = {
  editor: PortableTextEditor
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  isReadOnly: boolean
  renderBlock: RenderBlockFunction
  onFocus: (path: Path) => void
  selection: EditorSelection
}

type ToolbarState = {
  isMobile: boolean
}

export default class Toolbar extends React.Component<Props, ToolbarState> {
  state = {
    isMobile: false
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      isMobile: typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT_SCREEN_MEDIUM : true
    }
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    return this.props.selection !== nextProps.selection || this.props.editor !== nextProps.editor
  }

  render(): JSX.Element {
    const {editor, hotkeys, isFullscreen, isReadOnly, onFocus, renderBlock, selection} = this.props
    if (!editor) {
      return null
    }
    const {isMobile} = this.state
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const insertItems = uniq(ptFeatures.types.inlineObjects.concat(ptFeatures.types.blockObjects))
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
}
