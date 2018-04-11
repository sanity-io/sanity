// @flow
import type {Element as ReactElement} from 'react'
import React from 'react'
import {findDOMNode} from 'slate-react'

import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Portal} from 'part:@sanity/components/utilities/portal'
import StackedEscapable from 'part:@sanity/components/utilities/stacked-escapable'

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
  isActive: boolean,
  focusPath: [],
  toolbarStyle: {},
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
  state = {
    preventScroll: false,
    toolbarStyle: {}
  }

  componentDidMount() {
    this.checkScrollHeight()

    if (this._scrollContainer) {
      this._scrollContainer.addEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillUnmount() {
    if (this._scrollContainer) {
      this._scrollContainer.removeEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      this.checkScrollHeight()
    }
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

  setScrollContainer = element => {
    this._scrollContainer = element
  }

  setEditorWrapper = element => {
    this._editorWrapper = element
  }

  checkScrollHeight = () => {
    if (this._scrollContainer && this._editorWrapper) {
      this.setState({
        preventScroll: this._scrollContainer.offsetHeight < this._editorWrapper.offsetHeight
      })
    }
  }

  handleScroll = event => {
    if (!this.props.fullscreen) {
      this.setState({
        toolbarStyle: {}
      })
    }
    const threshold = 100
    const scrollTop = event.target.scrollTop
    let ratio = scrollTop / threshold
    if (ratio >= 1) {
      ratio = 1
    }
    this.setState({
      toolbarStyle: {
        backgroundColor: `rgba(255, 255, 255, ${ratio * 0.95})`,
        boxShadow: `0 2px ${5 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
      }
    })
  }

  renderEditor() {
    const {
      isActive,
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

    return (
      <div>
        <div className={styles.toolbar}>
          <Toolbar
            blockContentFeatures={blockContentFeatures}
            editorValue={editorValue}
            fullscreen={fullscreen}
            focusPath={focusPath}
            onChange={onChange}
            onFocus={onFocus}
            onToggleFullScreen={onToggleFullScreen}
            style={fullscreen ? this.state.toolbarStyle : {}}
            type={type}
          />
        </div>
        <ActivateOnFocus isActive={!this.state.preventScroll || fullscreen || isActive}>
          <div className={styles.scrollContainer} onScroll={this.handleScroll}>
            <div className={styles.editorWrapper} ref={this.setEditorWrapper}>
              {editor}
            </div>
          </div>
        </ActivateOnFocus>
      </div>
    )
  }

  render() {
    const {focusPath, fullscreen} = this.props
    const isEditingNode = (focusPath || []).length > 1
    return (
      <div className={styles.root}>
        {fullscreen && (
          <StackedEscapable onEscape={this.props.onToggleFullScreen}>
            <Portal>
              <div className={styles.fullscreen}>{this.renderEditor()}</div>
            </Portal>
          </StackedEscapable>
        )}
        {!fullscreen && this.renderEditor()}
        {isEditingNode && this.renderNodeEditor()}
      </div>
    )
  }
}
