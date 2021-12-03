import React from 'react'
import {TabList} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'
import {ConditionalHiddenGroup} from '../common/ConditionalHiddenGroup'
import {GroupTab} from './GroupTab'

interface FieldGroupTabsProps {
  inputId: string
  groups: FieldGroup[]
  title?: string
  selectedName?: string
  onClick?: (name: string) => void
}

export const FieldGroupTabs = React.memo(function FieldGroupTabs({
  groups,
  onClick,
  selectedName,
  inputId,
}: FieldGroupTabsProps) {
  return (
    <TabList space={2}>
      {groups
        .map((group) => {
          // Separate hidden in order to resolve it to a boolean type
          const {hidden, ...restGroup} = group
          const {fields} = group

          if (!fields || fields.length === 0) {
            return null
          }

          return (
            <ConditionalHiddenGroup
              key={`${inputId}-${group.name}-tab`}
              hidden={hidden}
              parent={groups}
              value={group}
            >
              <GroupTab
                aria-controls={`${inputId}-field-group-fields`}
                onClick={onClick}
                selected={selectedName === group.name}
                {...restGroup}
              />
            </ConditionalHiddenGroup>
          )
        })
        .filter(Boolean)}
    </TabList>
  )
})
