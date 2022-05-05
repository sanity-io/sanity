import React, {memo, useMemo} from 'react'
import {Stack} from '@sanity/ui'
import {ObjectInputProps} from '../../types'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {MemberFieldset} from './MemberFieldset'
import {MemberField} from './MemberField'

export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {
    schemaType,
    groups,
    members,
    onChange,
    renderInput,
    renderField,
    renderItem,
    level,
    value,
    id,
    path,
    onSelectFieldGroup,
    onSetFieldSetCollapsed,
  } = props

  const renderedUnknownFields = useMemo(() => {
    if (!schemaType.fields) {
      return null
    }

    const knownFieldNames = schemaType.fields.map((field) => field.name)
    const unknownFields = Object.keys(value || {}).filter(
      (key) => !key.startsWith('_') && !knownFieldNames.includes(key)
    )

    if (unknownFields.length === 0) {
      return null
    }

    return <UnknownFields fieldNames={unknownFields} value={value} onChange={onChange} />
  }, [onChange, schemaType.fields, value])

  return (
    <Stack space={5}>
      {groups.length > 0 ? (
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
        if (member.kind === 'field') {
          return (
            <MemberField
              key={member.key}
              member={member}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
            />
          )
        }
        return (
          <MemberFieldset
            key={member.key}
            member={member}
            renderInput={renderInput}
            renderField={renderField}
            renderItem={renderItem}
            onSetFieldSetCollapsed={onSetFieldSetCollapsed}
          />
        )
      })}
      {renderedUnknownFields}
    </Stack>
  )
})
