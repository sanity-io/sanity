import React, {forwardRef} from 'react'
import {Tab} from '@sanity/ui'

interface GroupType {
  name: string
  title: string
  onClick?: (value: string) => void
  autoFocus?: boolean
  selected: boolean
  'aria-controls': string
  disabled?: boolean
}

export const GroupTab = forwardRef(function GroupTab(
  props: GroupType,
  ref: React.Ref<HTMLButtonElement>
) {
  // Separate props for resolving conditional hidden groups
  const {onClick} = props

  // Here goes the content of our component
  const handleClick = React.useCallback(() => {
    onClick?.(props.name)
  }, [props.name, onClick])

  return (
    <Tab
      data-testid={`group-tab-${name}`}
      size={1}
      id={`${props.name}-tab`}
      label={props.title}
      ref={ref}
      {...props}
      onClick={handleClick}
    />
  )
})

export const GroupOption = (props: Omit<GroupType, 'onClick' | 'autoFocus'>) => {
  const {name, title, ...rest} = props
  const {selected} = props

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
