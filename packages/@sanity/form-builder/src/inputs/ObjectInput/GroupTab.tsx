import React from 'react'
import {Tab} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'

interface GroupTabType extends Omit<FieldGroup, 'hidden'> {
  onClick: (string) => void
  autoFocus?: boolean
  selected: boolean
  hidden?: boolean
}

export const GroupTab = ({name, title, hidden, onClick, ...rest}: GroupTabType) => {
  const handleClick = React.useCallback(() => {
    onClick(name)
  }, [name, onClick])

  if (hidden) {
    return null
  }

  return (
    <Tab
      data-testid={`group-${name}`}
      aria-controls={rest['aria-controls']}
      size={1}
      id={`${name}-tab`}
      label={title || name}
      title={title || name}
      onClick={handleClick}
      {...rest}
    />
  )
}
