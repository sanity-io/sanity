import {set, type StringInputProps} from 'sanity'

export default function CustomStringInput(props: StringInputProps) {
  const {value, schemaType, onChange} = props

  return (
    <div style={{backgroundColor: '#f5ad3d'}}>
      <h3>{schemaType.title}</h3>
      <p>{schemaType.description}</p>
      <input
        type="text"
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        placeholder={schemaType.placeholder}
        onChange={(event) => {
          onChange(set(event.target.value))
        }}
        value={value}
        style={props.elementProps.style}
      />
    </div>
  )
}
