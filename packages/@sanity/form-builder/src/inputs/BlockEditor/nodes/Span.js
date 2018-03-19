// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange} from '../typeDefs'
import type {Node} from 'react'

import React from 'react'
import {Inline} from 'slate'

import DefaultButton from 'part:@sanity/components/buttons/default'
import Popover from 'part:@sanity/components/dialogs/popover'

import PatchEvent from '../../../PatchEvent'
import {applyAll} from '../../../simplePatch'

import {removeSpan} from '../utils/changes'

import {FormBuilderInput} from '../../../FormBuilderInput'

import StopPropagation from '../StopPropagation'

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
  onChange: (change: SlateChange) => void,
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
      isEditing: !!focusedAnnotationName,
      focusedAnnotationName: focusedAnnotationName,
      rootElement: null
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const {editorValue} = nextProps
    return (
      nextState.isEditing !== this.state.isEditing ||
      nextState.focusedAnnotationName !== this.state.focusedAnnotationName ||
      nextState.rootElement !== this.state.rootElement ||
      editorValue.focusOffset !== this.props.editorValue.focusOffset ||
      nextProps.node.data !== this.props.node.data
    )
  }

  componentWillUpdate(nextProps: Props, nextState: State) {
    // If annotations where emptied, just destroy this span (unwrap it to text)
    if (!nextProps.node.data.get('annotations')) {
      this.destroy()
    }
  }

  componentDidUpdate() {
    // Close popover and clean up if it is unnanotated and no annotation type is in focus
    if (this.isUnannotated() && this.state.isEditing && !this.state.focusedAnnotationName) {
      this.handleCloseInput()
    }
  }

  destroy = () => {
    const {editorValue, onChange} = this.props
    const change = editorValue.change()
    change.call(removeSpan, this.props.node)
    onChange(change)
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

  handleCloseInput = () => {
    if (this.state.isEditing) {
      this.setState({isEditing: false, focusedAnnotationName: undefined})
    }
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
        this.setState({isEditing: true})
      }
      this._clickCounter = 0
    }, 350)
    this._clickCounter++
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

  renderFormBuilderInput() {
    const {onFormBuilderInputBlur, onFormBuilderInputFocus} = this.props
    const annotations = this.getAnnotations()
    if (!this.props.type) {
      return null
    }
    const annotationTypes = this.props.type.annotations
    const {focusedAnnotationName, rootElement} = this.state

    const annotationTypeInFocus =
      annotationTypes &&
      annotationTypes.find(type => {
        return type.name === focusedAnnotationName
      })
    const focusedAnnotationKey = Object.keys(annotations).find(key => {
      return annotations[key]._type === focusedAnnotationName
    })
    const annotationValue = focusedAnnotationKey && annotations && annotations[focusedAnnotationKey]

    const style = {}
    if (rootElement) {
      const {width} = rootElement.getBoundingClientRect()
      style.marginLeft = `-${width / 2}px`
    }

    return (
      <span className={styles.editAnnotationContainer} style={style}>
        <Popover
          onClose={this.handleCloseInput}
          onEscape={this.handleCloseInput}
          onClickOutside={this.handleCloseInput}
          modifiers={{
            flip: {
              boundariesElement: 'scrollParent'
            },
            preventOverflow: {
              boundariesElement: 'scrollParent'
            }
          }}
        >
          {/* Buttons for selecting annotation when there are several, and none is focused  */}
          {!focusedAnnotationName &&
            Object.keys(annotations).length > 1 && (
              <div>
                <h3>Which annotation?</h3>
                {Object.keys(annotations).map(annotationKey => {
                  if (!annotations[annotationKey]) {
                    return null
                  }
                  const setFieldFunc = () => {
                    this.focusAnnotation(annotations[annotationKey]._type)
                  }
                  const annotationType =
                    annotationTypes &&
                    annotationTypes.find(type => type.name === annotations[annotationKey]._type)

                  return (
                    <DefaultButton key={`annotationButton${annotationKey}`} onClick={setFieldFunc}>
                      {annotationType ? annotationType.title : null}
                    </DefaultButton>
                  )
                })}
              </div>
            )}
          {/* Render input for focused annotation  */}
          {focusedAnnotationName && (
            <div>
              <FormBuilderInput
                value={annotationValue}
                type={annotationTypeInFocus}
                level={0}
                onBlur={onFormBuilderInputBlur}
                onFocus={onFormBuilderInputFocus}
                onChange={this.handleChange}
              />
            </div>
          )}
        </Popover>
      </span>
    )
  }

  refSpan = (span: ?HTMLSpanElement) => {
    this.setState({rootElement: span})
  }

  render() {
    const {isEditing} = this.state
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

        {isEditing && (
          <StopPropagation tagName="span">{this.renderFormBuilderInput()}</StopPropagation>
        )}
      </span>
    )
  }
}
