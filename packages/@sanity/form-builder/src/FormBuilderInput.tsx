import React, {useMemo} from 'react'
import shallowEquals from 'shallow-equals'
import {Marker, Path, SchemaType} from '@sanity/types'
import {ChangeIndicatorProvider} from '@sanity/base/lib/change-indicators'
import * as PathUtils from '@sanity/util/paths'
import generateHelpUrl from '@sanity/generate-help-url'
import {FormFieldPresence, FormFieldPresenceContext} from '@sanity/base/presence'
import PatchEvent from './PatchEvent'
import {emptyArray} from './utils/empty'

const EMPTY_MARKERS: Marker[] = emptyArray()
const EMPTY_PATH: Path = emptyArray()
const EMPTY_PRESENCE: FormFieldPresence[] = emptyArray()

interface Props {
  value: unknown
  type: SchemaType
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  readOnly: boolean
  presence?: FormFieldPresence[]
  focusPath: Path
  markers: Marker[]
  compareValue?: any
  level: number
  isRoot?: boolean
  path: Path
  filterField?: (...args: any[]) => any
  onKeyUp?: (ev: React.KeyboardEvent) => void
  onKeyPress?: (ev: React.KeyboardEvent) => void
}

interface Context {
  presence?: FormFieldPresence[]
  formBuilder: any
  getValuePath: any
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ENABLE_CONTEXT = () => {}

function getDisplayName(component) {
  return component.displayName || component.name || 'Unknown'
}

export class FormBuilderInput extends React.Component<Props> {
  scrollTimeout: number
  _element: HTMLDivElement | null
  static contextTypes = {
    presence: ENABLE_CONTEXT,
    formBuilder: ENABLE_CONTEXT,
    getValuePath: ENABLE_CONTEXT,
  }
  static childContextTypes = {
    getValuePath: ENABLE_CONTEXT,
  }
  static defaultProps = {
    focusPath: EMPTY_PATH,
    path: EMPTY_PATH,
    markers: EMPTY_MARKERS,
  }
  _input: FormBuilderInput | HTMLDivElement | null

  getValuePath = () => {
    return this.context.getValuePath().concat(this.props.path)
  }

  getChildContext() {
    return {
      getValuePath: this.getValuePath,
    }
  }

  componentDidMount() {
    const {focusPath, path} = this.props
    if (PathUtils.hasFocus(focusPath, path)) {
      this.focus()
    }
  }

  shouldComponentUpdate(nextProps) {
    const {path: oldPath, focusPath: oldFocusPath, markers: oldMarkers, ...oldProps} = this.props
    const {path: newPath, focusPath: newFocusPath, markers: newMarkers, ...newProps} = nextProps

    return (
      !shallowEquals(oldProps, newProps) ||
      !shallowEquals(oldPath, newPath) ||
      !shallowEquals(oldFocusPath, newFocusPath) ||
      !shallowEquals(oldMarkers, newMarkers)
    )
  }

  // eslint-disable-next-line camelcase
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

  resolveInputComponent(type: SchemaType) {
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

  handleChange = (patchEvent) => {
    const {type, onChange} = this.props
    if (type.readOnly) {
      return
    }
    onChange(patchEvent)
  }

  handleFocus = (nextPath) => {
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
    return PathUtils.trimChildPath(path, focusPath)
  }

  render() {
    const {type} = this.props
    const InputComponent = this.resolveInputComponent(type)

    if (!InputComponent) {
      return (
        <div tabIndex={0} ref={this.setInput}>
          No input resolved for type {type.name ? JSON.stringify(type.name) : '<unknown type>'}
        </div>
      )
    }

    return (
      <FormBuilderInputInner
        {...this.props}
        childFocusPath={this.getChildFocusPath()}
        context={this.context}
        component={InputComponent}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        setInput={this.setInput}
      />
    )
  }
}

interface FormBuilderInputInnerProps {
  childFocusPath: Path
  component: any
  context: Context
  onBlur: () => void
  onChange: (patchEvent: any) => void
  onFocus: (nextPath: any) => void
  setInput: (component: FormBuilderInput | HTMLDivElement | null) => void
}

function FormBuilderInputInner(props: FormBuilderInputInnerProps & Props) {
  const {
    childFocusPath,
    compareValue,
    component: InputComponent,
    context,
    focusPath,
    markers,
    isRoot,
    level,
    onBlur,
    onChange,
    onFocus,
    path,
    presence: presenceProp,
    readOnly,
    setInput,
    type,
    value,
    ...rest
  } = props

  const presence = presenceProp || context.presence

  const childPresenceInfo = useMemo(() => {
    if (!presence || presence.length === 0) {
      return EMPTY_PRESENCE
    }

    return presence
      .filter((item) => PathUtils.startsWith(path, item.path))
      .map((item) => ({...item, path: PathUtils.trimChildPath(path, item.path)}))
  }, [path, presence, readOnly])

  const childMarkers = useMemo(() => {
    if (isRoot) return markers

    return markers
      .filter((marker) => PathUtils.startsWith(path, marker.path))
      .map((marker) => ({
        ...marker,
        path: PathUtils.trimChildPath(path, marker.path),
      }))
  }, [isRoot, markers, path])

  const isLeaf = childFocusPath.length === 0 || childFocusPath[0] === PathUtils.FOCUS_TERMINATOR
  const childCompareValue = PathUtils.get(compareValue, path)

  const input = useMemo(
    () => (
      <InputComponent
        {...rest}
        focusPath={isLeaf ? undefined : childFocusPath}
        isRoot={isRoot}
        value={value}
        compareValue={childCompareValue}
        readOnly={readOnly || type.readOnly}
        markers={childMarkers.length === 0 ? EMPTY_MARKERS : childMarkers}
        type={type}
        presence={childPresenceInfo}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        level={level}
        ref={setInput}
      />
    ),
    [
      InputComponent,
      childCompareValue,
      childFocusPath,
      childMarkers,
      childPresenceInfo,
      isLeaf,
      isRoot,
      level,
      onBlur,
      onChange,
      onFocus,
      readOnly,
      rest,
      setInput,
      type,
      value,
    ]
  )

  return (
    <div data-testid={path.length === 0 ? 'input-$root' : `input-${PathUtils.toString(path)}`}>
      <FormFieldPresenceContext.Provider value={childPresenceInfo}>
        <ChangeIndicatorProvider
          path={path}
          focusPath={focusPath}
          value={value}
          compareValue={childCompareValue}
        >
          {input}
        </ChangeIndicatorProvider>
      </FormFieldPresenceContext.Provider>
    </div>
  )
}
