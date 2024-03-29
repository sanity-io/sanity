import {Component} from 'react'
import {type ObjectInputProps, set, setIfMissing} from 'sanity'

export default class CustomMyObjectInput extends Component<ObjectInputProps> {
  handleChange = (field, event) => {
    const {schemaType, onChange} = this.props
    onChange([setIfMissing({_type: schemaType.name}), set(event.target.value, [field.name])])
  }

  render() {
    const {value, schemaType} = this.props
    return (
      <div style={{backgroundColor: '#f5ad3d'}}>
        <h3>{schemaType.title}</h3>
        <p>{schemaType.description}</p>
        {schemaType.fields.map((field) => (
          <li key={field.name}>
            <input
              type="text"
              value={(value && value[field.name]) || ''}
              placeholder={schemaType.placeholder}
              onChange={(event) => this.handleChange(field, event)}
            />
          </li>
        ))}
      </div>
    )
  }
}
