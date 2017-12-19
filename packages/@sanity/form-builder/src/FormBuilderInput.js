/* eslint-disable complexity */
// @flow
import React from 'react'
import type {Path} from './typedefs/path'
import PatchEvent from './PatchEvent'
import generateHelpUrl from '@sanity/generate-help-url'
import * as PathUtils from './utils/pathUtils'
import type {Type} from './typedefs'

type Props = {
  value: any,
  type: Type,
  onChange: PatchEvent => void,
  onFocus: Path => void,
  onBlur: () => void,
  readOnly: boolean,
  focusPath: Path,
  markers: Array<*>,
  level: number,
  isRoot: boolean,
  path: Array<PathSegment>
}

const ENABLE_CONTEXT = () => {}

function getDisplayName(component) {
  return component.displayName || component.name || 'Unknown'
}

function trimChildPath(path, childPath) {
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : []
}

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
    path: [],
    markers: []
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

  componentWillReceiveProps(nextProps: Props) {
    const willHaveFocus = PathUtils.hasFocus(nextProps.focusPath, nextProps.path)
    const hasFocus = PathUtils.hasFocus(this.props.focusPath, this.props.path)
    if (willHaveFocus && !hasFocus) {
      this.focus()
    }
  }

  componentWillUnmount() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
  }

  resolveInputComponent(type: Type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  setInput = (component: ?FormBuilderInput) => {
    this._input = component
  }

  _withInputDisplayName(cb: (str: string) => void) {
    cb(getDisplayName(this.resolveInputComponent(this.props.type)))
  }

  focus() {
    if (!this._input) {
      // should never happen
      throw new Error('Attempted to set focus on a missing input component')
    }
    if (typeof this._input.focus !== 'function') {
      this._withInputDisplayName(displayName =>
        console.warn(
          'Missing a required ".focus()" method on input component. Please check the implementation of %s. Read more at %s',
          displayName,
          generateHelpUrl('input-component-missing-required-method')
        )
      )
      return
    }
    this._input.focus()
  }

  handleChange = patchEvent => {
    const {type, onChange} = this.props
    if (type.readOnly) {
      return
    }
    onChange(patchEvent)
  }

  handleFocus = nextPath => {
    const {path, onFocus, focusPath} = this.props

    if (!onFocus) {
      console.warn(
        // eslint-disable-line no-console
        'FormBuilderInput was used without passing a required onFocus prop. Read more at %s.',
        generateHelpUrl('form-builder-input-missing-required-prop')
      )
      return
    }

    const nextFocusPath = Array.isArray(nextPath) ? [...path, ...nextPath] : path

    if (PathUtils.isEqual(focusPath, nextFocusPath)) {
      // no change
      return
    }

    onFocus(nextFocusPath)
  }

  handleBlur = () => {
    const {onBlur} = this.props
    if (!onBlur) {
      console.warn(
        // eslint-disable-line no-console
        'FormBuilderInput was used without passing a required onBlur prop. Read more at %s.',
        generateHelpUrl('form-builder-input-missing-required-prop')
      )
      return
    }
    onBlur()
  }

  setElement = (el: ?HTMLDivElement) => {
    this._element = el
  }

  getChildFocusPath() {
    const {path, focusPath} = this.props
    return trimChildPath(path, focusPath)
  }

  render() {
    const {
      onChange,
      onFocus,
      onBlur,
      path,
      readOnly,
      value,
      markers,
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

    let childMarkers = markers
    if (!isRoot) {
      childMarkers = markers
        .filter(marker => PathUtils.startsWith(path, marker.path))
        .map(marker => ({
          ...marker,
          path: trimChildPath(path, marker.path)
        }))
    }

    const childFocusPath = this.getChildFocusPath()

    const isLeaf = childFocusPath.length === 0 || childFocusPath[0] === PathUtils.FOCUS_TERMINATOR
    const leafProps = isLeaf ? {} : {focusPath: childFocusPath}

    return (
      <div ref={this.setElement} data-focus-path={PathUtils.toString(path)}>
        <InputComponent
          {...rest}
          {...rootProps}
          {...leafProps}
          value={value}
          readOnly={readOnly || type.readOnly}
          markers={childMarkers}
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
