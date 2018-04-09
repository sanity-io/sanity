// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange, Marker} from '../typeDefs'
import type {Node} from 'react'

import React from 'react'
import {Inline} from 'slate'

import {applyAll} from '../../../simplePatch'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'

import styles from './styles/Span.css'

function isEmpty(object, ignoreKeys) {
  for (const key in object) {
    if (!ignoreKeys.includes(key)) {
      return false
    }
  }
  return true
}

type Props = {
  attributes: {},
  blockContentFeatures: BlockContentFeatures,
  children: Node,
  editorValue: SlateValue,
  node: Inline,
  markers: Marker[],
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onFormBuilderInputBlur: (nextPath: []) => void,
  onFormBuilderInputFocus: (nextPath: []) => void,
  type: ?Type
}

type State = {
  focusedAnnotationName: ?string,
  isEditing: boolean,
  rootElement: ?HTMLSpanElement
}

export default class Span extends React.Component<Props, State> {
  _clickCounter = 0
  _isMarkingText = false

  constructor(props: Props) {
    super(props)
    const focusedAnnotationName = this.props.node.data.get('focusedAnnotationName')
    this.state = {
      focusedAnnotationName: focusedAnnotationName,
      isEditing: !!focusedAnnotationName
    }
  }

  componentDidUpdate() {
    // Close popover and clean up if it is unnanotated and no annotation type is in focus
    if (this.isUnannotated() && this.state.isEditing && !this.state.focusedAnnotationName) {
      this.handleClose()
    }
  }

  isUnannotated() {
    const annotations = this.getAnnotations()
    if (!annotations) {
      return true
    }
    return (
      !Object.keys(annotations).filter(key => {
        return !this.isEmptyAnnotation(annotations[key])
      }).length === 0
    )
  }

  isEmptyAnnotation = (annotation: {}) => {
    return isEmpty(annotation, ['_type', '_key'])
  }

  getAnnotations() {
    return this.props.node.data.get('annotations')
  }

  handleClose = () => {
    this.garbageCollect()
  }

  garbageCollect() {
    const {editorValue, node, onChange} = this.props
    const nextAnnotations = {...this.getAnnotations()}
    Object.keys(nextAnnotations).forEach(key => {
      if (this.isEmptyAnnotation(nextAnnotations[key])) {
        delete nextAnnotations[key]
      }
    })
    const originalSelection = node.data.get('originalSelection')

    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: undefined,
      annotations: Object.keys(nextAnnotations).length === 0 ? undefined : nextAnnotations
    }
    const change = editorValue.change()
    change.setNodeByKey(node.key, {data})
    if (Object.keys(nextAnnotations).length === 0) {
      change.unwrapInlineByKey(node.key)
      if (originalSelection) {
        change.select(originalSelection)
      }
    }
    change.focus()
    onChange(change)
  }

  focusAnnotation(annotationName: string) {
    const {editorValue, node, onChange} = this.props
    this.setState({focusedAnnotationName: annotationName})
    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: annotationName
    }
    const change = editorValue.change()
    change.setNodeByKey(node.key, {data})
    onChange(change)
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
    const {editorValue, node, onFocus} = this.props
    this.setState({isEditing: true})
    const block = editorValue.document.getClosestBlock(node.key)
    const focusPath = [
      {_key: block.key},
      'markDefs',
      {_key: node.data.get('annotations')[this.state.focusedAnnotationName]._key},
      FOCUS_TERMINATOR
    ]
    onFocus(focusPath)
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

  handleChange = (event: PatchEvent) => {
    const {editorValue, node, onChange} = this.props
    const name = this.state.focusedAnnotationName
    const annotations = this.getAnnotations()
    const nextAnnotations = {
      ...annotations,
      [name]: applyAll(annotations[name], event.patches)
    }
    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: this.state.focusedAnnotationName,
      annotations: nextAnnotations
    }
    const change = editorValue.change()
    change.setNodeByKey(node.key, {data})
    onChange(change)
  }

  render() {
    const {attributes, blockContentFeatures} = this.props
    let children = this.props.children
    if (!this.isUnannotated()) {
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
          children = (
            <CustomComponent {...annotations[annotation.value]}>{children}</CustomComponent>
          )
        }
      })
    }
    return (
      <span
        {...attributes}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        onClick={this.handleClick}
        className={styles.root}
        ref={this.refSpan}
      >
        {children}
      </span>
    )
  }
}
