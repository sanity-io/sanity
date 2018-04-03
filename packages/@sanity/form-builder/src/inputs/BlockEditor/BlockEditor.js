// @flow
import type {Element as ReactElement} from 'react'
import React from 'react'
import {findDOMNode} from 'slate-react'

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

function findDOMNodeForKey(editorValue, key) {
  return editorValue.document.getDescendant(key)
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

    const editNodeKey = focusInline ? focusInline.key : focusPath[0]._key

    const slateNode = findDOMNodeForKey(editorValue, editNodeKey)

    if (!slateNode) {
      // eslint-disable-next-line no-console
      console.error(new Error(`Could not find node with key ${editNodeKey}`))
      return null
    }
    let value
    let type
    if (slateNode.type === 'contentBlock') {
      return null
    } else if (slateNode.type === 'span') {
      const annotations = slateNode.data.get('annotations')
      const focusedAnnotationName = Object.keys(annotations).find(
        key => annotations[key]._key === focusPath[2]._key
      )
      if (!focusedAnnotationName) {
        return null
      }
      value = annotations[focusedAnnotationName]
      type = blockContentFeatures.annotations.find(an => an.value === focusedAnnotationName).type
      return this.renderEditSpanNode(value, type)
    }
    value = slateNode.data.get('value')
    type = blockContentFeatures.blockObjectTypes.find(obj => obj.name === value._type)
    const isInline = type.options && type.options.inline
    return isInline
      ? this.renderEditInlineObject(value, type, slateNode)
      : this.renderEditBlockObject(value, type, slateNode)
  }

  renderEditInlineNode(value, type, node) {
    const {focusPath, onBlur, onFocus, onPatch} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onPatch}
        onFocus={onFocus}
        path={[{_key: value._key}]}
        type={type}
        value={value}
      />
    )
  }

  renderEditInlineObject(value, type, node) {
    const {focusPath, onBlur, onFocus, onPatch} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onPatch}
        onFocus={onFocus}
        path={[focusPath[0], 'children', {_key: value._key}]}
        type={type}
        value={value}
      />
    )
  }

  renderEditBlockObject(value, type, node) {
    const {focusPath, onBlur, onFocus, onPatch} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onPatch}
        onFocus={onFocus}
        path={[{_key: value._key}]}
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
        path={[focusPath[0], 'markDefs', {_key: value._key}]}
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
      focusPath,
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
          focusPath={focusPath}
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
