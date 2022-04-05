import React, {forwardRef, useCallback, useMemo} from 'react'
import shallowEquals from 'shallow-equals'
import {Path, SchemaType} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {generateHelpUrl} from '@sanity/generate-help-url'
import {EMPTY_ARRAY} from '../../utils/empty'

import {useFormBuilder} from '../../useFormBuilder'
import {FormFieldPresenceContext} from '../../../../lib/dts/src/presence/context'
import {ChangeIndicatorProvider} from '../../../components/changeIndicators/ChangeIndicator'
import {FormBuilderFilterFieldFn, FormInputComponentResolver, FormInputProps} from '../../types'

const WRAPPER_INNER_STYLES = {minWidth: 0}

/**
 * @alpha
 */
export interface ObjectFieldInputProps
  extends Omit<FormInputProps<unknown, SchemaType>, 'readOnly'> {
  inputComponent?: React.ComponentType<FormInputProps>
  fieldName: string
  filterField?: FormBuilderFilterFieldFn
  onKeyUp?: (ev: React.KeyboardEvent) => void
  onKeyPress?: (ev: React.KeyboardEvent) => void
  readOnly?: boolean
}

function getDisplayName(component: React.ComponentType) {
  return component.displayName || component.name || 'Unknown'
}

/**
 * @alpha
 */
