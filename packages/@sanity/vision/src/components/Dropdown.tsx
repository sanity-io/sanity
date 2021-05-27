import React from 'react'

export interface DropdownProps {
  className?: string
  id?: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  value?: string
  values?: string[]
}

function Dropdown(props: DropdownProps) {
  const {id, value, className, values = [], onChange} = props

  return (
    <select id={id} className={className} value={value} onChange={onChange}>
      {values.map((val) => (
        <option key={val}>{val}</option>
      ))}
    </select>
  )
}

export default Dropdown
