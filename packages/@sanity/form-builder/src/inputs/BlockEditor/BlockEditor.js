// @flow
import type {Element as ReactElement} from 'react'
import React from 'react'

import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen?'

import EditNode from './EditNode'
import Editor from './Editor'
import Toolbar from './Toolbar/Toolbar'

import styles from './styles/BlockEditor.css'

import type {BlockContentFeatures, SlateChange, SlateValue, Type} from './typeDefs'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: ReactElement<typeof Editor>,
  editorValue: SlateValue,
  fullscreen: boolean,
  focusPath: [],
  onPatch: (event: PatchEvent) => void,
  onChange: (change: SlateChange) => void,
  onBlur: (nextPath: []) => void,
  onFocus: (nextPath: []) => void,
  onToggleFullScreen: void => void,
  type: Type
}

export default class BlockEditor extends React.PureComponent<Props> {
  renderFullScreen() {
    return (
      <FullscreenDialog isOpen onClose={this.props.onToggleFullScreen}>
        {this.renderEditor()}
      </FullscreenDialog>
    )
  }

  renderEditNode() {
    const {editorValue, focusPath, onBlur, onFocus, onPatch, type} = this.props
    const editNodeKey = focusPath[0]._key

    const node = editorValue.document.getDescendant(editNodeKey)
    if (!node) {
      // eslint-disable-next-line no-console
      console.error(new Error(`Could not find node with key ${editNodeKey}`))
      return null
    }
    const nodeValue = node.data.get('value')

    return (
      <EditNode
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onPatch}
        onFocus={onFocus}
        type={type}
        value={nodeValue}
      />
    )
  }

  renderEditor() {
    const {
      blockContentFeatures,
      editorValue,
      editor,
      fullscreen,
      onChange,
      onFocus,
      onToggleFullScreen,
      type
    } = this.props
    const classNames = [styles.editor]
    if (fullscreen) {
      classNames.push(styles.fullscreen)
    }
    return (
      <div className={classNames.join(' ')}>
        <Toolbar
          blockContentFeatures={blockContentFeatures}
          editorValue={editorValue}
          fullscreen={fullscreen}
          onChange={onChange}
          onFocus={onFocus}
          onToggleFullScreen={onToggleFullScreen}
          type={type}
        />
        {editor}
      </div>
    )
  }

  render() {
    const {focusPath, fullscreen} = this.props
    const isExpanded = (focusPath || []).length > 1
    return (
      <div className={styles.root}>
        {fullscreen ? this.renderFullScreen() : this.renderEditor()}
        {isExpanded && this.renderEditNode()}
      </div>
    )
  }
}
