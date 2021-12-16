import React, {useCallback, useEffect, useMemo, useState} from 'react'
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
  onStateChange?: (name: string, hidden: boolean) => void
  onGroupsStateChange?: (hidden: boolean) => void
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
  selectedName,
  onStateChange,
  disabled,
}: FieldGroupTabsProps) => (
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
            onStateChange={onStateChange}
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
  onStateChange,
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
            onStateChange={onStateChange}
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
  const {groups, onGroupsStateChange} = props

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

  const [hiddenGroups, setHiddenGroups] = useState([])
  const isAllGroupsHidden = useMemo(() => {
    return groups.filter((group) => !hiddenGroups.includes(group.name)).length < 2
  }, [hiddenGroups, groups])
  const handleGroupStateChange = useCallback((name: string, hidden: boolean) => {
    setHiddenGroups((currentHiddenGroups) => {
      const newHiddenGroups = [...(currentHiddenGroups || [])]
      // eslint-disable-next-line max-nested-callbacks
      const index = newHiddenGroups.findIndex((v: string) => v === name)
      const isAlreadyHidden = index > -1

      if (hidden && !isAlreadyHidden) {
        newHiddenGroups.push(name)

        return newHiddenGroups
      }

      if (!hidden && isAlreadyHidden) {
        newHiddenGroups.splice(index, 1)

        return newHiddenGroups
      }

      return currentHiddenGroups
    })
  }, [])

  useEffect(() => {
    if (onGroupsStateChange) {
      onGroupsStateChange(isAllGroupsHidden)
    }
  }, [isAllGroupsHidden, onGroupsStateChange])

  return (
    <Root data-testid="field-group-root" hidden={isAllGroupsHidden}>
      <GroupTabs
        {...props}
        disabled={changesOpen}
        onClick={handleClick}
        onStateChange={handleGroupStateChange}
      />
      <GroupSelect
        {...props}
        disabled={changesOpen}
        onSelect={handleClick}
        onStateChange={handleGroupStateChange}
      />
    </Root>
  )
})
