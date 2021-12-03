import React, {ForwardedRef, forwardRef, memo, useCallback, useState} from 'react'
import {
  Marker,
  MultiFieldSet,
  ObjectField,
  ObjectSchemaTypeWithOptions,
  Path,
  SingleFieldSet,
  Fieldset,
  ConditionalProperty,
  FieldGroup,
} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormFieldSet} from '@sanity/base/components'
import {Card, Grid, TabList} from '@sanity/ui'
import {castArray, find, defaultTo} from 'lodash'
import {useId} from '@reach/auto-id'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import {applyAll} from '../../patch/applyPatch'
import {EMPTY_ARRAY} from '../../utils/empty'
import {ConditionalReadOnlyField} from '../common/ConditionalReadOnlyField'
import {ObjectInputField} from './ObjectInputField'
import {UnknownFields} from './UnknownFields'
import {ObjectFieldSet} from './ObjectFieldSet'
import {getCollapsedWithDefaults} from './utils'
import {GroupTab} from './GroupTab'
import {FieldGroupTabs} from './FieldGroupTabs'

const EMPTY_MARKERS: Marker[] = EMPTY_ARRAY
const EMPTY_PRESENCE: FormFieldPresence[] = EMPTY_ARRAY
const EMPTY_PATH: Path = EMPTY_ARRAY
const DEFAULT_FIELD_GROUP_NAME = 'all-fields'

