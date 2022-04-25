import React, {memo, useMemo} from 'react'
import {FormFieldSet} from '../../../components/formField'
import {EMPTY_ARRAY} from '../../utils/empty'
import {ObjectInputComponentProps} from '../../types'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {MemberField} from './MemberField'
import {MemberFieldset} from './MemberFieldset'

export const ObjectInput = memo(function ObjectInput(props: ObjectInputComponentProps) {
  const {
    type,
    groups,
    members,
    collapsed,
    collapsible,
    focusRef,
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
      ref={focusRef}
      level={level}
      title={type.title}
      description={type.description}
      columns={type.options?.columns}
      collapsible={collapsible}
      collapsed={collapsed}
      onSetCollapsed={onSetCollapsed}
      __unstable_presence={collapsed ? presence : EMPTY_ARRAY}
      validation={collapsed ? validation : EMPTY_ARRAY}
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
          return <MemberField key={member.key} member={member} renderField={renderField} />
        }

        return <MemberFieldset key={member.key} member={member} renderField={renderField} />
      })}
      {renderedUnknownFields}
    </FormFieldSet>
  )
})
