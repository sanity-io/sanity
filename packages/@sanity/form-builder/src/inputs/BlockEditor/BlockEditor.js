// @flow
import type {Element as ReactElement} from 'react'
import React from 'react'

import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen?'

import {resolveTypeName} from '../../utils/resolveTypeName'

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

  renderNodeEditor() {
    const {blockContentFeatures, editorValue, focusPath} = this.props
    const focusKey = editorValue.selection.focusKey
    const focusInline = editorValue.document.getClosestInline(focusKey)

    let editNodeKey = focusPath[0]._key
    if (focusInline) {
      editNodeKey = focusInline.key
    }
    const node = editorValue.document.getDescendant(editNodeKey)

    if (!node) {
      // eslint-disable-next-line no-console
      console.error(new Error(`Could not find node with key ${editNodeKey}`))
      return null
    }
    let value
    let type
    if (node.type === 'span') {
      const annotations = node.data.get('annotations')
      const focusedAnnotationName = node.data.get('focusedAnnotationName')
      value = annotations[focusedAnnotationName]
      type = blockContentFeatures.annotations.find(an => an.value === focusedAnnotationName).type
    } else {
      value = node.data.get('value')
      type = blockContentFeatures.blockObjectTypes.find(obj => obj.name === value._type)
    }
    return this.renderEditNode(value, type)
  }

  renderEditNode(value, type) {
    const {focusPath, onBlur, onFocus, onPatch} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onPatch}
        onFocus={onFocus}
        type={type}
        value={value}
      />
    )
  }

  renderEditSpanNode(value, type) {
    const {focusPath, onBlur, onFocus, onPatch} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onPatch}
        onFocus={onFocus}
        type={type}
        value={value}
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
    const isEditingNode = (focusPath || []).length > 1
    return (
      <div className={styles.root}>
        {fullscreen ? this.renderFullScreen() : this.renderEditor()}
        {isEditingNode && this.renderNodeEditor()}
      </div>
    )
  }
}