function isSingleFieldset(fieldset: Fieldset): fieldset is SingleFieldSet {
  return Boolean(fieldset.single)
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export interface Props {
  type: ObjectSchemaTypeWithOptions
  value?: Record<string, unknown>
  compareValue?: Record<string, unknown>
  onChange?: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath?: Path
  markers?: Marker[]
  level?: number
  readOnly?: ConditionalProperty
  isRoot?: boolean
  filterField?: (...args: any[]) => any
  presence: FormFieldPresence[]
}

const DEFAULT_FILTER_FIELD = () => true

/**
 * Please read this about collapsible fields
 * To support deep linking, the received focusPath must always takes precedence over internal collapsed/expanded state.
 * If a field has been expanded (either manually by the user, or because the focus path has caused it to expand) it
 * should then stay open and *not* collapse when the field loses focus (e.g. no autocollapse!)
 * If a field has been actively collapsed by the user, it must still expand again if it receives focus on a path within later on.
 */

// disable eslint false positive
// eslint-disable-next-line react/display-name
export const ObjectInput = memo(
  forwardRef(function ObjectInput(props: Props, forwardedRef: ForwardedRef<HTMLDivElement>) {
    const {
      type,
      presence = EMPTY_PRESENCE,
      markers = EMPTY_MARKERS,
      onChange,
      readOnly,
      level = 0,
      focusPath = EMPTY_PATH,
      isRoot = false,
      value,
      onFocus,
      onBlur,
      compareValue,
      filterField = DEFAULT_FILTER_FIELD,
    } = props

    const inputId = useId()
    const filterGroups: FieldGroup[] = React.useMemo(() => {
      if (!type.groups || type.groups.length === 0) {
        return []
      }

      return [
        {
          name: DEFAULT_FIELD_GROUP_NAME,
          title: 'All fields',
          fields: type.fields,
        },
        ...(type.groups || []),
      ]
    }, [type.groups, type.fields])
    const defaultFieldGroupName = React.useMemo(() => {
      if (filterGroups.length === 0) {
        return DEFAULT_FIELD_GROUP_NAME
      }

      return (
        defaultTo(
          find(filterGroups, (fieldGroup) => fieldGroup.default),
          filterGroups?.[0]
        )?.name || DEFAULT_FIELD_GROUP_NAME
      )
    }, [filterGroups])
    const [selectedFieldGroupName, setSelectedFieldGroupName] = useState(DEFAULT_FIELD_GROUP_NAME)
    const handleSelectTab = useCallback((tabName: string) => {
      setSelectedFieldGroupName(tabName)
    }, [])
    const hasGroups = filterGroups.length > 0

    const handleFieldChange = React.useCallback(
      (fieldEvent: PatchEvent, field: ObjectField) => {
        let event = fieldEvent.prefixAll(field.name)

        const patchesIncludesUnset = event.patches.some((patch) => patch.type === 'unset')

        // check if the result of the incoming patches will result in an empty object.
        // first apply all the patches to the current value to get the result.
        const result =
          // check if the patch includes an unset and bail out early if not
          patchesIncludesUnset &&
          applyAll(
            value || {},
            // unset the `_type` when computing the result since its auto-populated.
            // see note below for `_key`
            event.append(unset(['_type'])).patches
          )

        if (!isRoot) {
          // if the result has no keys left in it.
          // note: for arrays we retain empty objects so `_key` is not considered
          if (isRecord(result) && Object.keys(result).length === 0) {
            // then unset the whole object
            onChange?.(PatchEvent.from(unset()))
            return
          }

          event = event.prepend(setIfMissing(type.name === 'object' ? {} : {_type: type.name}))
          if (value) {
            const valueTypeName = value && value._type
            const schemaTypeName = type.name
            if (valueTypeName && schemaTypeName === 'object') {
              // The value has a _type key, but the type name from schema is 'object',
              // but _type: 'object' is implicit so we should fix it by removing it
              event = event.prepend(unset(['_type']))
            } else if (schemaTypeName !== 'object' && valueTypeName !== schemaTypeName) {
              // There's a mismatch between schema type and the value _type
              // fix it by setting _type to type name defined in schema
              event = event.prepend(set(schemaTypeName, ['_type']))
            }
          }
        }
        onChange?.(event)
      },
      [isRoot, onChange, type.name, value]
    )

    const renderField = React.useCallback(
      (
        field: ObjectField,
        fieldLevel: number,
        index: number,
        isFieldsetReadOnly?: ConditionalProperty,
        fieldSetValues?: Record<string, unknown>
      ) => {
        const fieldValue = value?.[field.name]
        if (!filterField(type, field)) {
          return null
        }

        return (
          <ConditionalReadOnlyField
            value={fieldSetValues}
            parent={value}
            readOnly={readOnly || isFieldsetReadOnly}
            key={`field-${field.name}`}
          >
            <ObjectInputField
              parent={value}
              field={field}
              value={fieldValue}
              onChange={handleFieldChange}
              onFocus={onFocus}
              onBlur={onBlur}
              compareValue={compareValue}
              markers={markers}
              focusPath={focusPath}
              level={fieldLevel}
              presence={presence}
              filterField={filterField}
              ref={index === 0 ? forwardedRef : null}
            />
          </ConditionalReadOnlyField>
        )
      },
      [
        compareValue,
        filterField,
        focusPath,
        forwardedRef,
        handleFieldChange,
        markers,
        onBlur,
        onFocus,
        presence,
        readOnly,
        type,
        value,
      ]
    )

    const fieldGroupPredictive = useCallback(
      (fieldToCheck) =>
        !hasGroups ||
        selectedFieldGroupName === DEFAULT_FIELD_GROUP_NAME ||
        (fieldToCheck.group && castArray(fieldToCheck.group).includes(selectedFieldGroupName)),
      [selectedFieldGroupName]
    )

    const fieldsForTypeAndGroup = React.useMemo(() => {
      return type.fields.filter(fieldGroupPredictive)
    }, [fieldGroupPredictive, type.fields])

    const fieldSetsForGroup = React.useMemo(() => {
      return type.fieldsets.filter((fieldset) => {
        if (selectedFieldGroupName === DEFAULT_FIELD_GROUP_NAME) {
          return true
        }

        const hasFieldsetGroups = fieldGroupPredictive(fieldset)

        if (fieldset.single === true) {
          const fieldBelongsToGroup = fieldGroupPredictive(fieldset.field)

          return hasFieldsetGroups || fieldBelongsToGroup
        }

        const hasGroupFields =
          hasFieldsetGroups || (!fieldset.single && fieldset.fields.some(fieldGroupPredictive))

        return hasGroupFields
      })
    }, [fieldGroupPredictive, selectedFieldGroupName, type.fieldsets])

    const renderFields = useCallback(() => {
      if (!type.fieldsets) {
        // this is a fallback for schema types that are not parsed to be objects, but still has jsonType == 'object'
        return (fieldsForTypeAndGroup || []).map((field, index) =>
          renderField(field, level + 1, index)
        )
      }

      return fieldSetsForGroup.map((fieldset, fieldsetIndex) => {
        if (isSingleFieldset(fieldset)) {
          return renderField(fieldset.field, level + 1, fieldsetIndex, fieldset.readOnly)
        }
        const fieldSetValuesObject = {}
        // eslint-disable-next-line max-nested-callbacks
        fieldset.fields.forEach((field) => {
          if (value) {
            fieldSetValuesObject[field.name] = value[field.name]
          }
        })

        return (
          <ObjectFieldSet
            key={`fieldset-${(fieldset as MultiFieldSet).name}`}
            data-testid={`fieldset-${(fieldset as MultiFieldSet).name}`}
            fieldset={fieldset as MultiFieldSet}
            focusPath={focusPath}
            onFocus={onFocus}
            level={level + 1}
            presence={presence}
            markers={markers}
            fieldSetParent={value}
            fieldValues={fieldSetValuesObject}
          >
            {() =>
              // lazy render children
              fieldset.fields
                .filter(fieldGroupPredictive)
                // eslint-disable-next-line max-nested-callbacks
                .map((field, fieldIndex) =>
                  renderField(
                    field,
                    level + 2,
                    fieldsetIndex + fieldIndex,
                    fieldset.readOnly,
                    fieldSetValuesObject
                  )
                )
            }
          </ObjectFieldSet>
        )
      })
    }, [
      type.fieldsets,
      fieldSetsForGroup,
      fieldsForTypeAndGroup,
      renderField,
      level,
      focusPath,
      onFocus,
      presence,
      markers,
      value,
      fieldGroupPredictive,
    ])

    const renderUnknownFields = useCallback(() => {
      if (!type.fields) {
        return null
      }

      const knownFieldNames = type.fields.map((field) => field.name)
      const unknownFields = Object.keys(value || {}).filter(
        (key) => !key.startsWith('_') && !knownFieldNames.includes(key)
      )

      if (unknownFields.length === 0) {
        return null
      }

      return <UnknownFields fieldNames={unknownFields} value={value} onChange={onChange} />
    }, [onChange, type.fields, value])

    const renderAllFields = useCallback(() => {
      return (
        <>
          {renderFields()}
          {renderUnknownFields()}
        </>
      )
    }, [renderFields, renderUnknownFields])

    const collapsibleOpts = getCollapsedWithDefaults(type.options, level)

    const [isCollapsed, setCollapsed] = React.useState(collapsibleOpts.collapsed)

    const handleToggleFieldset = React.useCallback(
      (nextCollapsed) => {
        if (nextCollapsed) {
          setCollapsed(true)
          // We can now put focus on the object value itself since it's collapsed
          onFocus([])
        } else {
          onFocus([type.fields[0].name])
        }
      },
      [onFocus, type.fields]
    )

    React.useEffect(() => {
      const hasFocusWithin = focusPath.length > 0
      if (hasFocusWithin) {
        setCollapsed(false)

        // Restore to default field group if focus path changes
        if (selectedFieldGroupName !== DEFAULT_FIELD_GROUP_NAME) {
          setSelectedFieldGroupName(DEFAULT_FIELD_GROUP_NAME)
        }
      }
    }, [focusPath])

    React.useEffect(() => {
      if (
        defaultFieldGroupName !== DEFAULT_FIELD_GROUP_NAME &&
        selectedFieldGroupName !== defaultFieldGroupName
      ) {
        setSelectedFieldGroupName(defaultFieldGroupName)
      }
    }, [defaultFieldGroupName])

    const columns = type.options && type.options.columns

    const renderFieldGroups = useCallback(() => {
      if (!hasGroups) {
        return (
          <Grid columns={columns} gapX={4} gapY={5}>
            {renderAllFields()}
          </Grid>
        )
      }

      return (
        <>
          <Card marginBottom={3} data-testid="field-groups">
            <FieldGroupTabs
              inputId={inputId}
              onClick={handleSelectTab}
              selectedName={selectedFieldGroupName}
              groups={filterGroups}
            />
            <Card paddingTop={4}>
              <Grid columns={columns} gapX={4} gapY={5} id={`${inputId}-field-group-fields`}>
                {renderAllFields()}
              </Grid>
            </Card>
          </Card>
        </>
      )
    }, [
      type.groups,
      type.fields,
      columns,
      renderAllFields,
      level,
      selectedFieldGroupName,
      handleSelectTab,
    ])

    if (level === 0) {
      // We don't want to render the fields wrapped in a fieldset if nesting level is 0
      // (e.g. when the object input is used as the root element in a form or a dialog)
      return <>{renderFieldGroups()}</>
    }

    return (
      <FormFieldSet
        ref={isCollapsed ? forwardedRef : null}
        level={level}
        title={type.title}
        description={type.description}
        columns={columns}
        collapsible={collapsibleOpts.collapsible}
        collapsed={isCollapsed}
        onToggle={handleToggleFieldset}
        __unstable_presence={isCollapsed ? presence : EMPTY_ARRAY}
        __unstable_markers={isCollapsed ? markers : EMPTY_ARRAY}
        __unstable_changeIndicator={false}
      >
        {renderFieldGroups()}
      </FormFieldSet>
    )
  })
)
