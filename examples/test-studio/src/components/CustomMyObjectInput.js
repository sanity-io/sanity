import {FormField, FormFieldSet} from '@sanity/base/components'
import {Stack} from '@sanity/ui'
import React from 'react'
import {PatchEvent, set, setIfMissing} from 'part:@sanity/form-builder/patch-event'

export default class CustomMyObjectInput extends React.Component {
  state = {collapsed: false}

  handleChange = (field, event) => {
    const {type, onChange} = this.props

    onChange(
      PatchEvent.from(setIfMissing({_type: type.name}), set(event.target.value, [field.name]))
    )
  }

  handleToggle = (collapsed) => {
    this.setState({collapsed})
  }

  render() {
    const {level = 0, markers, onBlur, onFocus, presence, value, type} = this.props
    const {collapsed} = this.state

    return (
      <FormFieldSet
        __unstable_changeIndicator
        __unstable_markers={markers}
        __unstable_presence={collapsed ? presence : undefined}
        collapsed={collapsed}
        collapsible
        description={type.description}
        level={level + 1}
        onToggle={this.handleToggle}
        title={type.title}
        // style={{backgroundColor: '#f5ad3d'}}
      >
        <Stack space={5}>
          {type.fields.map((field) => {
            const fieldMarkers = markers.filter((m) => {
              return m.path[0] === field.name
            })

            const fieldPresence = presence.filter((p) => {
              return p.path[0] === field.name
            })

            return (
              <FormField
                __unstable_changeIndicator={false}
                __unstable_markers={fieldMarkers}
                __unstable_presence={fieldPresence}
                key={field.name}
                title={field.title || field.name}
                description={field.description}
              >
                <input
                  type="text"
                  value={(value && value[field.name]) || ''}
                  placeholder={type.placeholder}
                  onChange={(event) => this.handleChange(field, event)}
                  onBlur={onBlur}
                  onFocus={() => onFocus([field.name])}
                />
              </FormField>
            )
          })}
        </Stack>
      </FormFieldSet>
    )
  }
}
