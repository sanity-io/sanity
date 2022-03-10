import React, {forwardRef, useCallback, useMemo} from 'react'
import shallowEquals from 'shallow-equals'
import {ConditionalProperty, ValidationMarker, Path, SchemaType} from '@sanity/types'
import {ChangeIndicatorProvider} from '@sanity/base/components'
import * as PathUtils from '@sanity/util/paths'
import {generateHelpUrl} from '@sanity/generate-help-url'
import {FormFieldPresence, FormFieldPresenceContext} from '@sanity/base/presence'
import {useConditionalReadOnly} from '@sanity/base/_internal'
import {PatchEvent} from './PatchEvent'
import {emptyArray} from './utils/empty'
import {FormBuilderFilterFieldFn, FormInputComponentResolver, FormInputProps} from './types'
import {ConditionalReadOnlyField} from './inputs/common'
import {useFormBuilder} from './useFormBuilder'

const EMPTY_VALIDATION: ValidationMarker[] = emptyArray()
const EMPTY_PATH: Path = emptyArray()
const EMPTY_PRESENCE: FormFieldPresence[] = emptyArray()
const WRAPPER_INNER_STYLES = {minWidth: 0}

/**
 * @alpha
 */
export interface FormBuilderInputProps
  extends Omit<FormInputProps<unknown, SchemaType>, 'readOnly'> {
  readOnly?: ConditionalProperty
  parent?: Record<string, unknown> | undefined
  inputComponent?: React.ComponentType<FormInputProps>
  isRoot?: boolean
  path: Path
  filterField?: FormBuilderFilterFieldFn
  onKeyUp?: (ev: React.KeyboardEvent) => void
  onKeyPress?: (ev: React.KeyboardEvent) => void
}

function getDisplayName(component: React.ComponentType) {
  return component.displayName || component.name || 'Unknown'
}

/**
 * @alpha
 */
export const FormBuilderInput = forwardRef(function FormBuilderInput(
  props: FormBuilderInputProps,
  ref: React.ForwardedRef<FormBuilderInputInstance>
) {
  const {getValuePath, resolveInputComponent} = useFormBuilder()

  const scopedResolveInputComponent = useCallback(
    (type: SchemaType) => {
      return resolveInputComponent(type)
    },
    [resolveInputComponent]
  )

  return (
    <FormBuilderInputInstance
      {...props}
      getValuePath={getValuePath}
      ref={ref}
      resolveInputComponent={scopedResolveInputComponent}
    />
  )
})

/**
 * @internal
 */
export class FormBuilderInputInstance extends React.Component<
  FormBuilderInputProps & {
    getValuePath: () => Path
    resolveInputComponent: FormInputComponentResolver
  }
> {
  static defaultProps = {
    focusPath: EMPTY_PATH,
    path: EMPTY_PATH,
    validation: EMPTY_VALIDATION,
  }

  _element: HTMLDivElement | null
  _input: FormBuilderInputInstance | HTMLDivElement | null
  scrollTimeout: number

  getValuePath = () => {
    return this.props.getValuePath().concat(this.props.path)
  }

  componentDidMount() {
    const {focusPath, path} = this.props
    if (PathUtils.hasFocus(focusPath, path)) {
      this.focus()
    }
  }

  shouldComponentUpdate(nextProps: FormBuilderInputProps) {
    const {path: oldPath, focusPath: oldFocusPath, validation: oldMarkers, ...oldProps} = this.props
    const {path: newPath, focusPath: newFocusPath, validation: newMarkers, ...newProps} = nextProps

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
    const {inputComponent} = this.props
    return inputComponent ?? this.props.resolveInputComponent(type)
  }

  setInput = (component: FormBuilderInputInstance | HTMLDivElement | null) => {
    this._input = component
  }

  focus() {
    const {type} = this.props

    if (this._input && typeof this._input.focus === 'function') {
      this._input.focus()
      return
    }

    const inputComponent = this.resolveInputComponent(type)
    const inputDisplayName = inputComponent && getDisplayName(inputComponent)

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
    const {type, parent, value} = this.props
    // Separate readOnly in order to resolve it to a boolean type
    const {readOnly, ...restProps} = this.props
    const InputComponent = this.resolveInputComponent(type)

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
      <FormBuilderInputInner
        {...restProps}
        readOnly={readOnly}
        childFocusPath={this.getChildFocusPath()}
        component={InputComponent}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        setInput={this.setInput}
      />
    )
  }
}

interface FormBuilderInputInnerProps extends FormBuilderInputProps {
  childFocusPath: Path
  component: React.ComponentType<FormInputProps>
  setInput: (component: FormBuilderInputInstance | HTMLDivElement | null) => void
  readOnly?: boolean
}

function FormBuilderInputInner(props: FormBuilderInputInnerProps) {
  const {
    childFocusPath,
    compareValue,
    component: InputComponent,
    focusPath,
    validation,
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
  const conditionalReadOnly = useConditionalReadOnly() ?? readOnly

  // @todo: find out if `presence` somehow used to be passed through context, and improve this:
  const presence = presenceProp // || context.presence

  const childPresenceInfo = useMemo(() => {
    if (!presence || presence.length === 0) {
      return EMPTY_PRESENCE
    }

    return presence
      .filter((item) => PathUtils.startsWith(path, item.path))
      .map((item) => ({...item, path: PathUtils.trimChildPath(path, item.path)}))
  }, [path, presence])

  const childValidation = useMemo(() => {
    if (isRoot) return validation

    return validation
      .filter((marker) => PathUtils.startsWith(path, marker.path))
      .map((marker) => ({...marker, path: PathUtils.trimChildPath(path, marker.path)}))
  }, [isRoot, validation, path])

  const isLeaf = type.jsonType !== 'object' && type.jsonType !== 'array'

  const childCompareValue = PathUtils.get(compareValue, path)

  const inputProps: FormInputProps = useMemo(
    () => ({
      ...rest,
      focusPath: isLeaf ? undefined : childFocusPath,
      isRoot,
      value,
      compareValue: childCompareValue,
      readOnly: conditionalReadOnly,
      validation: childValidation.length === 0 ? EMPTY_VALIDATION : childValidation,
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
      childValidation,
      childPresenceInfo,
      isLeaf,
      isRoot,
      level,
      onBlur,
      onChange,
      onFocus,
      conditionalReadOnly,
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
