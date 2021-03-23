// Render a fieldset inside the object input
import React, {forwardRef, useMemo} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormFieldSet} from '@sanity/base/components'
import {Marker, MultiFieldSet, ObjectField, Path} from '@sanity/types'
import {EMPTY_ARRAY} from '../../utils/empty'
import {getCollapsedWithDefaults} from './utils'

const EMPTY_PATH: Path = EMPTY_ARRAY

interface Props {
  fieldset: MultiFieldSet
  focusPath: Path
  onFocus: (focusPath: Path) => void
  renderField: (field: ObjectField, level: number, index: number) => React.ReactNode
  level: number
  presence: FormFieldPresence[]
  markers: Marker[]
}

export const ObjectFieldSet = forwardRef(function ObjectFieldSet(props: Props, forwardedRef) {
  const {fieldset, focusPath, renderField, level, presence, markers, onFocus} = props
  const columns = fieldset.options && fieldset.options.columns

  const collapsibleOpts = getCollapsedWithDefaults(fieldset.options, level)
  const isExpanded =
    focusPath.length > 0 && fieldset.fields.some((field) => focusPath[0] === field.name)

  const fieldNames = useMemo(() => fieldset.fields.map((f) => f.name), [fieldset.fields])
  const isCollapsed = !isExpanded && collapsibleOpts.collapsed

  const childPresence = useMemo(() => {
    return !isCollapsed || presence.length === 0
      ? EMPTY_ARRAY
      : presence.filter(
          (item) => typeof item.path[0] === 'string' && fieldNames.includes(item.path[0])
        )
  }, [fieldNames, isCollapsed, presence])

  const childMarkers = useMemo(() => {
    return markers.length === 0
      ? markers
      : markers.filter(
          (item) => typeof item.path[0] === 'string' && fieldNames.includes(item.path[0])
        )
  }, [fieldNames, markers])

  const [stickyExpanded, setStickyExpanded] = React.useState(!collapsibleOpts.collapsed)

  const handleToggleFieldset = React.useCallback(
    (nextCollapsed) => {
      if (nextCollapsed) {
        setStickyExpanded(false)
        onFocus(EMPTY_PATH)
      } else {
        onFocus([fieldset.fields[0].name])
      }
    },
    [onFocus, fieldset.fields]
  )

  React.useEffect(() => {
    if (isExpanded) {
      setStickyExpanded(true)
    }
  }, [isExpanded])

  return (
    <FormFieldSet
      key={fieldset.name}
      title={fieldset.title}
      description={fieldset.description}
      level={level + 1}
      columns={columns}
      collapsible={collapsibleOpts.collapsible}
      collapsed={!isExpanded && !stickyExpanded}
      onToggle={handleToggleFieldset}
      __unstable_presence={isCollapsed ? childPresence : EMPTY_ARRAY}
      __unstable_changeIndicator={false}
      __unstable_markers={childMarkers}
      ref={isExpanded ? null : forwardedRef}
    >
      {fieldset.fields.map((field, i) => renderField(field, level, i))}
    </FormFieldSet>
  )
})
