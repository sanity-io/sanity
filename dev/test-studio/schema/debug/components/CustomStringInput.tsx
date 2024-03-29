import {Component} from 'react'
import {set, type StringInputProps} from 'sanity'

export default class CustomStringInput extends Component<StringInputProps> {
  handleChange = (event) => {
    this.props.onChange(set(event.target.value))
  }

  render() {
    const {value, schemaType} = this.props
    return (
      <div style={{backgroundColor: '#f5ad3d'}}>
        <h3>{schemaType.title}</h3>
        <p>{schemaType.description}</p>
        <input
          type="text"
          placeholder={schemaType.placeholder}
          onChange={this.handleChange}
          value={value}
        />
      </div>
    )
  }
}
