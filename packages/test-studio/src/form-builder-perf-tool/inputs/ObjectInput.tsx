import * as React from 'react'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import PatchEvent, {setIfMissing} from '@sanity/form-builder/lib/PatchEvent'

export const ObjectField = React.memo(
  React.forwardRef((props, ref) => {
    const {field, value, level} = props

    const onChange = React.useCallback(patchEvent => {
      props.onChange(patchEvent.prefixAll(field.name))
    }, [])

    return (
      <FormBuilderInput
        level={level}
        value={value}
        markers={props.markers}
        type={field.type}
        onBlur={() => {}}
        path={[field.name]}
        presence={props.presence}
        focusPath={(props.focusPath || []).slice(1)}
        onChange={onChange}
        onFocus={props.onFocus}
      />
    )
  })
)

export const ObjectInput = React.forwardRef((props, ref) => {
  if (props.level > 2) {
    return null
  }

  const onFieldChange = React.useCallback(patchEvent => {
    props.onChange(patchEvent.prepend([setIfMissing({_type: props.type.name})]))
  }, [])

  const onFieldFocus = React.useCallback(focusPath => {
    props.onFocus(focusPath)
  }, [])

  return (
    <div>
      <label>{props.type.title}</label>
      {/*<RenderMarkers markers={props.markers.items}/>*/}
      <fieldset>
        {props.type.fields.map(field => (
          <ObjectField
            key={field.name}
            level={props.level + 1}
            field={field}
            presence={props.presence}
            focusPath={props.focusPath}
            value={props.value && props.value[field.name]}
            onFocus={onFieldFocus}
            onChange={onFieldChange}
          />
        ))}
      </fieldset>
    </div>
  )
})
