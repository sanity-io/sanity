import {FormFieldSet} from '@sanity/base/components'
import {
  FormBuilderInput,
  FormBuilderInputInstance,
  FormInputProps,
  PatchEvent,
  setIfMissing,
} from '@sanity/form-builder'
import {ObjectField, ObjectSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import React from 'react'

type CustomObjectInputProps = FormInputProps<Record<string, unknown>, ObjectSchemaType>

export default class CustomObjectInput extends React.PureComponent<CustomObjectInputProps> {
  firstFieldInput = React.createRef<FormBuilderInputInstance>()

  handleFieldChange = (field: ObjectField, fieldPatchEvent: PatchEvent) => {
    const {onChange, type} = this.props

    // Whenever the field input emits a patch event, we need to make sure to each of the included
    // patches are prefixed with its field name, e.g. going from:
    // {path: [], set: <nextvalue>} to {path: [<fieldName>], set: <nextValue>}
    // and ensure this input's value exists
    onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
  }

  focus() {
    const firstFieldInput = this.firstFieldInput.current

    if (firstFieldInput) {
      firstFieldInput.focus()
    }
  }

  render() {
    const {type, value, level, focusPath, onFocus, onBlur, presence, validation} = this.props

    return (
      <FormFieldSet level={level} title={type.title} description={type.description}>
        <Text accent size={1}>
          This is my custom object input with fields
        </Text>
        <Card padding={3} radius={2} tone="primary">
          <Stack space={4}>
            {type.fields.map((field, i) => (
              // Delegate to the generic FormBuilderInput. It will resolve and insert the actual
              // input component for the given field type
              <FormBuilderInput
                level={level + 1}
                ref={i === 0 ? this.firstFieldInput : null}
                key={field.name}
                type={field.type}
                value={value?.[field.name]}
                onChange={(patchEvent) => this.handleFieldChange(field, patchEvent)}
                path={[field.name]}
                focusPath={focusPath}
                onFocus={onFocus}
                onBlur={onBlur}
                presence={presence.filter((p) => p.path[0] === field.name)}
                validation={validation.filter((p) => p.path[0] === field.name)}
              />
            ))}
          </Stack>
        </Card>
      </FormFieldSet>
    )
  }
}
