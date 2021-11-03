import React, {ForwardedRef, forwardRef, memo, useCallback} from 'react'
import {
  Marker,
  MultiFieldSet,
  ObjectField,
  ObjectSchemaTypeWithOptions,
  Path,
  SingleFieldSet,
  Fieldset,
  ConditionalProperty,
} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormFieldSet} from '@sanity/base/components'

import {Grid} from '@sanity/ui'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import {applyAll} from '../../patch/applyPatch'
import {EMPTY_ARRAY} from '../../utils/empty'
import {ObjectInputField} from './ObjectInputField'
import {UnknownFields} from './UnknownFields'
import {ObjectFieldSet} from './ObjectFieldSet'
import {getCollapsedWithDefaults} from './utils'

const EMPTY_MARKERS: Marker[] = EMPTY_ARRAY
const EMPTY_PRESENCE: FormFieldPresence[] = EMPTY_ARRAY
const EMPTY_PATH: Path = EMPTY_ARRAY

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
      (field: ObjectField, fieldLevel: number, index: number) => {
        const fieldValue = value?.[field.name]
        if (!filterField(type, field)) {
          return null
        }

        return (
          <ObjectInputField
            parent={value}
            key={`field-${field.name}`}
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
            readOnly={readOnly}
            filterField={filterField}
            ref={index === 0 ? forwardedRef : null}
          />
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

    const renderFields = useCallback(() => {
      if (!type.fieldsets) {
        // this is a fallback for schema types that are not parsed to be objects, but still has jsonType == 'object'
        return (type.fields || []).map((field, index) => renderField(field, level + 1, index))
      }
      return type.fieldsets.map((fieldset, fieldsetIndex) => {
        return isSingleFieldset(fieldset) ? (
          renderField(fieldset.field, level + 1, fieldsetIndex)
        ) : (
          <ObjectFieldSet
            key={`fieldset-${(fieldset as MultiFieldSet).name}`}
            data-testid={`fieldset-${(fieldset as MultiFieldSet).name}`}
            fieldset={fieldset as MultiFieldSet}
            focusPath={focusPath}
            onFocus={onFocus}
            level={level + 1}
            presence={presence}
            markers={markers}
          >
            {() =>
              // lazy render children
              // eslint-disable-next-line max-nested-callbacks
              fieldset.fields.map((field, fieldIndex) =>
                renderField(field, level + 2, fieldsetIndex + fieldIndex)
              )
            }
          </ObjectFieldSet>
        )
      })
    }, [focusPath, level, markers, onFocus, presence, renderField, type.fields, type.fieldsets])

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
    }, [onChange, readOnly, type.fields, value])

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
      }
    }, [focusPath])

    const columns = type.options && type.options.columns
    if (level === 0) {
      // We don't want to render the fields wrapped in a fieldset if nesting level is 0
      // (e.g. when the object input is used as the root element in a form or a dialog)
      return (
        <Grid columns={columns} gapX={4} gapY={5}>
          {renderAllFields()}
        </Grid>
      )
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
        {renderAllFields}
      </FormFieldSet>
    )
  })
)
