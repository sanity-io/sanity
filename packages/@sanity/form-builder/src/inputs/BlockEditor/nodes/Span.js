// @flow

import type {Node} from 'react'
import React from 'react'
import type {BlockContentFeatures, Type, Marker, Path, SlateEditor} from '../typeDefs'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import styles from './styles/Span.css'
import {Inline} from 'slate'

type Props = {
  attributes: any,
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  children: Node,
  node: Inline,
  markers: Marker[],
  onFocus: Path => void,
  readOnly?: boolean,
  type: ?Type
}

type State = {
  focusedAnnotationName: ?string
}

export default class Span extends React.Component<Props, State> {
  static defaultProps = {
    readOnly: false
  }

  _clickCounter = 0
  _isMarkingText = false

  constructor(props: Props) {
    super(props)
    const focusedAnnotationName = this.props.node.data.get('focusedAnnotationName')
    this.state = {
      focusedAnnotationName: focusedAnnotationName
    }
  }

  getAnnotations() {
    return this.props.node.data.get('annotations')
  }

  focusAnnotation(annotationName: string) {
    const {node, editor} = this.props
    this.setState({focusedAnnotationName: annotationName})
    if (node.data.get('focusedAnnotationName') === annotationName) {
      return
    }
    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: annotationName
    }
    editor.setNodeByKey(node.key, {data})
  }

  // Open dialog when user clicks the node,
  // but don't act on double clicks (mark text as normal)
  handleMouseDown = () => {
    this._isMarkingText = true
    setTimeout(() => {
      if (this._clickCounter === 1 && !this._isMarkingText) {
        this.startEditing()
      }
      this._clickCounter = 0
    }, 200)
    this._clickCounter++
  }

  startEditing() {
    const {editor, node, onFocus} = this.props
    const block = editor.value.document.getClosestBlock(node.key)
    const focusPath = [
      {_key: block.key},
      'markDefs',
      {_key: node.data.get('annotations')[this.state.focusedAnnotationName]._key},
      FOCUS_TERMINATOR
    ]
    editor.blur()
    setTimeout(() => {
      onFocus(focusPath)
    }, 200)
  }

  handleMouseUp = () => {
    this._isMarkingText = false
  }

  handleClick = () => {
    const {type} = this.props
    if (!type) {
      return
    }
    // Don't do anyting if this type doesn't support any annotations.
    if (!type.annotations || type.annotations.length === 0) {
      return
    }
    const annotations = this.getAnnotations()
    // Try to figure out which annotation that should be focused when user clicks the span
    let focusedAnnotationName
    if (type.annotations && type.annotations.length === 1) {
      // Only one annotation type, always focus this one
      focusedAnnotationName = type.annotations[0].name
    } else if (annotations && Object.keys(annotations).length === 1) {
      // Only one annotation value, focus it
      focusedAnnotationName = annotations[Object.keys(annotations)[0]]._type
    }
    if (focusedAnnotationName) {
      this.focusAnnotation(focusedAnnotationName)
    }
    // If no focusedAnnotationName was found, buttons to edit respective annotations will be show
  }

  render() {
    const {attributes, blockContentFeatures, markers} = this.props
    let children = this.props.children
    const annotations = this.getAnnotations()
    const annotationTypes = blockContentFeatures.annotations.filter(item =>
      Object.keys(annotations).includes(item.value)
    )
    annotationTypes.forEach(annotation => {
      const CustomComponent =
        annotation && annotation.blockEditor && annotation.blockEditor.render
          ? annotation.blockEditor.render
          : null
      if (CustomComponent) {
        children = <CustomComponent {...annotations[annotation.value]}>{children}</CustomComponent>
      }
    })
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    return (
      <span
        {...attributes}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        onClick={this.handleClick}
        className={errors.length ? styles.error : styles.valid}
      >
        {children}
      </span>
    )
  }
}
