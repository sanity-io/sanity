import React from 'react'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Inline} from 'slate'
import {BlockContentFeatures, Type, Marker, SlateEditor} from '../typeDefs'
import InvalidValue from '../../InvalidValueInput'
import styles from './styles/Span.css'
import PatchEvent from '../../../PatchEvent'
import {Path} from '../../../typedefs/path'
type Props = {
  attributes: any
  blockContentFeatures: BlockContentFeatures
  editor: SlateEditor
  children: React.ReactNode
  node: Inline
  onPatch: (event: PatchEvent, annotation) => void
  markers: Marker[]
  onFocus: (arg0: Path) => void
  readOnly?: boolean
  type: Type | null
}
type State = {
  focusedAnnotationName: string | null
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
    const {readOnly} = this.props
    this._isMarkingText = true
    setTimeout(() => {
      if (this._clickCounter === 1 && !this._isMarkingText) {
        if (readOnly) {
          this.handleView()
        } else {
          this.startEditing()
        }
      }
      this._clickCounter = 0
    }, 200)
    this._clickCounter++
  }
  handleInvalidValue = (event: PatchEvent) => {
    let _event = event
    const {editor, onPatch} = this.props
    const key = this.getFirstAnnotation()._key
    const parentBlock = editor.value.document.getClosestBlock(this.props.node.key)
    const path = [{_key: parentBlock.key}, 'markDefs', {_key: key}]
    path.reverse().forEach(part => {
      _event = _event.prefixAll(part)
    })
    onPatch(_event, this.getFirstAnnotation())
  }
  startEditing() {
    const {editor, node, onFocus} = this.props
    const block = editor.value.document.getClosestBlock(node.key)
    const focusPath = [
      {_key: block.key},
      'markDefs',
      {
        _key: node.data.get('annotations')[this.state.focusedAnnotationName]._key
      },
      FOCUS_TERMINATOR
    ]
    editor.blur()
    setTimeout(() => {
      onFocus(focusPath)
    }, 100)
  }
  handleView = () => {
    const {editor, node, onFocus} = this.props
    onFocus([
      {_key: editor.value.document.getParent(node.key).key},
      'markDefs',
      {
        _key: node.data.get('annotations')[this.state.focusedAnnotationName]._key
      },
      FOCUS_TERMINATOR
    ])
  }
  handleMouseUp = () => {
    this._isMarkingText = false
  }
  handleInvalidTypeContainerClick = event => {
    event.preventDefault()
    event.stopPropagation()
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
  getFirstAnnotation() {
    const annotations = this.getAnnotations()
    return annotations[Object.keys(annotations)[0]]
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
    if (annotationTypes.length === 0) {
      const firstAnnotation = this.getFirstAnnotation()
      return (
        <span
          {...attributes}
          className={styles.error}
          onClick={this.handleInvalidTypeContainerClick}
          contentEditable={false}
        >
          {children}
          <InvalidValue
            validTypes={blockContentFeatures.annotations.map(a => a.type.name)}
            actualType={firstAnnotation._type}
            value={firstAnnotation}
            onChange={this.handleInvalidValue}
          />
        </span>
      )
    }
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
