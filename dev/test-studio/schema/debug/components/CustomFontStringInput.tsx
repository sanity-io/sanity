import {set, type StringInputProps} from 'sanity'

import styles from './CustomFontStringInput.module.css'

export default function CustomFontStringInput(props: StringInputProps) {
  const {value, schemaType, onChange} = props
  return (
    <div>
      <h3>{schemaType.title}</h3>
      <p>{schemaType.description}</p>
      <input
        type="text"
        className={styles.input}
        placeholder={schemaType.placeholder}
        onChange={(event) => {
          onChange(set(event.target.value))
        }}
        value={value}
      />
    </div>
  )
}
