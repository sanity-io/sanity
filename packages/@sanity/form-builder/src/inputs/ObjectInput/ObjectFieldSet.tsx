// Render a fieldset inside the object input
import React, {ForwardedRef, forwardRef, useMemo} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormFieldSet, FormFieldSetProps} from '@sanity/base/components'
import {Marker, MultiFieldSet, Path} from '@sanity/types'
import {EMPTY_ARRAY} from '../../utils/empty'
import {ConditionalHiddenField} from '../common/ConditionalHiddenField'
import {getCollapsedWithDefaults} from './utils'

interface Props extends Omit<FormFieldSetProps, 'onFocus'> {
  fieldset: MultiFieldSet
  focusPath: Path
  onFocus: (focusPath: Path) => void
  level: number
  presence: FormFieldPresence[]
  markers: Marker[]
  fieldSetParent: Record<string, unknown> | undefined
  fieldValues: Record<string, unknown>
}

/**
 * A specialized component for object "fieldsets", e.g. a group of object fields as defined by the fieldsets option
 * on the object type https://www.sanity.io/docs/object-type#fieldsets-b8b5507db1d3
 */
export const ObjectFieldSet = forwardRef(function ObjectFieldSet(
  props: Props,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const {
    fieldset,
    focusPath,
    children,
    level,
    presence,
    markers,
    onFocus,
    fieldValues,
    fieldSetParent,
    ...rest
  } = props
  const columns = fieldset.options && fieldset.options.columns

  const collapsibleOpts = getCollapsedWithDefaults(fieldset.options, level)

  const fieldNames = useMemo(() => fieldset.fields.map((f) => f.name), [fieldset.fields])

  const [isCollapsed, setCollapsed] = React.useState(collapsibleOpts.collapsed)

  const childPresence = useMemo(() => {
    return isCollapsed && presence.length > 0
      ? presence.filter(
          (item) => typeof item.path[0] === 'string' && fieldNames.includes(item.path[0])
        )
      : EMPTY_ARRAY
  }, [fieldNames, isCollapsed, presence])

  const childMarkers = useMemo(() => {
    return markers.length === 0
      ? markers
      : markers.filter(
          (item) => typeof item.path[0] === 'string' && fieldNames.includes(item.path[0])
        )
  }, [fieldNames, markers])

  const handleToggleFieldset = React.useCallback(
    (nextCollapsed) => {
      if (nextCollapsed) {
        // note: technically, when collapsing this fieldset we remove focus from whatever field (if any) inside
        // it that currently has focus, so it might be tempting to emit a new focus path for the "parent object",
        // e.g. onFocus([]), but this can in some cases have the unintended consequence of creating page jumps, since it
        // will put focus in the the first field of the parent object input, which may be rendered far away from the current fieldset.
        // For this reason, keep the focus path where it is, and just "locally" collapse this fieldset
        setCollapsed(true)
      } else {
        onFocus([fieldNames[0]])
        setCollapsed(false)
      }
    },
    [onFocus, fieldNames]
  )

  React.useEffect(() => {
    const hasFocusWithin =
      focusPath.length > 0 && fieldNames.some((fieldName) => focusPath[0] === fieldName)

    if (hasFocusWithin) {
      setCollapsed(false)
    }
  }, [fieldNames, focusPath])

  const renderFieldSet = () => {
    return (
      <FormFieldSet
        {...rest}
        key={fieldset.name}
        title={fieldset.title}
        description={fieldset.description}
        level={level + 1}
        columns={columns}
        collapsible={collapsibleOpts.collapsible}
        collapsed={isCollapsed}
        onToggle={handleToggleFieldset}
        __unstable_presence={isCollapsed ? childPresence : EMPTY_ARRAY}
        __unstable_changeIndicator={false}
        __unstable_markers={childMarkers}
        ref={isCollapsed ? forwardedRef : null}
      >
        {children}
      </FormFieldSet>
    )
  }

  if (typeof fieldset.hidden === 'function') {
    const fieldSetValuesObject = {}
    fieldset.fields.forEach((field) => {
      fieldSetValuesObject[field.name] = fieldValues[field.name]
    })

    return (
      <ConditionalHiddenField
        {...fieldset}
        parent={fieldSetParent}
        value={fieldSetValuesObject}
        hidden={fieldset.hidden}
      >
        {renderFieldSet()}
      </ConditionalHiddenField>
    )
  } else if (fieldset.hidden === true) {
    return null
  }
  return renderFieldSet()
})
