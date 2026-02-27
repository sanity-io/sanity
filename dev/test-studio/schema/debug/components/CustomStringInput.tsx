import {set, type StringInputProps} from 'sanity'

export default function CustomStringInput(props: StringInputProps) {
  const {value, schemaType, onChange} = props

  return (
    <div style={{backgroundColor: '#f5ad3d'}}>
      <h3>{schemaType.title}</h3>
      <p>{schemaType.description}</p>
      <input
        type="text"
        placeholder={schemaType.placeholder}
        onChange={(event) => {
          onChange(set(event.target.value))
        }}
        value={value}
      />
    </div>
  )
}
