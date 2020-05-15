/* eslint-disable complexity */
import React from 'react'
import shallowEquals from 'shallow-equals'
import {Path, PathSegment} from './typedefs/path'
import PatchEvent from './PatchEvent'
import generateHelpUrl from '@sanity/generate-help-url'
import * as PathUtils from '@sanity/util/paths.js'
import {Type, Marker, FormBuilderPresence} from './typedefs'

const NO_MARKERS: Marker[] = []

interface Props {
  value: any
  type: Type
  onChange: (arg0: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  readOnly: boolean
  presence?: FormBuilderPresence[]
  focusPath: Path
  markers: Marker[]
  level: number
  isRoot?: boolean
  path: Array<PathSegment>
  filterField?: Function
  onKeyUp?: (ev: React.KeyboardEvent) => void
  onKeyPress?: (ev: React.KeyboardEvent) => void
}

const ENABLE_CONTEXT = () => {}

function getDisplayName(component) {
  return component.displayName || component.name || 'Unknown'
}

function trimChildPath(path, childPath) {
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : []
}

export class FormBuilderInput extends React.Component<Props> {
  scrollTimeout: number
  _element: HTMLDivElement | null
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
    markers: NO_MARKERS
  }
  _input: FormBuilderInput | HTMLDivElement | null
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

  shouldComponentUpdate(nextProps) {
    const {path: oldPath, ...oldProps} = this.props
    const {path: newPath, ...newProps} = nextProps

    const propsDiffer = !shallowEquals(oldProps, newProps)
    const pathDiffer = !PathUtils.isEqual(oldPath, newPath)

    return propsDiffer || pathDiffer
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
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

  setInput = (component: FormBuilderInput | HTMLDivElement | null) => {
    this._input = component
  }

  focus() {
    const {type} = this.props
    if (this._input && typeof this._input.focus === 'function') {
      this._input.focus()
      return
    }
    const inputComponent = this.resolveInputComponent(type)
    const inputDisplayName = getDisplayName(inputComponent)
    // no ref
    if (!this._input) {
      // eslint-disable-next-line no-console
      console.warn(
        'The input component for type "%s" has no associated ref element. Please check the implementation of "%s" [%O]. If this is a function component, it must be wrapped in React.forwardRef(). Read more at %s',
        type.name,
        inputDisplayName,
        inputComponent,
        generateHelpUrl('input-component-no-ref')
      )
      return
    }
    // eslint-disable-next-line no-console
    console.warn(
      'The input component for type "%s" is missing a required ".focus()" method. Please check the implementation of "%s" [%O]. Read more at %s',
      type.name,
      inputDisplayName,
      inputComponent,
      generateHelpUrl('input-component-missing-required-method')
    )
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
      // eslint-disable-next-line no-console
      console.warn(
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
      // eslint-disable-next-line no-console
      console.warn(
        'FormBuilderInput was used without passing a required onBlur prop. Read more at %s.',
        generateHelpUrl('form-builder-input-missing-required-prop')
      )
      return
    }
    onBlur()
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
      presence,
      focusPath,
      isRoot,
      ...rest
    } = this.props
    const InputComponent = this.resolveInputComponent(type)
    if (!InputComponent) {
      return (
        <div tabIndex={0} ref={this.setInput}>
          No input resolved for type {type.name ? JSON.stringify(type.name) : '<unknown type>'}
        </div>
      )
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

    const childPresenceInfo = (presence || [])
      .filter(presence => {
        return PathUtils.startsWith(path, presence.path)
      })
      .map(presence => ({
        ...presence,
        path: trimChildPath(path, presence.path)
      }))
    return (
      <div data-focus-path={PathUtils.toString(path)}>
        <InputComponent
          {...rest}
          {...rootProps}
          {...leafProps}
          value={value}
          readOnly={readOnly || type.readOnly}
          markers={childMarkers.length === 0 ? NO_MARKERS : childMarkers}
          type={type}
          presence={childPresenceInfo}
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
