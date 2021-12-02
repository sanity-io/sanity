import React, {MutableRefObject, useCallback, useEffect, useMemo, useRef} from 'react'
import {FieldGroup, ObjectSchemaType, Path, SchemaType} from '@sanity/types'
import {Card, Tab, TabList} from '@sanity/ui'
import {find, defaultTo, map} from 'lodash'
import {map as map$, publishReplay, refCount, startWith, tap, take} from 'rxjs/operators'
import {pipe, Subscription} from 'rxjs'
import {ConditionalHiddenField, ConditionalReadOnlyField} from '../inputs/common'
import {setSelectedTabName, selectedTab$, resetSelectedTab, DEFAULT_TAB} from './datastore'

interface FieldGroupsTabsProps {
  type: SchemaType
  disabled?: boolean
  onChange?: (focusPath?: Path) => void
  focusPath?: Path
}

export function FilterGroupTabs(props: FieldGroupsTabsProps) {
  const isChangingTabRef = useRef<boolean>(false)
  const tabsRefs = useRef([])
  const tabSubscription$ = useRef<Subscription>()
  const {type, disabled, focusPath, onChange} = props
  const groupType = type as ObjectSchemaType
  const [id, setId] = React.useState(DEFAULT_TAB)
  const filterGroups: FieldGroup[] = useMemo(() => {
    return [
      {
        name: DEFAULT_TAB,
        title: 'All fields',
        fields: groupType.fields,
      },
      ...(groupType.groups || []),
    ]
  }, [groupType.groups])

  const getFocusedFieldGroupPaths = (checkId?: string) => {
    const fieldsNames =
      defaultTo(
        find(filterGroups, (fieldGroup) => fieldGroup.name === (checkId || id)),
        filterGroups[0]
      )?.fields || []

    return map(fieldsNames || [], 'name')
  }
  // }, [filterGroups, id])

  // console.log(filterGroups)

  const setNewId = useCallback(
    (name: string) => {
      setIsChangingTabs()
      setSelectedTabName(name)
    },
    [setSelectedTabName]
  )

  const setFocusPath = useCallback(
    (newFocusPath?: Path) => {
      // PathUtils.isEqual(focusPath, nextFocusPath)
      if (!onChange) {
        return
      }

      if (!newFocusPath) {
        onChange([])

        return
      }

      onChange(newFocusPath)
    },
    [onChange]
  )

  const setLocalId = useCallback((newTabId: string) => {
    setId(newTabId)
  }, [])

  const handleClick = useCallback(
    (newTabId: string) => {
      setIsChangingTabs()
      // Restore focus path to trigger focus path
      setFocusPath()

      setLocalId(newTabId)
      setNewId(newTabId)
    },
    [setNewId]
  )

  const setIsChangingTabs = (newValue = true) => {
    if (isChangingTabRef.current !== newValue) {
      isChangingTabRef.current = newValue
    }
  }

  // Handle when focus path changes and we are not displaying the focus path requested in the currently selected tab
  useEffect(() => {
    let [firstFocusPath] = focusPath || []

    if (Array.isArray(firstFocusPath)) {
      firstFocusPath = firstFocusPath?.[0]
    }

    // Reset back to All fields when
    // 1) focus path changes
    // 2) fhe first segment is not in the list of current fields showing
    if (
      firstFocusPath &&
      !getFocusedFieldGroupPaths(id).includes(firstFocusPath.toString()) &&
      id !== DEFAULT_TAB &&
      !isChangingTabRef.current
    ) {
      const beforeFocusPath = focusPath
      console.log({focused: getFocusedFieldGroupPaths(id), id})
      // console.log('changing focus state', focusPath)
      // @todo Reset before switching?
      setIsChangingTabs()
      setFocusPath()
      setLocalId(DEFAULT_TAB)
      resetSelectedTab()

      // @todo Restore focus path to trigger focus path
      setFocusPath(Array.isArray(beforeFocusPath) ? beforeFocusPath[0] : beforeFocusPath)
      setIsChangingTabs(false)
    }
  }, [focusPath])

  // Set local id from subscription change

  // Handle Review Changes or other states that requires the field group tabs to be disabled
  useEffect(() => {
    if (disabled) {
      setSelectedTabName(DEFAULT_TAB)
    } else {
      setSelectedTabName(id)
    }
  }, [disabled])

  // Setup subscriber to field group select listener
  useEffect(() => {
    tabSubscription$.current = selectedTab$.subscribe((newTabId) => {
      // console.log({id, newTabId})
      setLocalId(newTabId)
      setIsChangingTabs(false)
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

  // Set default tab selected when filter groups changes
  useEffect(() => {
    const defaultTabName = defaultTo(
      find(filterGroups, (fieldGroup) => fieldGroup.default),
      filterGroups[0]
    ).name

    if (id !== defaultTabName) {
      setId(defaultTabName)
      setNewId(defaultTabName)
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
                    autoFocus={id === name || group.default}
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
