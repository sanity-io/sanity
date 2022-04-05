/* eslint-disable react/no-unused-prop-types */

import React, {ForwardedRef, forwardRef, memo, useMemo} from 'react'
import {ObjectSchemaTypeWithOptions, Path, ValidationMarker} from '@sanity/types'
import {useId} from '@reach/auto-id'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

import {EMPTY_ARRAY} from '../../utils/empty'
import {useReviewChanges} from '../../sanity/contexts'
import {UnknownFields} from '../ObjectInput/UnknownFields'
import {getCollapsedWithDefaults} from '../ObjectInput/utils'
import {FieldGroupTabs} from '../ObjectInput/fieldGroups'
import {FieldGroupTabsWrapper} from '../ObjectInput/ObjectInput.styled'
import {FormFieldPresence} from '../../../presence'
import {FieldGroup, ObjectMember} from '../../store/types'
import {FormFieldSet} from '../../../components/formField/FormFieldSet'
import {ObjectFieldInput} from '../ObjectInput/ObjectFieldInput'
import {FormInputProps} from '../../types'

export interface DocumentInputProps
  extends FormInputProps<Record<string, unknown>, ObjectSchemaTypeWithOptions> {
  members: ObjectMember[]
  groups: FieldGroup[]
  onSelectGroup: (name: string) => void
}

// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const todo = () => {}

const EMPTY_VALIDATION: ValidationMarker[] = EMPTY_ARRAY
const EMPTY_PRESENCE: FormFieldPresence[] = EMPTY_ARRAY
const EMPTY_PATH: Path = EMPTY_ARRAY

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
export const DocumentInput = memo(
  forwardRef(function DocumentInput(
    props: DocumentInputProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    const {
      type,
      groups,
      members,
      presence = EMPTY_PRESENCE,
      validation = EMPTY_VALIDATION,
      onChange,
      readOnly,
      level = 0,
      focusPath = EMPTY_PATH,
      value,
      onSelectGroup,
      filterField = DEFAULT_FILTER_FIELD,
    } = props

    const {changesOpen} = useReviewChanges()
    const inputId = useId()

    const renderedUnknownFields = useMemo(() => {
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

    const collapsibleOpts = getCollapsedWithDefaults(type.options, level)

    const [isCollapsed, setCollapsed] = React.useState(collapsibleOpts.collapsed)

    return (
      <FormFieldSet
        ref={isCollapsed ? forwardedRef : null}
        level={level}
        title={type.title}
        description={type.description}
        // columns={columns}
        collapsible={collapsibleOpts.collapsible}
        collapsed={isCollapsed}
        // onToggle={handleToggleFieldset}
        __unstable_presence={isCollapsed ? presence : EMPTY_ARRAY}
        validation={isCollapsed ? validation : EMPTY_ARRAY}
        __unstable_changeIndicator={false}
      >
        {groups?.length > 0 ? (
          <FieldGroupTabsWrapper $level={level} data-testid="field-groups">
            <FieldGroupTabs
              disabled={changesOpen}
              inputId={inputId}
              onClick={onSelectGroup}
              groups={groups}
              shouldAutoFocus={
                level === 0 && (focusPath.length === 0 || focusPath[0] === FOCUS_TERMINATOR)
              }
            />
          </FieldGroupTabsWrapper>
        ) : null}
        {members.map((member, fieldsetIndex) => {
          if (member.type === 'field') {
            return (
              <ObjectFieldInput
                fieldName={member.field.name}
                level={member.field.level}
                type={member.field.type}
                validation={[]}
                onChange={(ev) => {
                  member.field.onChange(ev)
                }}
                value={member.field.value}
                onFocus={todo} // todo
                key={member.field.name}
              />
            )
          }

          return 'FIELDSET'
          // <ObjectFieldSet
          //   key={`fieldset-${(fieldset as MultiFieldSet).name}`}
          //   data-testid={`fieldset-${(fieldset as MultiFieldSet).name}`}
          //   fieldset={}
          //   focusPath={focusPath}
          //   onFocus={onFocus}
          //   level={level + 1}
          //   presence={presence}
          //   validation={validation}
          //   fieldSetParent={value}
          //   fieldValues={fieldSetValuesObject}
          // >
          //   {() =>
          //     // lazy render children
          //     fieldsetFields
          //       // eslint-disable-next-line max-nested-callbacks
          //       .map((field, fieldIndex) =>
          //         renderField(
          //           field,
          //           level + 2,
          //           fieldsetIndex + fieldIndex,
          //           fieldset.readOnly,
          //           fieldSetValuesObject
          //         )
          //       )
          //   }
          // </ObjectFieldSet>
        })}
        {renderedUnknownFields}
      </FormFieldSet>
    )
  })
)
