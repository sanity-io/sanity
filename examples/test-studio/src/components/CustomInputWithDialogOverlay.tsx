import React from 'react'
import {PresenceOverlay, FieldPresence} from '@sanity/base/presence'
import Dialog from 'part:@sanity/components/dialogs/default'
import Button from 'part:@sanity/components/buttons/default'
import {setIfMissing} from 'part:@sanity/form-builder/patch-event'
import {FormBuilderInput} from 'part:@sanity/form-builder'

export const CustomInputWithDialogOverlay = React.forwardRef(function CustomInputWithDialogOverlay(
  props,
  ref
) {
  const {value, type, focusPath, onFocus, level, onChange, onBlur} = props

  const handleFieldChange = React.useCallback((field, fieldPatchEvent) => {
    // Whenever the field input emits a patch event, we need to make sure to each of the included patches
    // are prefixed with its field name, e.g. going from:
    // {path: [], set: <nextvalue>} to {path: [<fieldName>], set: <nextValue>}
    // and ensure this input's value exists
    onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
  }, [])

  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <>
      {isOpen && (
        <Dialog onClose={() => setIsOpen(false)} padding="medium">
          <PresenceOverlay>
            <div style={{padding: 10}}>
              {type.fields.map((field, i) => (
                // Delegate to the generic FormBuilderInput. It will resolve and insert the actual input component
                // for the given field type
                <FormBuilderInput
                  level={level + 1}
                  key={field.name}
                  type={field.type}
                  value={value && value[field.name]}
                  onChange={(patchEvent) => handleFieldChange(field, patchEvent)}
                  path={[field.name]}
                  focusPath={focusPath}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              ))}
            </div>
          </PresenceOverlay>
        </Dialog>
      )}
      <div ref={ref} tabIndex={-1} onFocus={onFocus}>
        <div>{type.title}</div>
        <em>{type.description}</em>
        <div>
          <Button onClick={() => setIsOpen(true)}>Click to edit</Button>
          {!isOpen && <FieldPresence />} {/* Show field presence here! */}
        </div>
      </div>
    </>
  )
})
