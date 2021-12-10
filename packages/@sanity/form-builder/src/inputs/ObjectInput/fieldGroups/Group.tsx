import React, {forwardRef} from 'react'
import {Tab} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'
import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'

interface GroupType extends FieldGroup {
  onClick: (string) => void
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

  const isHidden = useConditionalProperty({
    checkProperty: hidden,
    checkPropertyKey: 'hidden',
    value: group,
    parent,
  })

  // Here goes the content of our component
  const handleClick = React.useCallback(() => {
    onClick(name)
  }, [name, onClick])

  if (isHidden) {
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

export const GroupOption = (props: Omit<GroupType, 'onClick' | 'autofocus'>) => {
  const {name, title, ...rest} = props
  // Separate props for resolving conditional hidden groups
  const {autoFocus, selected, hidden, parent, ...group} = props
  const isHidden = useConditionalProperty({
    checkProperty: hidden,
    checkPropertyKey: 'hidden',
    value: group,
    parent,
  })
  if (isHidden) {
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
