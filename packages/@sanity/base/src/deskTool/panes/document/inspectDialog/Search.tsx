import {SearchIcon} from '@sanity/icons'
import {TextInput} from '@sanity/ui'
import React, {useCallback} from 'react'

export function Search(props: {onChange: (q: string) => void; query: string}) {
  const {onChange, query} = props

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange]
  )

  return (
    <TextInput
      icon={SearchIcon}
      onChange={handleChange}
      placeholder="Search"
      radius={2}
      value={query || ''}
    />
  )
}
