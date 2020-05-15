import React from 'react'
import {FieldPresence, Overlay as PresenceOverlay} from '@sanity/components/presence'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Button from 'part:@sanity/components/buttons/default'

const byFieldName = fieldName => presenceItem => presenceItem.path[0] === fieldName

export function CustomInputWithDialogOverlay(props) {
  const {value, type, presence, onFocus, onChange} = props

  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <div>
      <div>{type.title}</div>
      <em>{type.description}</em>
      {isOpen ? (
        <Dialog>
          <PresenceOverlay>
            <DialogContent>
              <div style={{padding: 10}}>
                {type.fields.map(field => (
                  <div style={{display: 'flex'}}>
                    <div style={{minWidth: 100}}>{field.type.title}</div>
                    <input
                      type="text"
                      name={field.name}
                      value={(value || {})[field.name]}
                      onFocus={() => onFocus([field.name])}
                    />
                    <div style={{width: 20}}>
                      <FieldPresence presence={presence.filter(byFieldName(field.name))} />
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </PresenceOverlay>
        </Dialog>
      ) : (
        <div>
          <Button onClick={() => setIsOpen(true)}>Click to edit</Button>
        </div>
      )}
    </div>
  )
}
