import React, {forwardRef} from 'react'
import {Tab} from '../../../../ui-components'

interface GroupType {
  'aria-controls': string
  autoFocus?: boolean
  disabled?: boolean
  icon?: React.ComponentType
  name: string
  onClick?: (value: string) => void
  selected: boolean
  title: string
}

export const GroupTab = forwardRef(function GroupTab(
  props: GroupType,
  ref: React.Ref<HTMLButtonElement>,
) {
  // Separate props for resolving conditional hidden groups
  const {onClick} = props

  // Here goes the content of our component
  const handleClick = React.useCallback(() => {
    onClick?.(props.name)
  }, [props.name, onClick])

  return (
    <Tab
      data-testid={`group-tab-${props.name}`}
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