export const ObjectFieldInput = forwardRef(function ObjectFieldInput(
  props: ObjectFieldInputProps,
  ref: React.ForwardedRef<ObjectFieldInputInstance>
) {
  const {getValuePath, resolveInputComponent} = useFormBuilder()

  const scopedResolveInputComponent = useCallback(
    (type: SchemaType) => {
      return resolveInputComponent(type)
    },
    [resolveInputComponent]
  )

  return (
    <ObjectFieldInputInstance
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
export class ObjectFieldInputInstance extends React.Component<
  ObjectFieldInputProps & {
    getValuePath: () => Path
    resolveInputComponent: FormInputComponentResolver
  }
> {
  static defaultProps = {
    focusPath: EMPTY_ARRAY,
    validation: EMPTY_ARRAY,
  }

  _element: HTMLDivElement | null = null
  _input: ObjectFieldInputInstance | HTMLDivElement | null = null
  scrollTimeout: number | null = null

  getValuePath = () => {
    return this.props.getValuePath().concat([this.props.fieldName])
  }

  componentDidMount() {
    const {focusPath, fieldName} = this.props
    if (PathUtils.hasFocus(focusPath || EMPTY_ARRAY, [fieldName])) {
      this.focus()
    }
  }

  shouldComponentUpdate(nextProps: ObjectFieldInputProps) {
    const {
      fieldName: oldFieldName,
      focusPath: oldFocusPath,
      validation: oldMarkers,
      ...oldProps
    } = this.props
    const {
      fieldName: newFieldName,
      focusPath: newFocusPath,
      validation: newMarkers,
      ...newProps
    } = nextProps

    return (
      oldFieldName !== newFieldName ||
      !shallowEquals(oldProps, newProps) ||
      !shallowEquals(oldFocusPath, newFocusPath) ||
      !shallowEquals(oldMarkers, newMarkers)
    )
  }

  componentDidUpdate(prevProps: ObjectFieldInputProps) {
    const hadFocus = PathUtils.hasFocus(prevProps.focusPath || EMPTY_ARRAY, [prevProps.fieldName])
    const hasFocus = PathUtils.hasFocus(this.props.focusPath || EMPTY_ARRAY, [this.props.fieldName])
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

  setInput = (component: ObjectFieldInputInstance | HTMLDivElement | null) => {
    this._input = component
  }

  focus() {
    const {type, readOnly} = this.props

    if (this._input && typeof this._input.focus === 'function') {
      this._input.focus()
      return
    }

    const inputComponent = this.resolveInputComponent(type)
    const inputDisplayName = inputComponent && getDisplayName(inputComponent as React.ComponentType)

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

  handleFocus = (pathOrEvent?: Path | React.FocusEvent) => {
    const {fieldName, onFocus, focusPath} = this.props

    if (!onFocus) {
      // eslint-disable-next-line no-console
      console.warn(
        'ObjectFieldInput was used without passing a required onFocus prop. Read more at %s.',
        generateHelpUrl('form-builder-input-missing-required-prop')
      )
      return
    }

    const nextPath = Array.isArray(pathOrEvent) ? pathOrEvent : EMPTY_ARRAY

    const nextFocusPath = Array.isArray(nextPath) ? [fieldName, ...nextPath] : [fieldName]

    if (PathUtils.isEqual(focusPath || EMPTY_ARRAY, nextFocusPath)) {
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
        'ObjectFieldInput was used without passing a required onBlur prop. Read more at %s.',
        generateHelpUrl('form-builder-input-missing-required-prop')
      )
      return
    }

    onBlur()
  }

  getChildFocusPath() {
    const {fieldName, focusPath} = this.props

    return PathUtils.trimChildPath([fieldName], focusPath || EMPTY_ARRAY)
  }

  render() {
    const {type, onChange} = this.props
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

    return (
      <ObjectFieldInputInner
        {...restProps}
        readOnly={readOnly}
        childFocusPath={this.getChildFocusPath()}
        component={InputComponent}
        onBlur={this.handleBlur}
        onChange={onChange}
        onFocus={this.handleFocus}
        setInput={this.setInput}
      />
    )
  }
}

interface ObjectFieldInputInnerProps extends ObjectFieldInputProps {
  childFocusPath: Path
  component: React.ComponentType<FormInputProps>
  setInput: (component: ObjectFieldInputInstance | HTMLDivElement | null) => void
}

function ObjectFieldInputInner(props: ObjectFieldInputInnerProps) {
  const {
    childFocusPath,
    compareValue,
    component: InputComponent,
    focusPath,
    validation,
    level,
    onBlur,
    onChange,
    onFocus,
    fieldName,
    presence: presenceProp,
    readOnly,
    setInput,
    type,
    value,
    ...rest
  } = props

  // @todo: find out if `presence` somehow used to be passed through context, and improve this:
  const presence = presenceProp // || context.presence

  const childPresenceInfo = useMemo(() => {
    if (!presence || presence.length === 0) {
      return EMPTY_ARRAY
    }

    return presence
      .filter((item) => PathUtils.startsWith([fieldName], item.path))
      .map((item) => ({...item, path: PathUtils.trimChildPath([fieldName], item.path)}))
  }, [fieldName, presence])

  const childValidation = useMemo(() => {
    return validation
      .filter((marker) => PathUtils.startsWith([fieldName], marker.path))
      .map((marker) => ({...marker, path: PathUtils.trimChildPath([fieldName], marker.path)}))
  }, [validation, fieldName])

  const isLeaf = type.jsonType !== 'object' && type.jsonType !== 'array'

  const childCompareValue = PathUtils.get(compareValue, [fieldName])

  const inputProps: FormInputProps = useMemo(
    () => ({
      ...rest,
      focusPath: isLeaf ? undefined : childFocusPath,
      value,
      readOnly,
      compareValue: childCompareValue,
      validation: childValidation.length === 0 ? EMPTY_ARRAY : childValidation,
      type,
      presence: childPresenceInfo,
      onChange,
      onFocus,
      onBlur,
      level,
      ref: setInput,
    }),
    [
      rest,
      isLeaf,
      childFocusPath,
      value,
      childCompareValue,
      readOnly,
      childValidation,
      type,
      childPresenceInfo,
      onChange,
      onFocus,
      onBlur,
      level,
      setInput,
    ]
  )

  const input = useMemo(() => <InputComponent {...inputProps} />, [InputComponent, inputProps])

  return (
    <div data-testid={`input-${PathUtils.toString([fieldName])}`} style={WRAPPER_INNER_STYLES}>
      <FormFieldPresenceContext.Provider value={childPresenceInfo}>
        <ChangeIndicatorProvider
          path={PathUtils.pathFor([fieldName])}
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
