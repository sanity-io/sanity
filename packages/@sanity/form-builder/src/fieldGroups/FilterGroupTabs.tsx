import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {FieldGroup, ObjectSchemaType, Path, SchemaType} from '@sanity/types'
import {Card, Tab, TabList} from '@sanity/ui'
import {find, defaultTo, map} from 'lodash'
import {map as map$, publishReplay, refCount, startWith, tap, take} from 'rxjs/operators'
import {pipe, Subscription} from 'rxjs'
import {ConditionalHiddenField, ConditionalReadOnlyField} from '../inputs/common'
import {setSelectedTabName, selectedTab$, resetSelectedTab} from './datastore'

interface FieldGroupsTabsProps {
  type: SchemaType
  disabled?: boolean
  onChange?: (focusPath?: string) => void
  focusPath?: Path
}

export function FilterGroupTabs(props: FieldGroupsTabsProps) {
  const tabSubscription$ = useRef<Subscription>()
  const {type, disabled, focusPath, onChange} = props
  const groupType = type as ObjectSchemaType
  const [id, setId] = React.useState('all-fields')
  const filterGroups: FieldGroup[] = useMemo(() => {
    return [
      {
        name: 'all-fields',
        title: 'All fields',
        fields: groupType.fields,
      },
      ...(groupType.groups || []),
    ]
  }, [groupType.groups])

  const focusedFieldGroupPaths = useMemo(() => {
    const fieldsNames =
      defaultTo(
        find(filterGroups, (fieldGroup) => fieldGroup.name === id),
        filterGroups[0]
      )?.fields || []

    return map(fieldsNames || [], 'name')
  }, [filterGroups, id])

  const setNewId = useCallback((name: string) => {
    setSelectedTabName(name)
  }, [])

  // useEffect(() => {
  //   const [firstFocusPath] = focusPath || []

  //   console.log({firstFocusPath, id, focusedFieldGroupPaths})

  //   if (
  //     firstFocusPath &&
  //     !focusedFieldGroupPaths.includes(firstFocusPath.toString()) &&
  //     id !== 'all-fields'
  //   ) {
  //     setNewId('all-fields')
  //   }

  //   // @todo Check if focus path is not part of current ids
  // }, [focusPath])

  // Set local id from subscription change

  useEffect(() => {
    if (disabled) {
      setSelectedTabName('all-fields')
    } else {
      setSelectedTabName(id)
    }
  }, [disabled])

  useEffect(() => {
    tabSubscription$.current = selectedTab$.subscribe((newTabId) => {
      if (id !== newTabId) {
        setId(newTabId)
      }
    })

    return () => {
      if (tabSubscription$.current) {
        tabSubscription$.current.unsubscribe()
      }
    }
  }, [])

  // Handle focus automatically on id change
  // ---------

  // useEffect(() => {
  //   // setSelectedTabName(id)

  //   if (onChange) {
  //     // console.log({focusedFieldGroupPaths, focusPath})

  //     const focusedFieldGroupName = defaultTo(
  //       find(filterGroups, (fieldGroup) => fieldGroup.name === id),
  //       filterGroups[0]
  //     )?.fields?.[0].name
  //     // const firstFieldGroupName = filterGroups?.[0].fields?.[0]?.name
  //     onChange(focusedFieldGroupName)
  //   }
  // }, [id])

  // useEffect(() => {
  //   resetSelectedTab()
  // }, [focusPath])

  const handleClick = useCallback(
    (newTabId: string) => {
      setId(newTabId)
      setNewId(newTabId)
    },
    [setNewId]
  )

  useEffect(() => {
    const defaultTabName = defaultTo(
      find(filterGroups, (fieldGroup) => fieldGroup.isDefault),
      filterGroups[0]
    ).name

    if (id !== defaultTabName) {
      setNewId(defaultTabName)
      // console.log('set to default tab id', defaultTabName)
      // setId(defaultTabName)
    }
  }, [filterGroups])

  const tabs = useMemo(
    () => (
      <Card paddingBottom={4} data-testid="field-groups">
        <TabList space={2}>
          {filterGroups.map((group, i) => {
            const {name, readOnly, hidden}: FieldGroup = group
            return (
              <ConditionalHiddenField
                value={group}
                hidden={hidden}
                parent={filterGroups}
                key={`${name}-tab`}
              >
                <ConditionalReadOnlyField value={group} readOnly={readOnly} parent={filterGroups}>
                  <GroupTab
                    data-testid={`group-${name}`}
                    id={`${name}-tab`}
                    disabled={disabled}
                    autoFocus={id === name || group.isDefault}
                    onClick={() => handleClick(name)}
                    selected={id === name}
                    {...group}
                  />
                </ConditionalReadOnlyField>
              </ConditionalHiddenField>
            )
          })}
        </TabList>
      </Card>
    ),
    [disabled, filterGroups, handleClick, id]
  )

  return tabs
}

const GroupTab = ({readOnly, name, icon, title, disabled, ...rest}) => (
  <Tab
    data-testid={`group-${name}`}
    id={`${name}-tab`}
    icon={icon}
    size={1}
    aria-controls={`${name}-panel`}
    label={title || name}
    title={title || name}
    disabled={disabled || readOnly}
    {...rest}
  />
)
