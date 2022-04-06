/* eslint-disable react/no-unused-prop-types */

import {ObjectSchemaTypeWithOptions, Path, ValidationMarker} from '@sanity/types'
import React, {ForwardedRef, forwardRef, memo, useMemo} from 'react'
import {useId} from '@reach/auto-id'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {FormFieldSet} from '../../../components/formField'
import {FormFieldPresence} from '../../../presence'
import {FormInputProps} from '../../types'
import {FieldGroup, ObjectMember, RenderFieldCallback} from '../../store/types'
import {EMPTY_ARRAY} from '../../utils/empty'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {MemberField} from './MemberField'

export interface ObjectInputProps
  extends FormInputProps<Record<string, unknown>, ObjectSchemaTypeWithOptions> {
  members: ObjectMember[]
  groups?: FieldGroup[]
  renderField: RenderFieldCallback
  onSelectGroup: (name: string) => void

  collapsible?: boolean
  collapsed?: boolean

  onExpand: () => void
  onCollapse: () => void
}

// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function

const EMPTY_VALIDATION: ValidationMarker[] = EMPTY_ARRAY
const EMPTY_PRESENCE: FormFieldPresence[] = EMPTY_ARRAY
const EMPTY_PATH: Path = EMPTY_ARRAY

// disable eslint false positive
// eslint-disable-next-line react/display-name
export const ObjectInput = memo(
  forwardRef(function ObjectInput(
    props: ObjectInputProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    const {
      type,
      groups,
      members,
      presence = EMPTY_PRESENCE,
      validation = EMPTY_VALIDATION,
      onChange,
      renderField,
      level = 0,
      focusPath = EMPTY_PATH,
      value,
      onSelectGroup,
    } = props

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

    return (
      <FormFieldSet
        ref={props.collapsed ? forwardedRef : null}
        level={level}
        title={type.title}
        description={type.description}
        // columns={columns}
        collapsible={props.collapsible}
        collapsed={props.collapsed}
        onToggle={props.collapsed ? props.onExpand : props.onCollapse}
        __unstable_presence={props.collapsed ? presence : EMPTY_ARRAY}
        validation={props.collapsed ? validation : EMPTY_ARRAY}
        __unstable_changeIndicator={false}
      >
        {groups && groups?.length > 0 ? (
          <FieldGroupTabsWrapper $level={level} data-testid="field-groups">
            <FieldGroupTabs
              inputId={inputId}
              onClick={onSelectGroup}
              groups={groups}
              shouldAutoFocus={
                level === 0 && (focusPath.length === 0 || focusPath[0] === FOCUS_TERMINATOR)
              }
            />
          </FieldGroupTabsWrapper>
        ) : null}

        {members.map((member) => {
          if (member.type === 'field') {
            return (
              <MemberField
                member={member}
                renderField={renderField}
                key={`field-${member.field.name}`}
              />
            )
          }

          return (
            <FormFieldSet
              key={`fieldset-${member.fieldSet.name}`}
              title={member.fieldSet.title}
              collapsible={member.fieldSet.collapsible}
              collapsed={member.fieldSet.collapsed}
              onToggle={
                member.fieldSet.collapsed ? member.fieldSet.onExpand : member.fieldSet.onCollapse
              }
            >
              {member.fieldSet.fields.map((fieldsetMember) => (
                <MemberField
                  member={fieldsetMember}
                  renderField={renderField}
                  key={fieldsetMember.field.name}
                />
              ))}
            </FormFieldSet>
          )
        })}
        {renderedUnknownFields}
      </FormFieldSet>
    )
  })
)
