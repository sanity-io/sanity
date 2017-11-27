// @flow
import React from 'react'
import type {Path} from './typedefs/path'
import PatchEvent from './PatchEvent'
import generateHelpUrl from '@sanity/generate-help-url'
import type {Type} from '../../schema/src/sanity/typedefs'
import * as PathUtils from './utils/pathUtils'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'

type Props = {
  value: any,
  type: Type,
  onChange: PatchEvent => void,
  onFocus: Path => void,
  onBlur: () => void,
  focusPath: Path,
  level: number,
  isRoot: boolean,
  path: Array<PathSegment>
}

const ENABLE_CONTEXT = () => {}

export const FormBuilderInput = class FormBuilderInput extends React.PureComponent<Props> {
  _element: ?HTMLDivElement

  static contextTypes = {
    formBuilder: ENABLE_CONTEXT,
    getValuePath: ENABLE_CONTEXT
  }

  static childContextTypes = {
    getValuePath: ENABLE_CONTEXT
  }

  static defaultProps = {
    focusPath: [],
    path: []
  }

  _input: ?FormBuilderInput

  getValuePath = () => {
    return this.context.getValuePath().concat(this.props.path)
  }

  getChildContext() {
    return {
      getValuePath: this.getValuePath
    }
  }

  componentDidMount() {
    const {focusPath, path} = this.props
    if (PathUtils.hasFocus(focusPath, path)) {
      this.focus()
    }
  }

  componentDidUpdate(prevProps) {
    const hadFocus = PathUtils.hasFocus(prevProps.focusPath, prevProps.path)
    const hasFocus = PathUtils.hasFocus(this.props.focusPath, this.props.path)
    if (!hadFocus && hasFocus) {
      this.focus()
    }
  }

  resolveInputComponent(type: Type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  setInput = (component: ?FormBuilderInput) => {
    this._input = component
  }

  focus() {
    if (!this._input) {
      // should never happen
      throw new Error('Attempted to set focus on a missing input component')
    }
    if (typeof this._input.focus !== 'function') {
      const inputComponent = this.resolveInputComponent(this.props.type)
      console.warn(
        'Encountered an input component without a required ".focus()" method. Please check the implementation of %s. Read more at %s',
        inputComponent.name || inputComponent.displayName,
        generateHelpUrl('input-component-missing-required-method')
      )
    } else {
      console.log('COMMIT FOCUS: ', this.props.path)
      this._input.focus()
      // scrollIntoViewIfNeeded(this._element, {
      //   duration: 200,
      //   offset: {bottom: 200}
      // })
    }
  }

  handleChange = patchEvent => {
    const {type, onChange} = this.props
    if (type.readOnly) {
      return
    }
    onChange(patchEvent)
  }

  handleFocus = nextPath => {
    const {path, type, onFocus, focusPath} = this.props
    if (!onFocus) {
      console.warn(
        'FormBuilderInput was used without passing an onFocus handler. Read more at %s',
        generateHelpUrl('input-component-missing-required-method')
      )
      return
    }

    const nextFocusPath = Array.isArray(nextPath) ? [...path, ...nextPath] : path

    const InputComponent = this.resolveInputComponent(type)

    const displayName = InputComponent.displayName || InputComponent.name

    console.log('checking', displayName)

    console.log('[%s] set focus in', displayName, nextFocusPath)
    console.log('[%s] focus is currently in', displayName, focusPath)

    console.log('[%s] equal? ', displayName, focusPath, nextFocusPath, PathUtils.isEqual(focusPath, nextFocusPath))

    if (PathUtils.isEqual(focusPath, nextFocusPath)) {
      // console.log('[%s] skippin', displayName)
      return
    }

    // console.log('[%s] emit onFocus: ', displayName, nextFocusPath)
    onFocus(nextFocusPath)
  }

  handleBlur = focusPath => {
    const {path, onBlur} = this.props
    if (!onBlur) {
      console.warn(
        'FormBuilderInput was used without passing an onBlur handler. Read more at %s',
        generateHelpUrl('input-component-missing-required-method')
      )
      return
    }
    onBlur([...path, ...focusPath])
  }
  setElement = (el: ?HTMLDivElement) => {
    this._element = el
  }

  getChildFocusPath() {
    const {path, focusPath} = this.props
    return PathUtils.startsWith(path, focusPath) ? PathUtils.trimLeft(path, focusPath) : []
  }
  render() {
    const {
      onChange,
      onFocus,
      onBlur,
      path,
      value,
      type,
      level,
      focusPath,
      isRoot,
      ...rest
    } = this.props

    const InputComponent = this.resolveInputComponent(type)

    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const rootProps = isRoot ? {isRoot} : {}

    const childFocusPath = this.getChildFocusPath()

    const isLeaf = childFocusPath.length === 0
    const leafProps = isLeaf ? {} : {focusPath: childFocusPath}

    // const debug = false ? content => (
    //     <div style={{border: '1px dashed green', padding: 4}}>
    //       {type.title}
    //       <pre style={{color: 'red'}}>{JSON.stringify(this.props.focusPath)}</pre>
    //       {content}
    //     </div>
    //   ) : content => content

    return (
      <div ref={this.setElement}>
        <InputComponent
          {...rest}
          {...rootProps}
          {...leafProps}
          value={value}
          type={type}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          level={level}
          ref={this.setInput}
        />
      </div>
    )
  }
}
