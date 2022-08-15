import React, {useCallback} from 'react'
import {ElementQuery, Select, TabList} from '@sanity/ui'
import styled from 'styled-components'
import {FormFieldGroup} from '../../../types'
import {GroupOption, GroupTab} from './GroupTab'

interface FieldGroupTabsProps {
  inputId?: string
  groups: FormFieldGroup[]
  shouldAutoFocus?: boolean
  onClick?: (name: string) => void
  disabled?: boolean
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
    {groups
      .map((group) => {
        return (
          <GroupTab
            aria-controls={`${inputId}-field-group-fields`}
            autoFocus={shouldAutoFocus && group.selected}
            disabled={disabled}
            icon={group?.icon}
            key={`${inputId}-${group.name}-tab`}
            name={group.name}
            onClick={onClick}
            selected={Boolean(group.selected)}
            title={group.title || group.name}
          />
        )
      })
      .filter(Boolean)}
  </TabList>
)

/* For small screens, use Select from Sanity UI  */
const GroupSelect = ({
  groups,
  inputId,
  onSelect,
  shouldAutoFocus = true,
  disabled,
}: Omit<FieldGroupTabsProps, 'onClick'> & {onSelect: (name: string) => void}) => {
  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onSelect(event.currentTarget.value)
    },
    [onSelect]
  )

  return (
    <Select
      fontSize={2}
      onChange={handleSelect}
      muted
      data-testid="field-group-select"
      aria-label="Field groups"
      autoFocus={shouldAutoFocus}
      disabled={disabled}
      value={groups.find((g) => g.selected)?.name}
    >
      {groups.map((group) => {
        // Separate hidden in order to resolve it to a boolean type
        return (
          <GroupOption
            key={`${inputId}-${group.name}-tab`}
            aria-controls={`${inputId}-field-group-fields`}
            selected={Boolean(group.selected)}
            disabled={group.disabled}
            name={group.name}
            title={group.title || group.name}
          />
        )
      })}
    </Select>
  )
}

export const FieldGroupTabs = React.memo(function FieldGroupTabs({
  onClick,
  disabled = false,
  ...props
}: FieldGroupTabsProps) {
  const handleClick = useCallback(
    (groupName) => {
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
