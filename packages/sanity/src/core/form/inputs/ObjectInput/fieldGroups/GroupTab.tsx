import {type ComponentType, useCallback, type RefAttributes} from 'react'

import {Tab} from '../../../../../ui-components/tab/Tab'

interface GroupType {
  'aria-controls': string
  'autoFocus'?: boolean
  'disabled'?: boolean
  'icon'?: ComponentType
  'name': string
  'onClick'?: (value: string) => void
  'selected': boolean
  'title': string
  'iconRight'?: React.ReactNode
}

export function GroupTab(props: GroupType & RefAttributes<HTMLButtonElement>) {
  // Separate props for resolving conditional hidden groups
  const {ref, onClick, name, title, ...rest} = props

  // Here goes the content of our component
  const handleClick = useCallback(() => {
    onClick?.(name)
  }, [name, onClick])

  return (
    <Tab
      data-testid={`group-tab-${name}`}
      id={`${name}-tab`}
      label={title}
      ref={ref}
      {...rest}
      name={name}
      title={title}
      onClick={handleClick}
    />
  )
}

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
      {title || name} {props.iconRight}
    </option>
  )
}
