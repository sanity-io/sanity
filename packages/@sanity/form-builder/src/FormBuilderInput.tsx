/* eslint-disable complexity */
import React from 'react'
import shallowEquals from 'shallow-equals'
import {Path, PathSegment} from './typedefs/path'
import PatchEvent from './PatchEvent'
import generateHelpUrl from '@sanity/generate-help-url'
import * as PathUtils from '@sanity/util/paths'
import {Type, Marker, Presence} from './typedefs'
import {Context as PresenceContext} from '@sanity/components/lib/presence'
import {Context as ChangeConnectorContext} from '@sanity/components/lib/change-indicators'
import {emptyArray} from './utils/empty'
import {ArrayDiff, Diff, ObjectDiff} from '@sanity/diff'

function isObjectDiff<T>(diff: Diff<T>): diff is ObjectDiff<T> {
  return diff.type === 'object'
}

function isArrayDiff<T>(diff: Diff<T>): diff is ArrayDiff<T> {
  return diff.type === 'array'
}

function getDiffForPath(diff: Diff<unknown> | undefined, path: Path) {
  if (!diff || path.length === 0) {
    return diff
  }
  const [head, ...tail] = path
  if (typeof head === 'string' && isObjectDiff(diff)) {
    return getDiffForPath(diff.fields[head], tail)
  }
  if (typeof head === 'object' && isArrayDiff(diff)) {
    const item = diff.items.find(item => (item.diff.toValue as any)._key === head._key)
    return getDiffForPath(item?.diff, tail)
  }
  throw new Error('Invalid access for path on diff')
}

const EMPTY_MARKERS: Marker[] = emptyArray()
const EMPTY_PATH: Path = emptyArray()
const EMPTY_PRESENCE: Presence[] = emptyArray()

interface Props {
  value: any
  type: Type
  onChange: (arg0: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  readOnly: boolean
  presence?: Presence[]
  focusPath: Path
  markers: Marker[]
  diff?: Diff<unknown>
  level: number
  isRoot?: boolean
  path: Array<PathSegment>
  filterField?: Function
  onKeyUp?: (ev: React.KeyboardEvent) => void
  onKeyPress?: (ev: React.KeyboardEvent) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ENABLE_CONTEXT = () => {}

function getDisplayName(component) {
  return component.displayName || component.name || 'Unknown'
}

function trimChildPath(path, childPath) {
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : EMPTY_PATH
}

export class FormBuilderInput extends React.Component<Props> {
  scrollTimeout: number
  _element: HTMLDivElement | null
  static contextTypes = {
    presence: ENABLE_CONTEXT,
    formBuilder: ENABLE_CONTEXT,
    getValuePath: ENABLE_CONTEXT
  }
  static childContextTypes = {
    getValuePath: ENABLE_CONTEXT
  }
  static defaultProps = {
    focusPath: EMPTY_PATH,
    path: EMPTY_PATH,
    markers: EMPTY_MARKERS
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
      presence = this.context.presence,
      focusPath,
      diff,
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
    const hasFocus = PathUtils.hasFocus(focusPath, path)
    const childPresenceInfo =
      readOnly || presence.length === 0
        ? EMPTY_PRESENCE
        : presence
        ? presence
            .filter(presence => {
              return PathUtils.startsWith(path, presence.path)
            })
            .map(presence => ({
              ...presence,
              path: trimChildPath(path, presence.path)
            }))
        : EMPTY_PRESENCE
    const leafProps = isLeaf ? {} : {focusPath: childFocusPath}

    const childDiff = getDiffForPath(diff, path)

    return (
      <div data-focus-path={PathUtils.toString(path)}>
        <PresenceContext.Provider value={childPresenceInfo}>
          <ChangeConnectorContext.Provider value={{isChanged: childDiff?.isChanged || false}}>
            <InputComponent
              {...rest}
              {...leafProps}
              isRoot={isRoot}
              value={value}
              diff={childDiff}
              readOnly={readOnly || type.readOnly}
              markers={childMarkers.length === 0 ? EMPTY_MARKERS : childMarkers}
              type={type}
              presence={childPresenceInfo}
              onChange={this.handleChange}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
              level={level}
              ref={this.setInput}
            />
          </ChangeConnectorContext.Provider>
        </PresenceContext.Provider>
      </div>
    )
  }
}
