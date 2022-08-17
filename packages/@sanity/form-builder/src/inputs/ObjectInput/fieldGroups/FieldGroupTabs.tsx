/* This is disabled to work around a bug with eslint-plugin-react */
/* eslint-disable react/no-unused-prop-types */
import React, {ForwardedRef, forwardRef, useCallback} from 'react'
import {ElementQuery, Select, TabList} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'
import styled from 'styled-components'
import {GroupOption, GroupTab} from './GroupTab'

interface FieldGroupTabsProps {
  inputId: string
  groups: FieldGroup[]
  shouldAutoFocus?: boolean
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
// disable eslint false positive
// eslint-disable-next-line react/display-name
const GroupTabs = forwardRef(
  (
    {inputId, groups, onClick, selectedName, shouldAutoFocus = true, disabled}: FieldGroupTabsProps,
    forwardedRef: ForwardedRef<HTMLButtonElement>
  ) => (
    <TabList space={2} data-testid="field-group-tabs" ref={forwardedRef}>
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
              autoFocus={selectedName === group.name && shouldAutoFocus}
              parent={groups}
              disabled={disabled}
              {...restGroup}
            />
          )
        })
        .filter(Boolean)}
    </TabList>
  )
)

/* For small screens, use Select from Sanity UI  */
const GroupSelect = ({
  groups,
  inputId,
  onSelect,
  selectedName,
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

// disable eslint false positive
// eslint-disable-next-line react/display-name
export const FieldGroupTabs = React.memo(
  forwardRef(function FieldGroupTabs(
    {onClick, disabled = false, ...props}: FieldGroupTabsProps,
    forwardedRef: ForwardedRef<any>
  ) {
    const {groups} = props

    const handleClick = useCallback(
      (groupName) => {
        onClick(groupName)
      },
      [onClick]
    )

    return (
      <Root data-testid="field-group-root">
        <GroupTabs {...props} ref={forwardedRef} disabled={disabled} onClick={handleClick} />
        <GroupSelect {...props} disabled={disabled} onSelect={handleClick} />
      </Root>
    )
  })
)
