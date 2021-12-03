import React from 'react'
import {TabList} from '@sanity/ui'
import {FieldGroup} from '@sanity/types/src'
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
          const {name, title, icon, fields} = group

          if (!fields || fields.length === 0) {
            return null
          }

          return (
            <GroupTab
              key={`${inputId}-${name}-tab`}
              aria-controls={`${inputId}-field-group-fields`}
              icon={icon}
              onClick={onClick}
              selected={selectedName === name}
              title={title}
              {...group}
            />
          )
        })
        .filter(Boolean)}
    </TabList>
  )
})
