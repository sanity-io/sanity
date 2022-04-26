/* eslint-disable camelcase */

import {useForwardedRef} from '@sanity/ui'
import React, {createElement, useCallback, useContext, useMemo} from 'react'
import {ChangeIndicatorProvider} from '../../../components/changeIndicators'
import {FormField} from '../formField'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {PatchArg, PatchEvent, setIfMissing} from '../../patch'
import {
  ArrayInputProps,
  FieldProps,
  FIXME,
  Focusable,
  InputProps,
  ObjectInputProps,
  RenderArrayItemCallback,
  RenderFieldCallback,
} from '../../types'
import {useFormBuilder} from '../../useFormBuilder'
import {createProtoValue} from '../../utils/createProtoValue'
import {FormNodeContext} from './FormNodeContext'
import {FormNodeProvider} from './FormNodeProvider'

const noop = () => undefined

/**
 * @alpha
 */
export interface FormNodeProps {
  children?: React.ReactNode
  component?: React.ComponentType<InputProps>
  fieldProps: FieldProps
  fieldRef?: React.Ref<Focusable>
  onChange?: (...patches: PatchArg[]) => void
  renderField?: RenderFieldCallback
  renderItem?: RenderArrayItemCallback
}

/**
 * @alpha
 */
export function FormNode(props: FormNodeProps) {
  const parent = useContext(FormNodeContext)

  const {
    onSetCollapsed,
    renderField: defaultRenderField,
    renderItem: defaultRenderItem,
  } = useFormBuilder()

  const {
    children,
    component: inputComponent,
    fieldProps,
    fieldRef = noop,
    onChange = parent?.onChange,
    renderField = defaultRenderField,
    renderItem = defaultRenderItem,
  } = props

  const forwardedRef = useForwardedRef(fieldRef)

  const isObject = fieldProps.kind === 'object'
  const isArray = fieldProps.kind === 'array'

  const {
    collapsed,
    collapsible,
    compareValue,
    id,
    level,
    path,
    presence,
    readOnly,
    validation,
    ...restFieldProps
  } = fieldProps

  const {type} = fieldProps

  // const parentPath = useMemo(() => (path.length ? path.slice(0, -1) : undefined), [path])
  const pathSegment = useMemo(() => (path.length ? path[path.length - 1] : undefined), [path])

  // NOTE: this is mainly used by legacy React class components
  const __internal: InputProps['__internal'] = useMemo(
    () => ({
      compareValue,
      level,
      path,
      presence,
      validation,
    }),
    [compareValue, level, path, presence, validation]
  )

  const inputProps: InputProps['inputProps'] = useMemo(
    () => ({
      id,
      onBlur: () => undefined,
      onFocus: () => undefined,
      readOnly,
      ref: fieldRef,
    }),
    [fieldRef, id, readOnly]
  )

  const handleChange = useCallback(
    (...patches: PatchArg[]) => {
      if (!onChange) {
        console.warn('missing `onChange` property')
      }

      if (readOnly || !onChange) return

      if (level === 0) {
        onChange(...patches)
        return
      }

      if (!pathSegment) return

      const event = PatchEvent.from(...patches)

      if (isObject) {
        onChange(event.prepend(setIfMissing(createProtoValue(type))).prefixAll(pathSegment).patches)
      } else if (isArray) {
        onChange(event.prepend(setIfMissing(createProtoValue(type))).prefixAll(pathSegment).patches)
      } else {
        onChange(...event.prefixAll(pathSegment).patches)
      }
    },
    [isObject, isArray, level, onChange, pathSegment, readOnly, type]
  )

  const handleSetCollapsed = useCallback(
    (nextCollapsed: boolean) => {
      onSetCollapsed(path, nextCollapsed)
    },
    [onSetCollapsed, path]
  )

  const __next_fieldProps: InputProps = useMemo(() => {
    if (restFieldProps.kind === 'object') {
      return {
        ...restFieldProps,
        __internal: __internal as FIXME,
        inputProps,
        onChange: handleChange,
        onSelectFieldGroup: () => console.warn('todo'),
        onSetCollapsed: handleSetCollapsed,
        renderField,
      }
    }

    if (restFieldProps.kind === 'array') {
      return {
        ...restFieldProps,
        __internal: __internal as FIXME,
        inputProps,
        onChange: handleChange,
        onInsert: () => console.warn('todo'),
        onSetCollapsed: handleSetCollapsed,
        renderItem,
      }
    }

    return {
      ...restFieldProps,
      __internal: __internal as FIXME,
      inputProps,
      onChange: handleChange,
    }
  }, [
    __internal,
    handleChange,
    handleSetCollapsed,
    inputProps,
    renderField,
    renderItem,
    restFieldProps,
  ])

  useDidUpdate(fieldProps.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      forwardedRef.current?.focus()
    }
  })

  // Render the input component
  let _children = children
  if (inputComponent) {
    if (__next_fieldProps.kind === 'object') {
      _children = createElement(
        inputComponent as React.ComponentType<ObjectInputProps>,
        __next_fieldProps
      )
    } else if (__next_fieldProps.kind === 'array') {
      _children = createElement(
        inputComponent as React.ComponentType<ArrayInputProps>,
        __next_fieldProps
      )
    } else {
      _children = createElement(inputComponent, __next_fieldProps)
    }
  } else {
    _children = renderField(__next_fieldProps)
  }

  // Wrap input in change indicator
  if (level > 0) {
    _children = (
      <FormField>
        <ChangeIndicatorProvider compareValue={compareValue} path={path} value={fieldProps.value}>
          {_children}
        </ChangeIndicatorProvider>
      </FormField>
    )
  }

  return (
    <FormNodeProvider
      collapsed={collapsed}
      collapsible={collapsible}
      compareValue={compareValue}
      inputId={id}
      level={level}
      onChange={handleChange}
      path={path}
      presence={presence}
      type={fieldProps.type}
      validation={validation}
    >
      {_children}
    </FormNodeProvider>
  )
}
