import React, {forwardRef} from 'react'
import {Tab} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'

interface GroupType extends FieldGroup {
  onClick?: (value: string) => void
  autoFocus?: boolean
  selected: boolean
  parent: unknown
  'aria-controls': string
  disabled?: boolean
}

export const GroupTab = forwardRef(function GroupTab(
  props: GroupType,
  ref: React.Ref<HTMLButtonElement>
) {
  const {name, title} = props
  // Separate props for resolving conditional hidden groups
  const {onClick, parent, hidden, ...group} = props

  // Here goes the content of our component
  const handleClick = React.useCallback(() => {
    onClick?.(name)
  }, [name, onClick])

  if (hidden) {
    return null
  }

  return (
    <Tab
      data-testid={`group-tab-${name}`}
      size={1}
      id={`${name}-tab`}
      label={title || name}
      title={title || name}
      onClick={handleClick}
      {...group}
      ref={ref}
    />
  )
})

export const GroupOption = (props: Omit<GroupType, 'onClick' | 'autoFocus'>) => {
  const {name, title, ...rest} = props
  // Separate props for resolving conditional hidden groups
  const {selected, hidden} = props

  if (hidden) {
    return null
  }

  return (
    <option
      title={title}
      value={name}
      id={`${name}-tab`}
      aria-controls={rest['aria-controls']}
      data-testid={`group-select-${name}`}
      aria-selected={selected ? 'true' : 'false'}
    >
      {title || name}
    </option>
  )
}
