import React, {useCallback} from 'react'
import {ElementQuery, Select, TabList} from '@sanity/ui'
import styled from 'styled-components'
import {FormFieldGroup} from '../../../store'
import {GroupOption, GroupTab} from './GroupTab'

interface FieldGroupTabsProps {
  disabled?: boolean
  groups: FormFieldGroup[]
  inputId?: string
  onClick?: (name: string) => void
  shouldAutoFocus?: boolean
}

const Root = styled(ElementQuery)`
  /* Hide on small screens */
  &[data-eq-max~='0'] [data-ui='TabList'] {
    display: none;
  }

  /* Hide on medium to large screens */
  [data-ui='Select'] {
    display: none;
  }

  /* Show on small screens */
  &[data-eq-max~='0'] [data-ui='Select'] {
    display: block;
  }
`

/* For medium to large screens, use TabList and Tab from Sanity UI  */
const GroupTabs = ({
  inputId,
  groups,
  onClick,
  shouldAutoFocus = true,
  disabled,
}: FieldGroupTabsProps) => (
  <TabList space={2} data-testid="field-group-tabs">
    {groups.map((group) => {
      return (
        <GroupTab
          aria-controls={`${inputId}-field-group-fields`}
          autoFocus={shouldAutoFocus && group.selected}
          disabled={disabled || group.disabled}
          icon={group?.icon}
          key={`${inputId}-${group.name}-tab`}
          name={group.name}
          onClick={onClick}
          selected={Boolean(group.selected)}
          title={group.title || group.name}
        />
      )
    })}
  </TabList>
)

/* For small screens, use Select from Sanity UI  */
const GroupSelect = ({
  disabled,
  groups,
  inputId,
  onSelect,
  shouldAutoFocus = true,
}: Omit<FieldGroupTabsProps, 'onClick'> & {onSelect: (name: string) => void}) => {
  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onSelect(event.currentTarget.value)
    },
    [onSelect]
  )

  return (
    <Select
      aria-label="Field groups"
      autoFocus={shouldAutoFocus}
      data-testid="field-group-select"
      disabled={disabled}
      fontSize={2}
      muted
      onChange={handleSelect}
      value={groups.find((g) => g.selected)?.name}
    >
      {groups.map((group) => {
        // Separate hidden in order to resolve it to a boolean type
        return (
          <GroupOption
            aria-controls={`${inputId}-field-group-fields`}
            disabled={group.disabled}
            key={`${inputId}-${group.name}-tab`}
            name={group.name}
            selected={Boolean(group.selected)}
            title={group.title || group.name}
          />
        )
      })}
    </Select>
  )
}

export const FieldGroupTabs = React.memo(function FieldGroupTabs({
  disabled = false,
  onClick,
  ...props
}: FieldGroupTabsProps) {
  const handleClick = useCallback(
    (groupName: any) => {
      onClick?.(groupName)
    },
    [onClick]
  )

  return (
    <Root data-testid="field-group-root">
      <GroupTabs {...props} disabled={disabled} onClick={handleClick} />
      <GroupSelect {...props} disabled={disabled} onSelect={handleClick} />
    </Root>
  )
})
