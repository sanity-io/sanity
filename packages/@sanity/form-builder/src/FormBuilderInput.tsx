import React, {useMemo} from 'react'
import shallowEquals from 'shallow-equals'
import {
  FieldGroup,
  ConditionalProperty,
  Marker,
  ObjectField,
  ObjectSchemaTypeWithOptions,
  Path,
  SchemaType,
} from '@sanity/types'
import {ChangeIndicatorProvider} from '@sanity/base/change-indicators'
import * as PathUtils from '@sanity/util/paths'
import generateHelpUrl from '@sanity/generate-help-url'
import {FormFieldPresence, FormFieldPresenceContext} from '@sanity/base/presence'
import {Card, Tab, TabList} from '@sanity/ui'
// import {EditIcon, EyeClosedIcon, EyeOpenIcon, PreviewIcon} from '@sanity/icons'
import PatchEvent from './PatchEvent'
import {emptyArray} from './utils/empty'
import {Props as InputProps} from './inputs/types'
import {ConditionalReadOnlyField} from './inputs/common'
import {setSelectedTabName} from './fieldGroups/datastore'

const EMPTY_MARKERS: Marker[] = emptyArray()
const EMPTY_PATH: Path = emptyArray()
const EMPTY_PRESENCE: FormFieldPresence[] = emptyArray()
const WRAPPER_INNER_STYLES = {minWidth: 0}

interface FormBuilderInputProps {
  value: unknown
  type: SchemaType
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  readOnly?: ConditionalProperty
  parent?: Record<string, unknown> | undefined
  presence?: FormFieldPresence[]
  focusPath: Path
  markers: Marker[]
  compareValue?: unknown
  level: number
  isRoot?: boolean
  path: Path
  filterField?: (type: ObjectSchemaTypeWithOptions, field: ObjectField) => boolean
  onKeyUp?: (ev: React.KeyboardEvent) => void
  onKeyPress?: (ev: React.KeyboardEvent) => void
}

interface FieldGroupsTabsProps {
  type: SchemaType
}

interface Context {
  presence?: FormFieldPresence[]
  formBuilder: any
  getValuePath: any
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ENABLE_CONTEXT = () => undefined

function getDisplayName(component: React.ComponentType) {
  return component.displayName || component.name || 'Unknown'
}

function FilterGroupTabs(props: FieldGroupsTabsProps) {
  const {type} = props
  const [id, setId] = React.useState('all-fields')
  const filterGroups: FieldGroup[] = [
    {
      name: 'all-fields',
      title: 'All Fields',
    },
    ...(type.groups || []),
  ]

  React.useEffect(() => {
    setSelectedTabName(id)
  }, [id])

  return (
    <Card paddingBottom={4} data-testid="field-groups">
      <TabList space={2}>
        {filterGroups.map((group) => {
          const {name, title, icon} = group

          return (
            <Tab
              data-testid={`group-${name}`}
              key={`${name}-tab`}
              id={`${name}-tab`}
              icon={icon}
              size={1}
              aria-controls={`${name}-panel`}
              label={title || name}
              onClick={() => setId(name)}
              selected={id === name}
            />
          )
        })}
      </TabList>
    </Card>
  )
}

export class FormBuilderInput extends React.Component<FormBuilderInputProps> {
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

  _element: HTMLDivElement | null
  _input: FormBuilderInput | HTMLDivElement | null
  scrollTimeout: number

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

  shouldComponentUpdate(nextProps: FormBuilderInputProps) {
    const {path: oldPath, focusPath: oldFocusPath, markers: oldMarkers, ...oldProps} = this.props
    const {path: newPath, focusPath: newFocusPath, markers: newMarkers, ...newProps} = nextProps

    return (
      !shallowEquals(oldProps, newProps) ||
      !shallowEquals(oldPath, newPath) ||
      !shallowEquals(oldFocusPath, newFocusPath) ||
      !shallowEquals(oldMarkers, newMarkers)
    )
  }

  componentDidUpdate(prevProps: FormBuilderInputProps) {
    const hadFocus = PathUtils.hasFocus(prevProps.focusPath, prevProps.path)
    const hasFocus = PathUtils.hasFocus(this.props.focusPath, this.props.path)
    if (!hadFocus && hasFocus) {
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

  handleChange = (patchEvent: PatchEvent) => {
    const {type, onChange} = this.props
    if (typeof type.readOnly === 'boolean' && type.readOnly) {
      return
    }

    onChange(patchEvent)
  }

  handleFocus = (nextPath: Path) => {
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
    const {type, level, parent, value} = this.props
    // Separate readOnly in order to resolve it to a boolean type
    const {readOnly, ...restProps} = this.props
    const InputComponent = this.resolveInputComponent(type)
    const hasGroups = typeof type.groups === 'object'

    if (!InputComponent) {
      return (
        <div tabIndex={0} ref={this.setInput}>
          No input resolved for type {type.name ? JSON.stringify(type.name) : '<unknown type>'}
        </div>
      )
    }

    if (typeof readOnly === 'function' || typeof type.readOnly === 'function') {
      return (
        <ConditionalReadOnlyField
          parent={parent}
          value={value}
          readOnly={readOnly ?? type.readOnly}
        >
          <FormBuilderInputInner
            {...restProps}
            childFocusPath={this.getChildFocusPath()}
            context={this.context}
            component={InputComponent}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            setInput={this.setInput}
          />
        </ConditionalReadOnlyField>
      )
    }

    return (
      <>
        {level === 0 && hasGroups && <FilterGroupTabs type={type} />}
        <FormBuilderInputInner
          {...restProps}
          readOnly={readOnly}
          childFocusPath={this.getChildFocusPath()}
          context={this.context}
          component={InputComponent}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          setInput={this.setInput}
        />
      </>
    )
  }
}

interface FormBuilderInputInnerProps extends FormBuilderInputProps {
  childFocusPath: Path
  component: React.ComponentType<InputProps>
  context: Context
  setInput: (component: FormBuilderInput | HTMLDivElement | null) => void
  readOnly?: boolean
}

function FormBuilderInputInner(props: FormBuilderInputInnerProps) {
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
  }, [path, presence])

  const childMarkers = useMemo(() => {
    if (isRoot) return markers

    return markers
      .filter((marker) => PathUtils.startsWith(path, marker.path))
      .map((marker) => ({...marker, path: PathUtils.trimChildPath(path, marker.path)}))
  }, [isRoot, markers, path])

  const isLeaf = childFocusPath.length === 0 || childFocusPath[0] === PathUtils.FOCUS_TERMINATOR
  const childCompareValue = PathUtils.get(compareValue, path)

  const inputProps: InputProps = useMemo(
    () => ({
      ...rest,
      focusPath: isLeaf ? undefined : childFocusPath,
      isRoot,
      value,
      compareValue: childCompareValue,
      readOnly,
      markers: childMarkers.length === 0 ? EMPTY_MARKERS : childMarkers,
      type,
      presence: childPresenceInfo,
      onChange,
      onFocus,
      onBlur,
      level,
      ref: setInput,
    }),
    [
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

  const input = useMemo(() => <InputComponent {...inputProps} />, [InputComponent, inputProps])

  return (
    <div
      data-testid={path.length === 0 ? 'input-$root' : `input-${PathUtils.toString(path)}`}
      style={WRAPPER_INNER_STYLES}
    >
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
