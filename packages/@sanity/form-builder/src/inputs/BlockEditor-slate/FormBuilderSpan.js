import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

import DefaultButton from 'part:@sanity/components/buttons/default'
import Popover from 'part:@sanity/components/dialogs/popover'
import {FormBuilderInput} from '../../FormBuilderInput'
import styles from './styles/FormBuilderSpan.css'
import {applyAll} from '../../simplePatch'

function isEmpty(object, ignoreKeys) {
  for (const key in object) {
    if (!ignoreKeys.includes(key)) {
      return false
    }
  }
  return true
}

export default class FormBuilderSpan extends React.Component {
  static propTypes = {
    type: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object,
    children: PropTypes.node,
    node: PropTypes.object
  }

  state = {isEditing: false, focusedAnnotationName: undefined}

  _clickCounter = 0
  _isMarkingText = false
  _editorNodeRect = null

  componentWillMount() {
    this.setState({
      isEditing: false,
      focusedAnnotationName: this.props.node.data && this.props.node.data.get('focusedAnnotationName')
    })
  }

  componentDidMount() {
    this._editorNodeRect = ReactDOM.findDOMNode(this.props.editor).getBoundingClientRect()
    if (this.state.focusedAnnotationName) {
      this.setState({isEditing: true})
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.isEditing !== this.state.isEditing
      || nextState.rootElement !== this.state.rootElement
      || nextState.focusedAnnotationName !== this.state.focusedAnnotationName
      || nextProps.state.focusOffset !== this.props.state.focusOffset
      || nextProps.node.data !== this.props.node.data
  }

  componentWillUpdate(nextProps, nextState) {
    // If annotations where emptied, just destroy this span (unwrap it to text actually)
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
    this.props.editor.props.blockEditor
      .operations
      .removeSpan(this.props.node)
  }

  isUnannotated() {
    const annotations = this.getAnnotations()
    if (!annotations) {
      return true
    }
    return !Object.keys(annotations).filter(key => {
      return !this.isEmptyAnnotation(annotations[key])
    }).length === 0
  }

  isEmptyAnnotation = annotation => {
    return isEmpty(annotation, ['_type', '_key'])
  }

  getAnnotations() {
    return this.props.node.data.get('annotations')
  }

  handleCloseInput = () => {
    this.props.editor.focus()
    if (this.state.isEditing) {
      this.setState({isEditing: false, focusedAnnotationName: undefined})
    }
    this.garbageCollect()
  }

  garbageCollect() {
    let nextAnnotations = {...this.getAnnotations()}
    Object.keys(nextAnnotations).forEach(key => {
      if (this.isEmptyAnnotation(nextAnnotations[key])) {
        delete nextAnnotations[key]
      }
    })
    const {editor, node} = this.props
    if (Object.keys(nextAnnotations).length === 0) {
      nextAnnotations = undefined
    }
    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: undefined,
      annotations: nextAnnotations
    }
    const change = editor.getState()
      .change()
      .setNodeByKey(node.key, {data})

    editor.onChange(change)
  }

  focusAnnotation(annotationName) {
    const {editor, node} = this.props
    this.setState({focusedAnnotationName: annotationName})
    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: annotationName
    }
    const change = editor.getState()
      .change()
      .setNodeByKey(node.key, {data})
    editor.onChange(change)
  }

  // Open dialog when user clicks the node,
  // but support double clicks, and mark text as normal
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

  handleNodeClick = () => {
    const annotations = this.getAnnotations()
    // Don't do anyting if this type doesn't have annotations.
    if (this.props.type.annotations.length === 0) {
      return
    }
    // Try to figure out which annotation that should be focused when user clicks the span
    let focusedAnnotationName
    if (this.props.type.annotations.length === 1) { // Only one annotation type, always focus this one
      focusedAnnotationName = this.props.type.annotations[0].name
    } else if (annotations && Object.keys(annotations).length === 1) { // Only one annotation value, focus it
      focusedAnnotationName = annotations[Object.keys(annotations)[0]]._type
    }
    if (focusedAnnotationName) {
      this.focusAnnotation(focusedAnnotationName)
    }
    // If no focusedAnnotationName was found, buttons to edit respective annotations will be show
  }

  handleAnnotationChange = event => {
    const name = this.state.focusedAnnotationName
    const annotations = this.getAnnotations()
    const nextAnnotations = {
      ...annotations,
      [name]: applyAll(annotations[name], event.patches)
    }
    Object.keys(nextAnnotations).forEach(key => {
      if (nextAnnotations[key] === undefined) {
        delete nextAnnotations[key]
      }
    })
    const {node, editor} = this.props
    const data = {
      ...node.data.toObject(),
      focusedAnnotationName: this.state.focusedAnnotationName,
      annotations: nextAnnotations
    }
    const change = editor.getState()
      .change()
      .setNodeByKey(node.key, {data})
    editor.onChange(change)
  }

  renderInput() {
    const annotations = this.getAnnotations()
    const annotationTypes = this.props.type.annotations
    const {focusedAnnotationName} = this.state

    const annotationTypeInFocus = annotationTypes.find(type => {
      return type.name === focusedAnnotationName
    })
    const focusedAnnotationKey = Object.keys(annotations).find(key => {
      return annotations[key]._type === focusedAnnotationName
    })
    const annotationValue = focusedAnnotationKey && annotations && annotations[focusedAnnotationKey]
    return (
      <span className={styles.editSpanContainer}>
        <Popover
          onClose={this.handleCloseInput}
          modifiers={
            {
              flip: {
                boundariesElement: 'scrollParent'
              },
              preventOverflow: {
                boundariesElement: 'scrollParent'
              }
            }
          }
        >
          { /* Buttons for selecting annotation when there are several, and none is focused  */ }
          { !focusedAnnotationName && Object.keys(annotations).length > 1 && (
            <div>
              <h3>Which annotation?</h3>
              {
                Object.keys(annotations).map(annotationKey => {
                  if (!annotations[annotationKey]) {
                    return null
                  }
                  const setFieldFunc = () => {
                    this.focusAnnotation(annotations[annotationKey]._type)
                  }
                  return (
                    <DefaultButton
                      key={`annotationButton${annotationKey}`}
                      onClick={setFieldFunc}
                    >
                      {annotationTypes.find(type => type.name === annotations[annotationKey]._type).title}
                    </DefaultButton>
                  )
                })
              }
            </div>
          )}

          { /* Render input for focused annotation  */ }
          { focusedAnnotationName && (
            <div>
              <FormBuilderInput
                value={annotationValue}
                type={annotationTypeInFocus}
                level={0}
                onChange={this.handleAnnotationChange}
                autoFocus
              />
            </div>
          )}
        </Popover>
      </span>
    )
  }

  setRootElement = element => {
    this.setState({rootElement: element})
  }

  render() {
    const {isEditing} = this.state
    const {attributes} = this.props
    return (
      <span
        {...attributes}
        className={styles.root}
        ref={this.setRootElement}
      >
        <span
          onClick={this.handleNodeClick}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
        >
          {this.props.children}
        </span>

        { isEditing && this.renderInput() }

      </span>
    )
  }
}
