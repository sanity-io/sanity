import React from 'react'
import {Tab, TabProps} from '@sanity/ui'

interface GroupTabProps extends Omit<TabProps, 'label' | 'id'> {
  name: string
  title?: string
  onClick?: (name: string) => void
}

export const GroupTab = ({name, icon, title, onClick, ...rest}: GroupTabProps) => {
  const handleClick = React.useCallback(() => {
    onClick(name)
  }, [name, onClick])

  return (
    <Tab
      data-testid={`group-${name}`}
      id={`${name}-tab`}
      icon={icon}
      size={1}
      label={title || name}
      title={title || name}
      aria-controls={rest['aria-controls']}
      onClick={handleClick}
      {...rest}
    />
  )
}
