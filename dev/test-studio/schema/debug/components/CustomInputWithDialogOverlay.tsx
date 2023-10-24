import React from 'react'
import {DocumentPresence, FieldPresence, PresenceOverlay, setIfMissing} from 'sanity'
import {Button} from '@sanity/ui'
import {ObjectSchemaType, Path} from '@sanity/types'
import {Dialog} from '../../../../../packages/sanity/src/ui/dialog'

export const CustomInputWithDialogOverlay = React.forwardRef(function CustomInputWithDialogOverlay(
  props: {
    focusPath?: Path
    level?: number
    onBlur: () => void
    onChange: (patches: any) => void
    onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
    presence: DocumentPresence[]
    schemaType: ObjectSchemaType
    value?: any
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {focusPath, level = 0, onBlur, onChange, onFocus, presence, schemaType, value} = props

  const handleFieldChange = React.useCallback(
    (field: any, fieldPatchEvent: any) => {
      // Whenever the field input emits a patch event, we need to make sure to each of the included patches
      // are prefixed with its field name, e.g. going from:
      // {path: [], set: <nextvalue>} to {path: [<fieldName>], set: <nextValue>}
      // and ensure this input's value exists
      onChange(
        fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: schemaType.name})),
      )
    },
    [onChange, schemaType.name],
  )

  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <>
      {isOpen && (
        <Dialog id="todo" onClose={() => setIsOpen(false)}>
          <PresenceOverlay>
            <div style={{padding: 10}}>
              {schemaType.fields.map((field, i) => (
                // Delegate to the generic FormBuilderInput. It will resolve and insert the actual input component
                // for the given field type
                <>TODO</>
                // <FormBuilderInput
                //   level={level + 1}
                //   key={field.name}
                //   type={field.type}
                //   value={value && value[field.name]}
                //   onChange={(patchEvent) => handleFieldChange(field, patchEvent)}
                //   path={[field.name]}
                //   focusPath={focusPath || []}
                //   onFocus={onFocus}
                //   onBlur={onBlur}
                //   presence={[]}
                //   validation={[]}
                // />
              ))}
            </div>
          </PresenceOverlay>
        </Dialog>
      )}
      <div ref={ref} tabIndex={-1} onFocus={onFocus}>
        <div>{schemaType.title}</div>
        <em>{schemaType.description}</em>
        <div>
          <Button onClick={() => setIsOpen(true)} text="Click to edit" />
          {!isOpen && <FieldPresence maxAvatars={3} presence={presence} />}
          {/* Show field presence here! */}
        </div>
      </div>
    </>
  )
})
