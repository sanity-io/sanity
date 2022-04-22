/* eslint-disable react/no-unused-prop-types,react/jsx-handler-names */

import React, {ForwardedRef, forwardRef, memo, useMemo} from 'react'
import {FormFieldSet} from '../../../components/formField'
import {EMPTY_ARRAY} from '../../utils/empty'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {MemberField} from './MemberField'
import {ObjectInputComponentProps} from '../../types_v3'

// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function

// disable eslint false positive
// eslint-disable-next-line react/display-name
export const ObjectInput = memo(
  forwardRef(function ObjectInput(
    props: ObjectInputComponentProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    const {
      type,
      groups,
      members,
      presence,
      validation,
      onChange,
      renderField,
      level = 0,
      value,
      id,
      path,
      onSelectFieldGroup,
      onSetCollapsed,
    } = props

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
        columns={props.type.options?.columns}
        collapsible={props.collapsible}
        collapsed={props.collapsed}
        onSetCollapsed={onSetCollapsed}
        __unstable_presence={props.collapsed ? presence : EMPTY_ARRAY}
        validation={props.collapsed ? validation : EMPTY_ARRAY}
        __unstable_changeIndicator={false}
      >
        {groups && groups?.length > 0 ? (
          <FieldGroupTabsWrapper $level={level} data-testid="field-groups">
            <FieldGroupTabs
              inputId={id}
              onClick={onSelectFieldGroup}
              groups={groups}
              shouldAutoFocus={path.length === 0}
            />
          </FieldGroupTabsWrapper>
        ) : null}

        {members.map((member) => {
          if (member.type === 'field') {
            return <MemberField member={member} renderField={renderField} key={member.key} />
          }

          return (
            <FormFieldSet
              key={member.key}
              title={member.fieldSet.title}
              collapsible={member.fieldSet.collapsible}
              collapsed={member.fieldSet.collapsed}
              onSetCollapsed={member.fieldSet.onSetCollapsed}
            >
              {member.fieldSet.fields.map((fieldsetMember) => (
                <MemberField
                  member={fieldsetMember}
                  renderField={renderField}
                  key={fieldsetMember.key}
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
