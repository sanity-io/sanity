import {type ObjectInputProps, set, setIfMissing} from 'sanity'

export default function CustomMyObjectInput(props: ObjectInputProps) {
  const {value, schemaType, onChange} = props
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
            onChange={(event) => {
              onChange([
                setIfMissing({_type: schemaType.name}),
                set(event.target.value, [field.name]),
              ])
            }}
          />
        </li>
      ))}
    </div>
  )
}
