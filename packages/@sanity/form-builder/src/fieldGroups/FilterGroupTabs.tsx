import React, {useEffect, useMemo} from 'react'
import {FieldGroup, ObjectSchemaType, SchemaType} from '@sanity/types'
import {Card, Tab, TabList} from '@sanity/ui'
import {find, defaultTo} from 'lodash'
import {setSelectedTabName} from './datastore'

interface FieldGroupsTabsProps {
  type: SchemaType
}

export function FilterGroupTabs(props: FieldGroupsTabsProps) {
  const {type} = props
  const groupType = type as ObjectSchemaType
  const [id, setId] = React.useState('all-fields')
  const filterGroups: FieldGroup[] = useMemo(() => {
    return [
      {
        name: 'all-fields',
        title: 'All Fields',
      },
      ...(groupType.groups || []),
    ]
  }, [groupType.groups])

  useEffect(() => {
    setSelectedTabName(id)
  }, [id])

  useEffect(() => {
    const defaultTabName = defaultTo(
      find(filterGroups, (fieldGroup) => fieldGroup.isDefault),
      filterGroups[0]
    ).name

    if (id !== defaultTabName) {
      setId(defaultTabName)
    }
  }, [filterGroups])

  return (
    <Card paddingBottom={4} data-testid="field-groups">
      <TabList space={2}>
        {filterGroups.map((group) => {
          const {name, title, icon} = group

          return (
            <Tab
              data-testid={`group-${name}`}
              key={`${name}-tab`}
              id={`${name}-tab`}
              icon={icon}
              size={1}
              aria-controls={`${name}-panel`}
              label={title || name}
              onClick={() => setId(name)}
              selected={id === name}
            />
          )
        })}
      </TabList>
    </Card>
  )
}
