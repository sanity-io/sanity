import React, {useCallback, useEffect} from 'react'
import {ElementQuery, Select, TabList} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'
import styled from 'styled-components'
import {useReviewChanges} from '../../../sanity/contexts'
import {GroupTab, GroupOption} from './Group'

interface FieldGroupTabsProps {
  inputId: string
  groups: FieldGroup[]
  title?: string
  selectedName?: string
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
const GroupTabs = ({inputId, groups, onClick, selectedName, disabled}: FieldGroupTabsProps) => (
  <TabList space={2} data-testid="field-group-tabs">
    {groups
      .map((group) => {
        const {fields, ...restGroup} = group

        if (!fields || fields.length === 0) {
          return null
        }
        return (
          <GroupTab
            key={`${inputId}-${group.name}-tab`}
            aria-controls={`${inputId}-field-group-fields`}
            onClick={onClick}
            selected={selectedName === group.name ?? group.default}
            autoFocus={selectedName === group.name}
            parent={groups}
            disabled={disabled}
            {...restGroup}
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
  selectedName,
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
      autoFocus
      disabled={disabled}
      value={selectedName}
    >
      {groups.map((group) => {
        // Separate hidden in order to resolve it to a boolean type
        const {fields, ...restGroup} = group

        if (!fields || fields.length === 0) {
          return null
        }

        return (
          <GroupOption
            key={`${inputId}-${group.name}-tab`}
            aria-controls={`${inputId}-field-group-fields`}
            selected={selectedName === group.name}
            parent={groups}
            {...restGroup}
          />
        )
      })}
    </Select>
  )
}

export const FieldGroupTabs = React.memo(function FieldGroupTabs({
  onClick,
  ...props
}: FieldGroupTabsProps) {
  const {changesOpen} = useReviewChanges()

  const handleClick = useCallback(
    (groupName) => {
      onClick(groupName)
    },
    [onClick]
  )

  useEffect(() => {
    if (changesOpen) {
      handleClick('all-fields')
    }
  }, [changesOpen, handleClick])

  return (
    <Root data-testid="field-group-root">
      <GroupTabs {...props} disabled={changesOpen} onClick={handleClick} />
      <GroupSelect {...props} disabled={changesOpen} onSelect={handleClick} />
    </Root>
  )
})
